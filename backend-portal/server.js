const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const qrcode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'genux-admin-super-secure-key-2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Paths for Web Portal and Admin Portal
const ADMIN_PUBLIC_DIR = path.join(__dirname, 'public');
const WEB_DIST_DIR = fs.existsSync(path.join(__dirname, 'public', 'web'))
  ? path.join(__dirname, 'public', 'web')
  : path.join(__dirname, '..', 'web-portal', 'dist');

// Serve Admin static assets under /admin
app.use('/admin', express.static(ADMIN_PUBLIC_DIR));

// Serve Web portal static assets under /
if (fs.existsSync(WEB_DIST_DIR)) {
  app.use(express.static(WEB_DIST_DIR));
} else {
  app.use(express.static(ADMIN_PUBLIC_DIR));
}

// Ensure data folder exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const AUTH_FILE = path.join(DATA_DIR, 'admin-auth.json');
const TELEMETRY_FILE = path.join(DATA_DIR, 'telemetry-db.json');

// Helper functions for storage
function readAuth() {
  if (!fs.existsSync(AUTH_FILE)) return { isInitialized: false, admin: null };
  try {
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  } catch (e) {
    return { isInitialized: false, admin: null };
  }
}

function saveAuth(data) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function readTelemetry() {
  if (!fs.existsSync(TELEMETRY_FILE)) {
    return {
      totalPings: 0,
      totalDownloads: 0,
      clients: {},
      errors: []
    };
  }
  try {
    return JSON.parse(fs.readFileSync(TELEMETRY_FILE, 'utf8'));
  } catch (e) {
    return { totalPings: 0, totalDownloads: 0, clients: {}, errors: [] };
  }
}

function saveTelemetry(data) {
  fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// In-memory pending registration holder (expires in 10 minutes)
let pendingRegistration = null;

// Simple IP geolocation resolver for telemetry analytics
function resolveGeo(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Netherlands', city: 'Amsterdam', countryCode: 'NL' };
  }
  // Deterministic geo mapping for demo / local reporting
  const hash = ip.split('.').reduce((acc, part) => acc + parseInt(part, 10), 0);
  const geos = [
    { country: 'Netherlands', city: 'Amsterdam', countryCode: 'NL' },
    { country: 'Germany', city: 'Frankfurt', countryCode: 'DE' },
    { country: 'United States', city: 'San Jose', countryCode: 'US' },
    { country: 'United Kingdom', city: 'London', countryCode: 'GB' },
    { country: 'France', city: 'Paris', countryCode: 'FR' },
    { country: 'Japan', city: 'Tokyo', countryCode: 'JP' }
  ];
  return geos[hash % geos.length];
}

// -------------------------------------------------------------------
// Authentication & 2FA Setup Endpoints
// -------------------------------------------------------------------

// Check initialization status
app.get('/api/auth/status', (req, res) => {
  const auth = readAuth();
  res.json({
    isInitialized: !!auth.isInitialized,
    username: auth.admin ? auth.admin.username : null
  });
});

// Step 1: Initialize first and ONLY admin account
app.post('/api/auth/register-init', async (req, res) => {
  const auth = readAuth();
  if (auth.isInitialized) {
    return res.status(403).json({ 
      error: 'Admin account already initialized. Exactly one master account is permitted.' 
    });
  }

  const { username, password } = req.body;
  if (!username || !password || password.length < 8) {
    return res.status(400).json({ 
      error: 'Username is required and password must be at least 8 characters long.' 
    });
  }

  // Generate Google Authenticator TOTP Secret
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(username, 'Genux AI Studio Portal', secret);
  const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

  pendingRegistration = {
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    secret,
    createdAt: Date.now()
  };

  res.json({
    success: true,
    secret,
    qrCodeDataUrl,
    message: 'Scan the QR code with Google Authenticator and enter the 6-digit code to activate your account.'
  });
});

// Step 2: Verify TOTP and permanently lock registration
app.post('/api/auth/register-verify', (req, res) => {
  const auth = readAuth();
  if (auth.isInitialized) {
    return res.status(403).json({ error: 'Admin account already initialized.' });
  }

  if (!pendingRegistration) {
    return res.status(400).json({ error: 'No registration in progress. Please start over.' });
  }

  const { token } = req.body;
  const isValid = authenticator.verify({
    token: String(token).trim(),
    secret: pendingRegistration.secret
  });

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid Google Authenticator code. Check your clock and try again.' });
  }

  // Save admin and permanently seal account creation
  saveAuth({
    isInitialized: true,
    admin: {
      username: pendingRegistration.username,
      passwordHash: pendingRegistration.passwordHash,
      secret: pendingRegistration.secret,
      createdAt: new Date().toISOString()
    }
  });

  const sessionToken = jwt.sign(
    { username: pendingRegistration.username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  pendingRegistration = null;

  res.json({
    success: true,
    token: sessionToken,
    message: 'Admin account secured with Google 2FA. Registration is now permanently sealed.'
  });
});

// Login with Username, Password and Google 2FA Token
app.post('/api/auth/login', (req, res) => {
  const auth = readAuth();
  if (!auth.isInitialized || !auth.admin) {
    return res.status(400).json({ error: 'Admin account not yet setup. Please complete first-time initialization.' });
  }

  const { username, password, token } = req.body;
  if (!username || !password || !token) {
    return res.status(400).json({ error: 'Username, password, and Google Authenticator 2FA code are required.' });
  }

  if (username !== auth.admin.username) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, auth.admin.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const isTotpValid = authenticator.verify({
    token: String(token).trim(),
    secret: auth.admin.secret
  });

  if (!isTotpValid) {
    return res.status(401).json({ error: 'Invalid 2FA Authenticator code.' });
  }

  const sessionToken = jwt.sign(
    { username: auth.admin.username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token: sessionToken,
    username: auth.admin.username
  });
});

// JWT Verification Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
}

// -------------------------------------------------------------------
// Telemetry Ingestion Endpoint (App Clients sync here when opted in)
// -------------------------------------------------------------------
app.post('/api/telemetry', (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const cleanIp = clientIp.split(',')[0].trim();
  const geo = resolveGeo(cleanIp);

  const payload = req.body || {};
  const db = readTelemetry();

  db.totalPings += 1;
  if (payload.downloadedIncrement) {
    db.totalDownloads += Number(payload.downloadedIncrement) || 1;
  }

  const clientId = payload.clientUuid || `client-${cleanIp}`;
  const now = new Date().toISOString();

  // Update client entry
  db.clients[clientId] = {
    clientId,
    ip: cleanIp,
    country: geo.country,
    city: geo.city,
    countryCode: geo.countryCode,
    gpu: payload.gpu || 'NVIDIA RTX Workstation GPU',
    vram: payload.vram || '16 GB',
    ram: payload.ram || '32 GB',
    cpu: payload.cpu || 'Multi-Core x64 Processor',
    os: payload.os || 'Windows 11 64-bit',
    appVersion: payload.appVersion || 'v1.0.4',
    downloadsCount: (db.clients[clientId]?.downloadsCount || 0) + (Number(payload.downloadedIncrement) || 0),
    lastSeen: now,
    firstSeen: db.clients[clientId]?.firstSeen || now
  };

  // Record errors if reported by client
  if (payload.errors && Array.isArray(payload.errors) && payload.errors.length > 0) {
    for (const err of payload.errors) {
      db.errors.unshift({
        id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        message: typeof err === 'string' ? err : err.message || 'Unknown runtime error',
        stack: err.stack || '',
        gpu: payload.gpu || 'Unknown GPU',
        appVersion: payload.appVersion || 'v1.0.4',
        ip: cleanIp,
        country: geo.country,
        timestamp: now
      });
    }
    // Limit to latest 500 errors
    if (db.errors.length > 500) {
      db.errors = db.errors.slice(0, 500);
    }
  }

  saveTelemetry(db);

  res.json({
    status: 'ok',
    syncedAt: now
  });
});

// -------------------------------------------------------------------
// Protected Admin Dashboard API
// -------------------------------------------------------------------
app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  const db = readTelemetry();
  const clientsList = Object.values(db.clients);

  // Group by GPU Model
  const gpuCounts = {};
  clientsList.forEach(c => {
    const gpu = c.gpu || 'Unknown GPU';
    gpuCounts[gpu] = (gpuCounts[gpu] || 0) + 1;
  });

  const sortedGpus = Object.entries(gpuCounts)
    .map(([model, count]) => ({
      model,
      count,
      percentage: Math.round((count / (clientsList.length || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  // Group by Country / Location
  const countryCounts = {};
  clientsList.forEach(c => {
    const country = c.country || 'Unknown';
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });

  const sortedCountries = Object.entries(countryCounts)
    .map(([country, count]) => ({
      country,
      count,
      percentage: Math.round((count / (clientsList.length || 1)) * 100)
    }))
    .sort((a, b) => b.count - a.count);

  res.json({
    overview: {
      totalClients: clientsList.length,
      totalPings: db.totalPings,
      totalDownloads: db.totalDownloads,
      totalErrors: db.errors.length
    },
    gpuBreakdown: sortedGpus,
    locationsBreakdown: sortedCountries,
    recentClients: clientsList.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)).slice(0, 50),
    recentErrors: db.errors.slice(0, 100)
  });
});

// Admin endpoint to clear error logs
app.post('/api/admin/clear-errors', requireAdmin, (req, res) => {
  const db = readTelemetry();
  db.errors = [];
  saveTelemetry(db);
  res.json({ success: true, message: 'Error log cleared.' });
});

// Fallback to SPA routing for Admin Portal and Web Portal
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    return res.sendFile(path.join(ADMIN_PUBLIC_DIR, 'index.html'));
  }
  const webIndex = path.join(WEB_DIST_DIR, 'index.html');
  if (fs.existsSync(webIndex)) {
    return res.sendFile(webIndex);
  }
  res.sendFile(path.join(ADMIN_PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎬 Genux AI Backend Admin Portal & Telemetry Hub`);
  console.log(`🌐 Portal URL:     http://localhost:${PORT}`);
  console.log(`🛡️  Google 2FA:     Enforced (Strict 1-Account Master Lock)`);
  console.log(`📡 Ingestion API:  http://localhost:${PORT}/api/telemetry`);
  console.log(`=======================================================`);
});
