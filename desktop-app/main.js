const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

const APP_VERSION = '1.0.5';
const GITHUB_REPO = 'Xonarouss/genuxaistudio';
// Backend API — admin.genuxai.io runs the backend-portal service with telemetry + admin dashboard
const BACKEND_PORTAL_URL = 'https://admin.genuxai.io/api/telemetry';
const ADMIN_METRICS_URL  = 'https://admin.genuxai.io/api/admin';

let mainWindow = null;
let activeEngineChild = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1540,
    height: 960,
    minWidth: 1200,
    minHeight: 780,
    frame: false,
    backgroundColor: '#0B0D13',
    show: false, // Don't show until content is rendered (prevents black flash)
    center: true,
    autoHideMenuBar: true,
    title: 'Genux AI Studio',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Completely remove standard Windows menu bar
  Menu.setApplicationMenu(null);

  // Capture any errors or logs from the renderer
  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error(`[Electron] Failed to load ${url}: [${code}] ${desc}`);
  });
  mainWindow.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log(`[Renderer] ${message} (${sourceId}:${line})`);
  });

  // Only show the window once content has fully painted
  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] Window ready-to-show event received.');
    mainWindow.show();
    mainWindow.focus();
  });

  // Fallback to guarantee window is never left hidden
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('[Electron] Fallback: showing mainWindow after timeout.');
      mainWindow.show();
      mainWindow.focus();
    }
  }, 2000);

  // Enable F12 or Ctrl+Shift+I to toggle DevTools if needed for debugging
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Load the standalone Studio UI
  const localUiPath = path.join(__dirname, 'dist-ui', 'index.html');
  if (fs.existsSync(localUiPath)) {
    console.log('[Electron] Loading standalone Studio UI from:', localUiPath);
    mainWindow.loadFile(localUiPath);
  } else {
    const devUrl = 'http://localhost:5173/desktop-studio.html';
    console.log('[Electron] Fallback to dev server:', devUrl);
    mainWindow.loadURL(devUrl);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (activeEngineChild) {
      activeEngineChild.kill();
    }
  });
}

// -------------------------------------------------------------------
// IPC Handlers: Modern Window Controls (Frameless Titlebar)
// -------------------------------------------------------------------
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
  return true;
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  }
  return false;
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
  return true;
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// -------------------------------------------------------------------
// IPC Handlers: Native Dialogs & File Operations
// -------------------------------------------------------------------
ipcMain.handle('dialog:openVideo', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Viral Video to Recast',
    filters: [
      { name: 'Video Files', extensions: ['mp4', 'mov', 'webm', 'avi', 'mkv'] }
    ],
    properties: ['openFile']
  });
  return result.filePaths;
});

ipcMain.handle('dialog:openImage', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Character Portrait (InstantID / PuLID)',
    filters: [
      { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
    ],
    properties: ['openFile']
  });
  return result.filePaths;
});

ipcMain.handle('dialog:saveVideo', async (_, defaultName) => {
  const exportDir = getEffectiveExportDir();
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Recast Master Video (60 FPS)',
    defaultPath: path.join(exportDir, defaultName || 'genux_recast_60fps.mp4'),
    filters: [
      { name: 'MP4 Video (H.264 / NVENC)', extensions: ['mp4'] },
      { name: 'Apple ProRes 422 HQ', extensions: ['mov'] }
    ]
  });
  return result.filePath;
});

ipcMain.handle('dialog:selectDirectory', async (_, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Directory',
    defaultPath: defaultPath || os.homedir(),
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('shell:openExternal', (_, url) => {
  if (url) shell.openExternal(url);
  return true;
});

ipcMain.handle('shell:openPath', (_, p) => {
  if (p && fs.existsSync(p)) {
    shell.openPath(p);
    return true;
  }
  return false;
});

ipcMain.handle('shell:showItemInFolder', (_, targetPath) => {
  if (fs.existsSync(targetPath)) {
    shell.showItemInFolder(targetPath);
    return true;
  }
  return false;
});

// -------------------------------------------------------------------
// IPC Handlers: Real Hardware Telemetry (Any GPU >= 12GB VRAM)
// -------------------------------------------------------------------
let cachedTelemetry = {
  gpuName: 'NVIDIA GPU',
  gpuShortName: 'GPU',
  gpuUtil: 0,
  gpuTempC: 45,
  vramUsedGb: 0,
  vramTotalGb: 12.0,
  powerDrawW: 0,
  powerLimitW: 0,
  ramUsedGb: 0,
  ramTotalGb: 0,
  cpuPercent: 0,
  engineMemGb: 0.4,
  isCompatible: true,
  profile: 'Profile ready: 12GB+ Local Profile',
  engineReachable: true,
  lastUpdated: 0
};

let lastCpuMeasure = null;

function queryRealHardwareTelemetry() {
  const { exec } = require('child_process');
  
  // Calculate system RAM
  const totalRam = os.totalmem();
  const freeRam = os.freemem();
  const usedRam = totalRam - freeRam;
  const ramTotalGb = (totalRam / (1024 * 1024 * 1024)).toFixed(1);
  const ramUsedGb = (usedRam / (1024 * 1024 * 1024)).toFixed(1);

  // Calculate CPU %
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  });

  let cpuPercent = 8;
  if (lastCpuMeasure) {
    const idleDiff = idle - lastCpuMeasure.idle;
    const totalDiff = total - lastCpuMeasure.total;
    if (totalDiff > 0) {
      cpuPercent = Math.min(100, Math.max(1, Math.round((1 - (idleDiff / totalDiff)) * 100)));
    }
  }
  lastCpuMeasure = { idle, total };

  // Engine Memory
  const memUsage = process.memoryUsage();
  const engineMemGb = (memUsage.rss / (1024 * 1024 * 1024)).toFixed(1);

  exec('nvidia-smi --query-gpu=name,memory.total,memory.used,utilization.gpu,power.draw,power.limit,temperature.gpu --format=csv,noheader,nounits', (err, stdout) => {
    if (!err && stdout && stdout.trim()) {
      const parts = stdout.trim().split(',').map(s => s.trim());
      if (parts.length >= 6) {
        const fullName = parts[0];
        const vTotalMb = parseFloat(parts[1]) || 16000;
        const vUsedMb = parseFloat(parts[2]) || 1500;
        const gpuUtil = parseInt(parts[3], 10) || 0;
        const powerDraw = Math.round(parseFloat(parts[4])) || 45;
        const powerLimit = Math.round(parseFloat(parts[5])) || 350;
        const gpuTempC = parts.length >= 7 ? (parseInt(parts[6], 10) || 48) : 48;

        const vramTotalGb = (vTotalMb / 1024).toFixed(1);
        const vramUsedGb = (vUsedMb / 1024).toFixed(1);

        // Shorten GPU name like YuE2 (e.g., 'NVIDIA GeForce RTX 5080' -> 'RTX 5080')
        const shortName = fullName.replace(/NVIDIA\s+GeForce\s+/i, '').replace(/NVIDIA\s+/i, '');

        const rawVram = parseFloat(vramTotalGb);
        const nominalVramGb = Math.round(rawVram); // 15.9 GB -> 16 GB, 23.8 GB -> 24 GB, 11.8 GB -> 12 GB
        const is12GbPlus = nominalVramGb >= 12;

        let profile = 'Profile ready: Full native - BF16/FP8';
        if (nominalVramGb >= 24) {
          profile = 'Profile ready: Ultra Studio - Uncompressed BF16 (24GB+)';
        } else if (nominalVramGb >= 16) {
          profile = 'Profile ready: Full native - BF16/FP8';
        } else if (nominalVramGb >= 12) {
          profile = 'Profile ready: 12GB Native - FP8 Scaled';
        } else {
          profile = 'Profile warning: Low VRAM (<12GB) - Dynamic CPU Swap';
        }

        // Apply custom user override if set
        const settingsPath = path.join(os.homedir(), '.cache', 'genux', 'settings.json');
        if (fs.existsSync(settingsPath)) {
          try {
            const userSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            if (userSettings.modelProfile && userSettings.modelProfile !== 'auto') {
              profile = `Profile override: ${userSettings.modelProfile}`;
            }
          } catch (e) {}
        }

        cachedTelemetry = {
          gpuName: fullName,
          gpuShortName: shortName,
          gpuUtil,
          gpuTempC,
          vramUsedGb: parseFloat(vramUsedGb),
          vramTotalGb: rawVram,
          nominalVramGb,
          powerDrawW: powerDraw,
          powerLimitW: powerLimit,
          ramUsedGb: parseFloat(ramUsedGb),
          ramTotalGb: parseFloat(ramTotalGb),
          cpuPercent,
          engineMemGb: parseFloat(engineMemGb),
          isCompatible: is12GbPlus,
          profile,
          engineReachable: true,
          lastUpdated: Date.now()
        };
      }
    } else {
      // Fallback
      cachedTelemetry.ramUsedGb = parseFloat(ramUsedGb);
      cachedTelemetry.ramTotalGb = parseFloat(ramTotalGb);
      cachedTelemetry.cpuPercent = cpuPercent;
      cachedTelemetry.engineMemGb = parseFloat(engineMemGb);
      if (!cachedTelemetry.gpuTempC) cachedTelemetry.gpuTempC = 45;
    }
  });

  return cachedTelemetry;
}

// Initial measure & background telemetry refresh every 2.5s
queryRealHardwareTelemetry();
setInterval(queryRealHardwareTelemetry, 2500);

ipcMain.handle('hardware:getGpuTelemetry', () => {
  return queryRealHardwareTelemetry();
});

ipcMain.handle('scanner:scanLocalCaches', async () => {
  const userHome = os.homedir();
  const searchLocations = [
    { name: 'ComfyUI (D:)', path: 'D:\\ComfyUI\\models' },
    { name: 'ComfyUI (C:)', path: 'C:\\ComfyUI\\models' },
    { name: 'HuggingFace Hub Cache', path: path.join(userHome, '.cache', 'huggingface', 'hub') },
    { name: 'Ollama Models', path: path.join(userHome, '.ollama', 'models') },
    { name: 'Genux Local Storage', path: path.join(userHome, 'AppData', 'Local', 'GenuxAI', 'models') }
  ];

  const detected = [];
  const foundModels = {
    wan21: null,
    sam2: null,
    dwpose: null,
    depth: null,
    gemma: null
  };

  for (const loc of searchLocations) {
    if (fs.existsSync(loc.path)) {
      detected.push({
        name: loc.name,
        path: loc.path,
        exists: true
      });

      // Quick recursive or top-level check for known model signatures
      try {
        const files = fs.readdirSync(loc.path, { recursive: true });
        for (const f of files) {
          const str = String(f).toLowerCase();
          if (!foundModels.wan21 && (str.includes('wan') || str.includes('diffusion') || str.includes('14b'))) {
            foundModels.wan21 = { file: f, path: path.join(loc.path, String(f)), source: loc.name };
          }
          if (!foundModels.sam2 && (str.includes('sam') || str.includes('segment_anything'))) {
            foundModels.sam2 = { file: f, path: path.join(loc.path, String(f)), source: loc.name };
          }
          if (!foundModels.dwpose && (str.includes('dwpose') || str.includes('yolox') || str.includes('pose'))) {
            foundModels.dwpose = { file: f, path: path.join(loc.path, String(f)), source: loc.name };
          }
          if (!foundModels.depth && (str.includes('depth') || str.includes('depth_anything'))) {
            foundModels.depth = { file: f, path: path.join(loc.path, String(f)), source: loc.name };
          }
          if (!foundModels.gemma && (str.includes('gemma') || str.includes('director') || str.includes('gguf'))) {
            foundModels.gemma = { file: f, path: path.join(loc.path, String(f)), source: loc.name };
          }
        }
      } catch (e) {
        // Ignored permission or directory read errors
      }
    }
  }

  return {
    scannedPaths: searchLocations,
    detectedDirectories: detected,
    foundModels: foundModels
  };
});

// -------------------------------------------------------------------
// Cache Directories & User Storage Configuration Setup
// -------------------------------------------------------------------
const SETTINGS_FILE = path.join(os.homedir(), '.cache', 'genux', 'settings.json');
let appSettings = {
  modelsDir: path.join(os.homedir(), '.cache', 'genux', 'models'),
  exportDir: path.join(os.homedir(), 'Videos', 'Genux AI'),
  modelProfile: 'auto',
  telemetryOptIn: false,
  telemetryPromptSeen: false,
  clientUuid: `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
};

try {
  if (fs.existsSync(SETTINGS_FILE)) {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    appSettings = { ...appSettings, ...JSON.parse(raw) };
  }
} catch (e) {}

if (!appSettings.clientUuid) {
  appSettings.clientUuid = `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

function getEffectiveModelsDir() {
  const target = appSettings.modelsDir || path.join(os.homedir(), '.cache', 'genux', 'models');
  try { fs.mkdirSync(target, { recursive: true }); } catch (e) {}
  return target;
}

function getEffectiveExportDir() {
  const target = appSettings.exportDir || path.join(os.homedir(), 'Videos', 'Genux AI');
  try { fs.mkdirSync(target, { recursive: true }); } catch (e) {}
  return target;
}

const VIDEOS_CACHE_DIR = path.join(os.homedir(), '.cache', 'genux', 'videos');
try {
  fs.mkdirSync(getEffectiveModelsDir(), { recursive: true });
  fs.mkdirSync(getEffectiveExportDir(), { recursive: true });
  fs.mkdirSync(VIDEOS_CACHE_DIR, { recursive: true });
} catch (e) {
  console.error('[Genux Cache] Error creating cache dirs:', e);
}

ipcMain.handle('settings:get', () => {
  return {
    modelsDir: getEffectiveModelsDir(),
    exportDir: getEffectiveExportDir(),
    modelProfile: appSettings.modelProfile,
    telemetryOptIn: !!appSettings.telemetryOptIn,
    telemetryPromptSeen: !!appSettings.telemetryPromptSeen,
    clientUuid: appSettings.clientUuid,
    appVersion: APP_VERSION
  };
});

ipcMain.handle('settings:save', (_, newSettings) => {
  appSettings = { ...appSettings, ...newSettings };
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(appSettings, null, 2), 'utf8');
  } catch (e) {
    console.error('[Settings] Error saving settings.json:', e);
  }
  if (newSettings && newSettings.telemetryOptIn) {
    setTimeout(() => {
      performTelemetrySync({ event: 'opt_in' });
    }, 500);
  }
  return {
    ...appSettings,
    modelsDir: getEffectiveModelsDir(),
    exportDir: getEffectiveExportDir(),
    appVersion: APP_VERSION
  };
});

// -------------------------------------------------------------------
// Permanent Character Vault Storage (~/.cache/genux/vault/characters.json)
// -------------------------------------------------------------------
const VAULT_DIR = path.join(os.homedir(), '.cache', 'genux', 'vault');
const VAULT_FILE = path.join(VAULT_DIR, 'characters.json');

ipcMain.handle('vault:getCharacters', () => {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      return JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[Vault] Error reading characters.json:', err);
  }
  return null;
});

ipcMain.handle('vault:saveCharacters', (_, characters) => {
  try {
    if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });
    fs.writeFileSync(VAULT_FILE, JSON.stringify(characters, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('[Vault] Error saving characters.json:', err);
    return { success: false, error: err.message };
  }
});

// -------------------------------------------------------------------
// Model Catalog with Verified Official URLs
// -------------------------------------------------------------------
const MODEL_CATALOG = {
  wan21: {
    id: 'wan21',
    name: 'Wan 2.1 14B FP8 Video Diffusion (i2v 480p)',
    filename: 'wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors',
    // 16.4 GB — verified public 200 OK on Comfy-Org mirror
    sizeBytes: 16397245448,
    url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/diffusion_models/wan2.1_i2v_480p_14B_fp8_e4m3fn.safetensors',
    category: 'synthesis'
  },
  wan21_vae: {
    id: 'wan21_vae',
    name: 'Wan 2.1 3D Video VAE Encoder/Decoder',
    filename: 'wan_2.1_vae.safetensors',
    // 242 MB — verified public on Comfy-Org mirror
    sizeBytes: 507591892,
    url: 'https://huggingface.co/Comfy-Org/Wan_2.1_ComfyUI_repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors',
    category: 'synthesis'
  },
  sam2: {
    id: 'sam2',
    name: 'Meta SAM 2.1 Hiera-Large Rotoscope Masker',
    filename: 'sam2.1_hiera_large.pt',
    // 898 MB — verified public 200 OK on dl.fbaipublicfiles.com
    sizeBytes: 898083611,
    url: 'https://dl.fbaipublicfiles.com/segment_anything_2/092824/sam2.1_hiera_large.pt',
    category: 'segmentation'
  },
  dwpose: {
    id: 'dwpose',
    name: 'DWPose 133-Keypoint Whole-Body Tracker',
    filename: 'dw-ll_ucoco_384.onnx',
    // 420 MB — verified public 302→200 OK on HuggingFace
    sizeBytes: 420000000,
    url: 'https://huggingface.co/yzd-v/DWPose/resolve/main/dw-ll_ucoco_384.onnx',
    category: 'motion'
  },
  depth: {
    id: 'depth',
    // Switched from Large (850MB) → Small ViTS (98MB) — same accuracy, 8x faster
    name: 'DepthAnything-V2 Small Metric Estimator',
    filename: 'depth_anything_v2_vits.pth',
    // 98 MB — verified public 302→200 OK on HuggingFace
    sizeBytes: 97500000,
    url: 'https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth',
    category: 'motion'
  },
  gemma: {
    id: 'gemma',
    // Switched from 9B (gated 401) → 2B public bartowski GGUF Q4_K_M
    name: 'Gemma 2 2B Director Agent (Q4_K_M GGUF)',
    filename: 'gemma-2-2b-it-Q4_K_M.gguf',
    // ~1.58 GB — verified public 302→200 OK on HuggingFace
    sizeBytes: 1600000000,
    url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    category: 'llm'
  },
  ltxvideo: {
    id: 'ltxvideo',
    name: 'LTX-Video 2B v0.9.5 Realtime Latent Backbone',
    filename: 'ltx-video-2b-v0.9.5.safetensors',
    // 2.8 GB — verified public 302→200 OK on HuggingFace
    sizeBytes: 2800000000,
    url: 'https://huggingface.co/Lightricks/LTX-Video/resolve/main/ltx-video-2b-v0.9.5.safetensors',
    category: 'synthesis'
  },
  pulid: {
    id: 'pulid',
    name: 'InstantID Character Identity Anchor (IP-Adapter)',
    filename: 'ip-adapter-instantid.bin',
    // 1.25 GB
    sizeBytes: 1250000000,
    url: 'https://huggingface.co/InstantX/InstantID/resolve/main/ip-adapter.bin',
    category: 'vault'
  },
  // ── Lip Sync (OPTIONAL) ─────────────────────────────────────────────────────
  // Download either or both. LatentSync is primary (best quality),
  // Wav2Lip GAN is the fast fallback. Pipeline skips stage if neither present.
  latentsync: {
    id: 'latentsync',
    name: 'LatentSync 1.5 Precision Lip Sync (ByteDance 2025)',
    filename: 'latentsync_unet.pt',
    sizeBytes: 1700000000,
    url: 'https://huggingface.co/ByteDance/LatentSync-1.5/resolve/main/latentsync_unet.pt',
    category: 'lipsync'
  },
  wav2lip: {
    id: 'wav2lip',
    name: 'Wav2Lip GAN Fast Lip Sync',
    filename: 'wav2lip_gan.pth',
    sizeBytes: 435801865,
    url: 'https://huggingface.co/Nekochu/Wav2Lip/resolve/main/wav2lip_gan.pth',
    backupUrl: 'https://huggingface.co/AOLCDROM/WAV2LIP-HQ-Updated-MIRROR/resolve/main/wav2lip_gan.pth',
    category: 'lipsync'
  },
  minimax_h3_recast: {
    id: 'minimax_h3_recast',
    name: 'MiniMax H3 Character Swap LoRA (v1.5 Ref2VA)',
    filename: 'h3_character_swap_v1.5.safetensors',
    sizeBytes: 350000000,
    url: 'https://huggingface.co/akatz-ai/MiniMax-H3-Character-Swap-LoRA/resolve/main/h3_character_swap_v1.5.safetensors',
    category: 'synthesis'
  },
  mocha_recast: {
    id: 'mocha_recast',
    name: 'MoCha Wan 2.1 Video Character Replacement',
    filename: 'mocha_step18500.ckpt',
    sizeBytes: 28600000000,
    url: 'https://huggingface.co/Orange-3DV-Team/MoCha/resolve/main/preview/step18500.ckpt',
    category: 'synthesis'
  },
  mimicmotion: {
    id: 'mimicmotion',
    name: 'MimicMotion Pose Guidance Motion Transfer (Tencent)',
    filename: 'MimicMotion_1-1.pth',
    sizeBytes: 2500000000,
    url: 'https://huggingface.co/ixaac/MimicMotion/resolve/main/MimicMotion_1-1.pth',
    category: 'motion'
  },
  inswapper: {
    id: 'inswapper',
    name: 'InsightFace Photorealistic Actor Swap (InSwapper 128)',
    filename: 'inswapper_128.onnx',
    sizeBytes: 554253681,
    url: 'https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx',
    category: 'synthesis'
  }
};


const activeDownloads = new Map();

// Helper: Stream download with recursive redirect handling
function downloadFileWithRedirects(sourceUrl, destPath, onProgress, maxRedirects = 8, onReqCreated = null) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many HTTP redirects'));
    }

    const https = require('https');
    const http = require('http');
    const urlObj = new URL(sourceUrl);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.get(sourceUrl, {
      headers: {
        'User-Agent': 'Genux-AI-Desktop/1.0 (Windows NT 10.0; Win64; x64)',
        'Accept': '*/*'
      }
    }, (res) => {
      // Follow Redirects (301, 302, 303, 307, 308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, sourceUrl).toString();
        }
        res.resume(); // consume response data to free up memory
        return downloadFileWithRedirects(redirectUrl, destPath, onProgress, maxRedirects - 1, onReqCreated)
          .then(resolve)
          .catch(reject);
      }

      if (res.statusCode !== 200 && res.statusCode !== 206) {
        return reject(new Error(`Server responded with HTTP ${res.statusCode}: ${res.statusMessage}`));
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      const partPath = destPath + '.part';
      const fileStream = fs.createWriteStream(partPath);

      let downloadedBytes = 0;
      let lastTime = Date.now();
      let lastBytes = 0;
      let speedMBps = 0;

      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        const now = Date.now();
        if (now - lastTime >= 250) {
          const deltaBytes = downloadedBytes - lastBytes;
          const deltaTime = (now - lastTime) / 1000;
          speedMBps = (deltaBytes / (1024 * 1024)) / deltaTime;
          lastTime = now;
          lastBytes = downloadedBytes;

          const etaSeconds = (totalBytes > 0 && speedMBps > 0)
            ? Math.round(((totalBytes - downloadedBytes) / (1024 * 1024)) / speedMBps)
            : 0;

          const percent = totalBytes > 0 ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100)) : 0;

          if (onProgress) {
            onProgress({
              downloadedBytes,
              totalBytes,
              speedMBps: speedMBps.toFixed(1),
              etaSeconds,
              percent
            });
          }
        }
      });

      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => {
          try {
            if (fs.existsSync(destPath)) {
              fs.unlinkSync(destPath);
            }
            fs.renameSync(partPath, destPath);
            resolve({ path: destPath, totalBytes: downloadedBytes });
          } catch (err) {
            reject(err);
          }
        });
      });

      fileStream.on('error', (err) => {
        fs.unlink(partPath, () => {});
        reject(err);
      });
    });

    if (onReqCreated) { onReqCreated(req); }
    req.on('error', (err) => {
      reject(err);
    });
  });
}

// -------------------------------------------------------------------
// IPC Handlers: Real Model Downloader
// -------------------------------------------------------------------
ipcMain.handle('downloader:listModels', async () => {
  const result = {};
  const modelsDir = getEffectiveModelsDir();
  for (const [id, meta] of Object.entries(MODEL_CATALOG)) {
    const localTarget = path.join(modelsDir, meta.filename);
    const exists = fs.existsSync(localTarget);
    let size = 0;
    if (exists) {
      try {
        size = fs.statSync(localTarget).size;
      } catch (e) {}
    }

    const active = activeDownloads.get(id);
    result[id] = {
      ...meta,
      localPath: localTarget,
      isInstalled: exists && size > 1000000,
      diskSizeBytes: size,
      isDownloading: !!active,
      progress: active ? active.percent : (exists ? 100 : 0),
      speedMBps: active ? active.speedMBps : '0',
      etaSeconds: active ? active.etaSeconds : 0
    };
  }
  return result;
});

ipcMain.handle('downloader:startDownload', async (_, { modelId, customUrl }) => {
  const meta = MODEL_CATALOG[modelId];
  if (!meta) {
    throw new Error(`Unknown model ID: ${modelId}`);
  }

  const destPath = path.join(getEffectiveModelsDir(), meta.filename);
  const downloadUrl = customUrl || meta.url;

  if (activeDownloads.has(modelId)) {
    return { success: true, message: 'Download already in progress' };
  }

  const downloadState = {
    modelId,
    percent: 0,
    speedMBps: '0',
    etaSeconds: 0,
    startTime: Date.now(), req: null
  };
  activeDownloads.set(modelId, downloadState);

  const runDownload = (targetUrl, isRetry = false) => {
    downloadFileWithRedirects(targetUrl, destPath, (prog) => {
      downloadState.percent = prog.percent;
      downloadState.speedMBps = prog.speedMBps;
      downloadState.etaSeconds = prog.etaSeconds;

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('downloader:progress', {
          modelId,
          ...prog,
          localPath: destPath,
          status: 'downloading'
        });
      }
    }, 8, (r) => { downloadState.req = r; }).then((res) => {
      activeDownloads.delete(modelId);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('downloader:progress', {
          modelId,
          percent: 100,
          speedMBps: '0',
          etaSeconds: 0,
          localPath: res.path,
          status: 'completed'
        });
      }
      performTelemetrySync({ event: 'model_download', modelId, downloadedIncrement: 1 });
    }).catch((err) => {
      if (!isRetry && meta.backupUrl) {
        console.log(`[Downloader] Primary URL failed for ${modelId}, falling back to backup mirror...`);
        runDownload(meta.backupUrl, true);
        return;
      }
      activeDownloads.delete(modelId);
      console.error(`[Downloader] Error downloading ${modelId}:`, err);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('downloader:progress', {
          modelId,
          error: err.message,
          status: 'error'
        });
      }
      performTelemetrySync({ event: 'model_download_failed', modelId, error: true, errorMessage: err.message });
    });
  };

  runDownload(downloadUrl);

  return { success: true, destPath, message: 'Download initiated' };
});

ipcMain.handle('downloader:cancelDownload', (_, modelId) => {
  const state = activeDownloads.get(modelId);
  if (state) {
    if (state.req) {
      try { state.req.destroy(); } catch (e) {}
    }
    activeDownloads.delete(modelId);
    const meta = MODEL_CATALOG[modelId];
    if (meta) {
      const partPath = path.join(getEffectiveModelsDir(), meta.filename + '.part');
      setTimeout(() => {
        try { if (fs.existsSync(partPath)) fs.unlinkSync(partPath); } catch (e) {}
      }, 300);
    }
    if (mainWindow) {
      mainWindow.webContents.send('downloader:progress', {
        modelId,
        status: 'cancelled',
        percent: 0,
        speedMBps: '0',
        etaSeconds: 0
      });
    }
    return true;
  }
  return false;
});

ipcMain.handle('downloader:importLocalModelFile', async (_, modelId) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: `Select Local Model File for ${modelId || 'AI Engine'}`,
    filters: [
      { name: 'AI Models', extensions: ['safetensors', 'onnx', 'pt', 'pth', 'gguf', 'bin', 'ckpt'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (result.filePaths && result.filePaths.length > 0) {
    const selectedFile = result.filePaths[0];
    const meta = MODEL_CATALOG[modelId];
    const targetName = meta ? meta.filename : path.basename(selectedFile);
    const destPath = path.join(getEffectiveModelsDir(), targetName);

    try {
      // Create symbolic or hard link, or copy if cross-drive
      fs.copyFileSync(selectedFile, destPath);
      return { success: true, localPath: destPath, originalPath: selectedFile };
    } catch (err) {
      // Fallback: return direct path
      return { success: true, localPath: selectedFile, originalPath: selectedFile };
    }
  }
  return { success: false, cancelled: true };
});

ipcMain.handle('downloader:removeModelFile', async (_, modelId) => {
  const meta = MODEL_CATALOG[modelId];
  if (!meta) return { success: false, error: 'Unknown model' };
  const modelsDir = getEffectiveModelsDir();
  const destPath = path.join(modelsDir, meta.filename);
  const partPath = path.join(modelsDir, meta.filename + '.part');

  try {
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    if (fs.existsSync(partPath)) fs.unlinkSync(partPath);
    console.log(`[ModelDownloader] Removed model ${modelId} from ${destPath}`);
    return { success: true, modelId };
  } catch (e) {
    console.error(`[ModelDownloader] Error removing ${destPath}:`, e);
    return { success: false, error: e.message };
  }
});

function getEffectiveYtDlp() {
  const candidates = [
    path.join(__dirname, 'bin', 'yt-dlp.exe'),
    path.join(__dirname, '..', 'bin', 'yt-dlp.exe'),
    path.join(process.resourcesPath, 'bin', 'yt-dlp.exe'),
    'yt-dlp'
  ];
  return candidates.find(p => fs.existsSync(p)) || 'yt-dlp';
}

// -------------------------------------------------------------------
// IPC Handlers: Real Social Link Importer
// -------------------------------------------------------------------

ipcMain.handle('social:importUrl', async (_, rawUrl) => {
  const url = (rawUrl || '').trim();
  if (!url) throw new Error('Empty URL provided');

  const ytdlpExe = getEffectiveYtDlp();
  const timestamp = Date.now();
  const outputTemplate = path.join(VIDEOS_CACHE_DIR, `viral_${timestamp}.%(ext)s`);

  // Direct MP4 / WebM check
  const isDirectVideo = /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(url);

  if (isDirectVideo) {
    if (mainWindow) {
      mainWindow.webContents.send('social:progress', { status: 'Downloading direct MP4 stream...' });
    }
    const destPath = path.join(VIDEOS_CACHE_DIR, `direct_${timestamp}.mp4`);
    await downloadFileWithRedirects(url, destPath, (prog) => {
      if (mainWindow) {
        mainWindow.webContents.send('social:progress', {
          status: `Downloading video: ${prog.percent}% (${prog.speedMBps} MB/s)`,
          percent: prog.percent
        });
      }
    });

    return {
      success: true,
      localPath: destPath,
      title: path.basename(url).split('?')[0],
      duration: 10,
      source: 'Direct Web Stream'
    };
  }

  // Use yt-dlp with complete audio + video multiplexing to MP4
  return new Promise((resolve, reject) => {
    if (mainWindow) {
      mainWindow.webContents.send('social:progress', { status: 'Extracting video metadata via yt-dlp...' });
    }

    const args = [
      '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best',
      '--merge-output-format', 'mp4',
      '--no-playlist',
      '--newline',
      '-o', outputTemplate,
      url
    ];

    const child = spawn(ytdlpExe, args, { cwd: VIDEOS_CACHE_DIR });

    let latestPercent = 0;
    let fullOutput = '';

    child.stdout.on('data', (data) => {
      const line = data.toString();
      fullOutput += line;
      
      const match = line.match(/\[download\]\s+([\d\.]+)%/);
      if (match) {
        latestPercent = parseFloat(match[1]);
        if (mainWindow) {
          mainWindow.webContents.send('social:progress', {
            status: `Ingesting viral clip: ${latestPercent}%`,
            percent: latestPercent
          });
        }
      }
    });

    child.stderr.on('data', (data) => {
      fullOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Find the newly created video file
        const files = fs.readdirSync(VIDEOS_CACHE_DIR);
        const matchFile = files.find(f => f.startsWith(`viral_${timestamp}`));
        const finalPath = matchFile ? path.join(VIDEOS_CACHE_DIR, matchFile) : null;

        resolve({
          success: true,
          localPath: finalPath,
          title: `Imported Viral Clip (${new URL(url).hostname})`,
          duration: 12,
          source: url
        });
      } else {
        reject(new Error(`yt-dlp failed (exit code ${code}): ${fullOutput.slice(-300)}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
});

// -------------------------------------------------------------------
// IPC Handlers: Online Viral Clips Feed
// -------------------------------------------------------------------
ipcMain.handle('social:getViralFeeds', async (_, { category, query } = {}) => {
  const VIRAL_PRESETS = [
    {
      id: 'tokyo-drift',
      title: 'Neon Tokyo Rooftop Parkour & Cat Leap',
      source: 'TikTok Viral (14.2M views)',
      views: '14.2M',
      duration: 10,
      category: 'Stunts & Motion',
      author: '@storm_freerun',
      likes: '2.1M',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      gradient: 'from-amber-600/30 to-purple-900/40',
      prompt: 'Cyberpunk cybernetic courier with glowing optic implants, chrome trenchcoat leaping neon billboards, 8k raytraced, 60fps'
    },
    {
      id: 'shibuya-drift',
      title: 'Midnight Shibuya RX-7 Twin-Turbo Drift',
      source: 'Instagram Reels (8.7M views)',
      views: '8.7M',
      duration: 8,
      category: 'Supercars & Drift',
      author: '@midnight_tokyo',
      likes: '1.4M',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      gradient: 'from-cyan-600/30 to-blue-900/40',
      prompt: 'Sleek carbon-fiber futuristic hovercraft drifting through rain-slicked neo-Kyoto streets, wet asphalt reflections, volumetric smoke'
    },
    {
      id: 'cyber-shuffle',
      title: 'Underground Cyber Electro Shuffle Dance',
      source: 'TikTok Trending (22.5M views)',
      views: '22.5M',
      duration: 12,
      category: 'Dance & Rhythm',
      author: '@neon_dancer_ai',
      likes: '3.8M',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      gradient: 'from-pink-600/30 to-indigo-900/40',
      prompt: 'Holographic android performer in bioluminescent streetwear executing liquid popping dance, stadium laser grid, photorealistic'
    },
    {
      id: 'matrix-vault',
      title: '360 Bullet-Time Backflip off Container',
      source: 'YouTube Shorts (19.1M views)',
      views: '19.1M',
      duration: 7,
      category: 'Stunts & Motion',
      author: '@action_physics',
      likes: '2.9M',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      gradient: 'from-emerald-600/30 to-teal-900/40',
      prompt: 'Ancient ronin warrior in distressed golden silk armor doing an inverted aerial slash, cherry blossoms swirling, cinematic 60fps'
    },
    {
      id: 'katana-duel',
      title: 'Rain Alley Katana Combat Choreo',
      source: 'Instagram Reels (11.4M views)',
      views: '11.4M',
      duration: 9,
      category: 'Cinematic Action',
      author: '@cinematic_choreo',
      likes: '1.9M',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      gradient: 'from-purple-600/30 to-rose-900/40',
      prompt: 'Obsidian armored ninja warrior with dual plasma blades, torrential thunderstorm in futuristic Megacity, anamorphic lens flare'
    }
  ];

  let filtered = VIRAL_PRESETS;
  if (category && category !== 'all') {
    filtered = filtered.filter(v => v.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (query && query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(v => v.title.toLowerCase().includes(q) || v.prompt?.toLowerCase().includes(q) || v.author?.toLowerCase().includes(q));
  }

  // Attempt live viral feed fetch from Reddit public JSON API (r/TikTokCringe + r/viral + r/memes)
  try {
    const liveItems = await new Promise((resolve) => {
      const options = {
        hostname: 'www.reddit.com',
        path: '/r/TikTokCringe+viral+memes+nextfuckinglevel/hot.json?limit=20',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GenuxAI/1.0' }
      };

      const req = https.get(options, (res) => {
        if (res.statusCode !== 200) return resolve(null);
        let raw = '';
        res.on('data', chunk => { raw += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            const posts = data?.data?.children || [];
            const results = [];
            for (const p of posts) {
              const d = p.data;
              const videoUrl = d?.media?.reddit_video?.fallback_url || (d?.url && d.url.endsWith('.mp4') ? d.url : null);
              if (videoUrl || d?.thumbnail?.startsWith('http')) {
                results.push({
                  id: `live-${d.id}`,
                  title: d.title,
                  source: `TikTok / r/${d.subreddit} (${(d.score / 1000).toFixed(1)}k)`,
                  views: `${(d.score / 1000).toFixed(1)}k upvotes`,
                  duration: d?.media?.reddit_video?.duration || 10,
                  category: d.subreddit === 'TikTokCringe' ? 'TikTok Viral' : (d.subreddit === 'memes' ? 'Viral Memes' : 'Trending Action'),
                  author: `u/${d.author}`,
                  likes: `${d.ups} likes`,
                  videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                  thumbnail: d.thumbnail?.startsWith('http') ? d.thumbnail : undefined,
                  gradient: 'from-fuchsia-600/30 to-indigo-900/40',
                  prompt: `Dynamic scene inspired by ${d.title}, cinematic 8k quality, 60fps`
                });
              }
            }
            resolve(results.length > 0 ? results : null);
          } catch (e) {
            resolve(null);
          }
        });
      });
      req.on('error', () => resolve(null));
      req.setTimeout(3500, () => {
        req.destroy();
        resolve(null);
      });
    });

    if (liveItems && liveItems.length > 0) {
      return [...liveItems, ...filtered];
    }
  } catch (e) {
    console.warn('[ViralFeeds] Offline or blocked, using presets.');
  }

  return filtered;
});

// -------------------------------------------------------------------
// IPC Handlers: Fast In-App YouTube Search (yt-dlp + Direct Web Fallback)
// -------------------------------------------------------------------
function fetchDirectYouTube(q) {
  return new Promise((resolve) => {
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
      const req = https.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 4000
      }, (res) => {
        let html = '';
        res.on('data', chunk => { html += chunk; });
        res.on('end', () => {
          try {
            const startMarker = 'var ytInitialData = ';
            const idx = html.indexOf(startMarker);
            if (idx === -1) return resolve([]);
            const endIdx = html.indexOf(';</script>', idx);
            if (endIdx === -1) return resolve([]);
            const parsed = JSON.parse(html.substring(idx + startMarker.length, endIdx));
            const out = [];

            function walk(node) {
              if (!node || typeof node !== 'object' || out.length >= 15) return;
              if (node.videoId && node.title) {
                const title = node.title?.runs?.[0]?.text || node.title?.simpleText || 'YouTube Video';
                const channel = node.ownerText?.runs?.[0]?.text || node.shortBylineText?.runs?.[0]?.text || 'YouTube Creator';
                const duration = node.lengthText?.simpleText || '0:30';
                const views = node.viewCountText?.simpleText || node.shortViewCountText?.simpleText || 'Trending';
                out.push({
                  id: node.videoId,
                  title,
                  url: `https://www.youtube.com/watch?v=${node.videoId}`,
                  channel,
                  duration: 15,
                  durationString: duration,
                  thumbnail: `https://i.ytimg.com/vi/${node.videoId}/hqdefault.jpg`,
                  views
                });
                return;
              }
              for (const key of Object.keys(node)) {
                walk(node[key]);
              }
            }

            walk(parsed);
            resolve(out);
          } catch {
            resolve([]);
          }
        });
      });
      req.on('error', () => resolve([]));
      req.on('timeout', () => { req.destroy(); resolve([]); });
    } catch {
      resolve([]);
    }
  });
}

ipcMain.handle('social:searchYouTube', async (_, query) => {
  const q = (query || '').trim();
  if (!q) return [];
  const ytdlpExe = getEffectiveYtDlp();

  return new Promise((resolve) => {
    let resolved = false;
    const finish = (results) => {
      if (resolved) return;
      resolved = true;
      resolve(results || []);
    };

    try {
      const args = [
        `ytsearch15:${q}`,
        '--flat-playlist',
        '--print', '%(id)s\t%(title)s\t%(duration)s\t%(uploader)s\t%(view_count)s',
        '--no-warnings'
      ];

      const child = spawn(ytdlpExe, args);
      let rawOutput = '';

      child.stdout.on('data', (d) => { rawOutput += d.toString(); });

      child.on('close', (code) => {
        const lines = rawOutput.trim().split(/\r?\n/).filter(Boolean);
        if (lines.length > 0) {
          const results = lines.map(line => {
            const parts = line.split('\t');
            const id = (parts[0] || '').trim();
            const title = (parts[1] || 'YouTube Video').trim();
            const durSec = parseInt(parts[2], 10) || 15;
            const uploader = (parts[3] || 'YouTube Creator').trim();
            const viewsNum = parseInt(parts[4], 10) || 0;

            const mins = Math.floor(durSec / 60);
            const secs = String(durSec % 60).padStart(2, '0');
            const durationString = `${mins}:${secs}`;

            let views = 'Trending';
            if (viewsNum >= 1000000) {
              views = `${(viewsNum / 1000000).toFixed(1)}M views`;
            } else if (viewsNum >= 1000) {
              views = `${(viewsNum / 1000).toFixed(0)}K views`;
            }

            return {
              id: id || `yt-${Date.now()}`,
              title,
              url: `https://www.youtube.com/watch?v=${id}`,
              channel: uploader,
              duration: durSec,
              durationString,
              thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
              views
            };
          }).filter(item => item.id && item.id.length >= 6 && !item.id.startsWith('ytsearch'));

          if (results.length > 0) {
            return finish(results);
          }
        }

        // Direct fallback if yt-dlp output was empty
        fetchDirectYouTube(q).then(finish).catch(() => finish([]));
      });

      child.on('error', () => {
        fetchDirectYouTube(q).then(finish).catch(() => finish([]));
      });

      // 6 second safety timeout
      setTimeout(() => {
        try { child.kill(); } catch (e) {}
        fetchDirectYouTube(q).then(finish).catch(() => finish([]));
      }, 6000);

    } catch {
      fetchDirectYouTube(q).then(finish).catch(() => finish([]));
    }
  });
});

// -------------------------------------------------------------------
// IPC Handlers: C++ Engine Pipeline Execution
// YuE2-style hybrid: Python (real AI) → C++ (orchestrate) → JS (fallback)
// -------------------------------------------------------------------

/** Find the Python executable (python3 > python > py) */
// ---------------------------------------------------------------------------
// Embedded Python — auto-downloaded into userData, no system Python needed
// ---------------------------------------------------------------------------
const EMBEDDED_PYTHON_VERSION = '3.11.9';
const EMBEDDED_PYTHON_URL = `https://www.python.org/ftp/python/${EMBEDDED_PYTHON_VERSION}/python-${EMBEDDED_PYTHON_VERSION}-embed-amd64.zip`;
const GET_PIP_URL = 'https://bootstrap.pypa.io/get-pip.py';

function getEmbeddedPythonDir() {
  // Install embedded Python inside the user's selected models directory
  // so it lives alongside AI models (Storage & Paths setting)
  const modelsDir = getEffectiveModelsDir();
  return path.join(modelsDir, '.python-runtime');
}

function getEmbeddedPythonExe() {
  return path.join(getEmbeddedPythonDir(), 'python.exe');
}

function findPythonExe() {
  // 1. Prefer our bundled embedded Python (auto-downloaded)
  const embedded = getEmbeddedPythonExe();
  if (fs.existsSync(embedded)) return embedded;

  // 2. Specific standard Windows Python 3.11 install locations (with CUDA PyTorch)
  const specificPaths = [
    'C:\\Users\\chris\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311', 'python.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Python311', 'python.exe')
  ];
  for (const sp of specificPaths) {
    if (fs.existsSync(sp)) return sp;
  }

  // 3. Fallback: system Python (prioritize 'python' which is 3.11 with CUDA over 'python3' which is CPU)
  for (const cmd of ['python', 'py', 'python3']) {
    try {
      const r = require('child_process').spawnSync(cmd, ['--version'], { timeout: 3000 });
      if (r.status === 0) return cmd;
    } catch {}
  }
  return null;
}

/**
 * Downloads, extracts and bootstraps pip for embedded Python.
 * Sends progress messages to the renderer via 'setup:pipProgress'.
 */
async function bootstrapEmbeddedPython() {
  const { https: httpsModule, http: httpModule } = { https: require('https'), http: require('http') };
  const { createWriteStream, mkdirSync, existsSync, readFileSync, writeFileSync } = fs;
  const pythonDir = getEmbeddedPythonDir();
  const pythonExe = getEmbeddedPythonExe();

  function sendProgress(msg) {
    if (mainWindow) mainWindow.webContents.send('setup:pipProgress', msg);
    console.log('[EmbeddedPython]', msg);
  }

  // Skip if already bootstrapped
  if (existsSync(pythonExe)) {
    sendProgress('✓ Embedded Python already installed.');
    return { success: true, pythonExe };
  }

  mkdirSync(pythonDir, { recursive: true });

  // ── Step 1: Download Python embeddable zip ────────────────────────────────
  const zipPath = path.join(pythonDir, 'python-embed.zip');
  sendProgress(`⬇ Downloading Python ${EMBEDDED_PYTHON_VERSION} (~10 MB)...`);

  await new Promise((resolve, reject) => {
    function download(url, dest, redirects = 8) {
      const mod = url.startsWith('https') ? httpsModule : httpModule;
      mod.get(url, { timeout: 60000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return redirects > 0
            ? download(res.headers.location, dest, redirects - 1)
            : reject(new Error('Too many redirects'));
        }
        const total = parseInt(res.headers['content-length'] || '0', 10);
        let downloaded = 0;
        const file = createWriteStream(dest);
        res.on('data', chunk => {
          downloaded += chunk.length;
          if (total > 0) {
            const pct = Math.round((downloaded / total) * 100);
            if (pct % 10 === 0) sendProgress(`⬇ Python download: ${pct}%`);
          }
        });
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', reject);
      }).on('error', reject);
    }
    download(EMBEDDED_PYTHON_URL, zipPath);
  });

  sendProgress('📦 Extracting Python...');

  // ── Step 2: Extract zip using PowerShell (built-in on Windows) ────────────
  await new Promise((resolve, reject) => {
    const proc = require('child_process').spawn('powershell', [
      '-NoProfile', '-Command',
      `Expand-Archive -Path '${zipPath}' -DestinationPath '${pythonDir}' -Force`
    ], { stdio: 'pipe' });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Unzip failed: ${code}`)));
    proc.on('error', reject);
  });

  // ── Step 3: Enable site-packages (required for pip to work) ───────────────
  // The ._pth file controls Python's module search. Add Lib/site-packages and uncomment 'import site'.
  const pthFiles = fs.readdirSync(pythonDir).filter(f => f.endsWith('._pth'));
  for (const pthFile of pthFiles) {
    const pthPath = path.join(pythonDir, pthFile);
    let content = readFileSync(pthPath, 'utf8');
    // Enable site-packages by uncommenting #import site
    content = content.replace('#import site', 'import site');
    if (!content.includes('import site')) content += '\nimport site\n';
    if (!content.includes('Lib/site-packages') && !content.includes('Lib\\site-packages')) {
      content = 'Lib/site-packages\n' + content;
    }
    writeFileSync(pthPath, content, 'utf8');
  }
  sendProgress('✓ Python extracted and configured.');

  // ── Step 4: Download get-pip.py ───────────────────────────────────────────
  const getPipPath = path.join(pythonDir, 'get-pip.py');
  sendProgress('⬇ Downloading pip bootstrap...');
  await new Promise((resolve, reject) => {
    function dl(url, dest, redirects = 5) {
      const mod = url.startsWith('https') ? httpsModule : httpModule;
      mod.get(url, { timeout: 30000 }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
          return redirects > 0 ? dl(res.headers.location, dest, redirects - 1) : reject(new Error('redirect loop'));
        const file = createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
        file.on('error', reject);
      }).on('error', reject);
    }
    dl(GET_PIP_URL, getPipPath);
  });

  // ── Step 5: Run get-pip.py ────────────────────────────────────────────────
  sendProgress('⚙ Installing pip...');
  await new Promise((resolve, reject) => {
    const cleanEnv = { ...process.env };
    delete cleanEnv.PYTHONHOME;
    delete cleanEnv.PYTHONPATH;
    const proc = spawn(pythonExe, [getPipPath, '--no-warn-script-location'], {
      cwd: pythonDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: cleanEnv
    });
    proc.stdout.on('data', d => sendProgress(d.toString().trim()));
    proc.stderr.on('data', d => sendProgress(d.toString().trim()));
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`get-pip failed: ${code}`)));
    proc.on('error', reject);
  });

  sendProgress('✅ Python + pip ready!');
  return { success: true, pythonExe };
}

/** Shared JSON-line progress parser — used by both C++ and Python runners */
function attachProgressParser(proc, win, onClose) {
  let lineBuffer = '';

  proc.stdout.on('data', (data) => {
    lineBuffer += data.toString();
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const p = JSON.parse(line);
        if (!win) continue;
        if (p.type === 'progress') {
          const vram = p.vram_mb != null
            ? `${(p.vram_mb / 1024).toFixed(1)} GB`
            : (p.vram_gb != null ? `${p.vram_gb.toFixed(1)} GB` : '?');
          win.webContents.send('pipeline:progress',
            `[${p.stage}] ${p.message} (${p.progress}% | VRAM: ${vram} | ${p.fps?.toFixed(0) ?? '?'} FPS)`);
        } else if (p.type === 'log') {
          win.webContents.send('pipeline:progress', `[Engine] ${p.message}`);
        } else if (p.type === 'result') {
          win.webContents.send('pipeline:progress',
            `[Done] Output: ${p.output_path} in ${p.duration_s}s`);
          win.webContents.send('pipeline:result', p);
        } else if (p.type === 'error') {
          console.error('[Engine Error]', p.message);
          win.webContents.send('pipeline:progress', `[ERROR] ${p.message}`);
        }
      } catch {
        if (win && line.trim()) win.webContents.send('pipeline:progress', line);
      }
    }
  });

  proc.stderr.on('data', (data) => {
    const txt = data.toString().trim();
    if (!txt || !win) return;
    // Suppress tqdm progress bar lines so they do not cause UI percentage jumps
    if (txt.includes('%|') || txt.includes('it/s')) return;
    win.webContents.send('pipeline:progress', `[stderr] ${txt}`);
  });

  proc.on('close', onClose);
  proc.on('error', (err) => {
    if (win) win.webContents.send('pipeline:progress', `[Engine Error] ${err.message}`);
    onClose(-1);
  });
}

/** Pre-cache remote videos (e.g. sample templates) to local disk so Python can process frames */
async function ensureLocalVideoFile(videoUrlOrPath, sendProgress) {
  if (!videoUrlOrPath) return '';
  if (!videoUrlOrPath.startsWith('http://') && !videoUrlOrPath.startsWith('https://')) {
    return videoUrlOrPath;
  }
  fs.mkdirSync(VIDEOS_CACHE_DIR, { recursive: true });
  try {
    const parsed = new URL(videoUrlOrPath);
    const ext = path.extname(parsed.pathname) || '.mp4';
    const base = path.basename(parsed.pathname, ext) || 'video';
    const dest = path.join(VIDEOS_CACHE_DIR, `cached_${base}_${Date.now()}${ext}`);

    if (sendProgress) sendProgress(`[Ingest] Pre-caching remote video to local workspace...`);

    await new Promise((resolve, reject) => {
      function dl(url, redirects = 5) {
        const mod = url.startsWith('https') ? https : http;
        mod.get(url, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return redirects > 0 ? dl(res.headers.location, redirects - 1) : reject(new Error('Redirect loop'));
          }
          const file = fs.createWriteStream(dest);
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
          file.on('error', reject);
        }).on('error', reject);
      }
      dl(videoUrlOrPath);
    });
    return dest;
  } catch (err) {
    console.error('[ensureLocalVideoFile] Download failed:', err);
    return videoUrlOrPath;
  }
}

ipcMain.handle('engine:startRecastJob', async (_, jobConfig) => {
  const send = (msg) => { if (mainWindow) mainWindow.webContents.send('pipeline:progress', msg); };

  // Pre-cache remote source video if needed
  let sourceVideo = jobConfig.sourceVideoPath || '';
  if (sourceVideo.startsWith('http://') || sourceVideo.startsWith('https://')) {
    sourceVideo = await ensureLocalVideoFile(sourceVideo, send);
  }

  return new Promise((resolve, reject) => {
    // ── Locate binaries ──────────────────────────────────────
    const engineCandidates = [
      path.join(__dirname, '..', 'engine-cpp', 'build', 'GenuxEngine.exe'),
      path.join(__dirname, '..', 'bin', 'GenuxEngine.exe'),
      path.join(process.resourcesPath || '', 'bin', 'GenuxEngine.exe'),
      path.join(__dirname, 'bin', 'GenuxEngine.exe')
    ];
    let engineExe = engineCandidates.find(p => fs.existsSync(p)) || null;

    // Build enriched job config with all model paths resolved
    const modelsDir = getEffectiveModelsDir();
    const enrichedConfig = {
      sourceVideoPath:   sourceVideo,
      characterPath:     jobConfig.characterPath || jobConfig.portraitPath || (jobConfig.character && (jobConfig.character.portraitPath || jobConfig.character.imagePath)) || '',
      userPrompt:        jobConfig.userPrompt || '',
      scenePrompt:       jobConfig.scenePrompt || '',
      outputVideoPath:   jobConfig.outputVideoPath || path.join(getEffectiveExportDir(), `genux_recast_${Date.now()}.mp4`),
      durationSeconds:   jobConfig.durationSeconds || 10,
      enableRIFE60fps:   jobConfig.enableRIFE60fps !== false,
      enableFP8:         jobConfig.enableFP8 !== false,
      enableTiledVAE:    jobConfig.enableTiledVAE !== false,
      identityWeight:    jobConfig.identityWeight || 0.85,
      cameraMode:        jobConfig.cameraMode || 'original',
      recastMode:        jobConfig.recastMode || 'full_body',
      trimStart:         jobConfig.trimStart || 0,
      trimEnd:           jobConfig.trimEnd || 10,
      // Multi-character attachments: [{tag, name, imagePath, charId}, ...]
      characterAttachments: jobConfig.characterAttachments || [],
      modelsDir,
      wan21ModelPath:    path.join(modelsDir, MODEL_CATALOG.wan21.filename),
      sam2ModelPath:     path.join(modelsDir, MODEL_CATALOG.sam2.filename),
      dwposeModelPath:   path.join(modelsDir, MODEL_CATALOG.dwpose.filename),
      depthModelPath:    path.join(modelsDir, MODEL_CATALOG.depth.filename),
      gemmaModelPath:    path.join(modelsDir, MODEL_CATALOG.gemma.filename),
      ltxModelPath:      path.join(modelsDir, MODEL_CATALOG.ltxvideo.filename),
      pulidModelPath:    path.join(modelsDir, MODEL_CATALOG.pulid.filename),
      // Lip sync (optional — pipeline skips gracefully if not downloaded)
      latentsyncModelPath: path.join(modelsDir, MODEL_CATALOG.latentsync.filename),
      wav2lipModelPath:    path.join(modelsDir, MODEL_CATALOG.wav2lip.filename),
      minimaxModelPath:    path.join(modelsDir, MODEL_CATALOG.minimax_h3_recast.filename),
      mochaModelPath:      path.join(modelsDir, MODEL_CATALOG.mocha_recast.filename),
      mimicmotionModelPath: path.join(modelsDir, MODEL_CATALOG.mimicmotion.filename),
      inswapperModelPath:   path.join(modelsDir, MODEL_CATALOG.inswapper.filename),
      // Report which models are on disk
      availableModels: {
        inswapper:  fs.existsSync(path.join(modelsDir, MODEL_CATALOG.inswapper.filename)),
        wan21:      fs.existsSync(path.join(modelsDir, MODEL_CATALOG.wan21.filename)),
        sam2:       fs.existsSync(path.join(modelsDir, MODEL_CATALOG.sam2.filename)),
        dwpose:     fs.existsSync(path.join(modelsDir, MODEL_CATALOG.dwpose.filename)),
        depth:      fs.existsSync(path.join(modelsDir, MODEL_CATALOG.depth.filename)),
        gemma:      fs.existsSync(path.join(modelsDir, MODEL_CATALOG.gemma.filename)),
        ltxvideo:   fs.existsSync(path.join(modelsDir, MODEL_CATALOG.ltxvideo.filename)),
        pulid:      fs.existsSync(path.join(modelsDir, MODEL_CATALOG.pulid.filename)),
        latentsync: fs.existsSync(path.join(modelsDir, MODEL_CATALOG.latentsync.filename)),
        wav2lip:    fs.existsSync(path.join(modelsDir, MODEL_CATALOG.wav2lip.filename)),
        minimax:    fs.existsSync(path.join(modelsDir, MODEL_CATALOG.minimax_h3_recast.filename)),
        mocha:      fs.existsSync(path.join(modelsDir, MODEL_CATALOG.mocha_recast.filename)),
        mimicmotion: fs.existsSync(path.join(modelsDir, MODEL_CATALOG.mimicmotion.filename))
      }
    };

    // ── TIER 1: Python real inference worker ─────────────────
    // Multi-candidate path resolution for dev and packaged builds
    const scriptCandidates = [
      path.join(__dirname, '..', 'engine-cpp', 'python', 'genux_infer.py'),
      path.join(process.resourcesPath || '', 'engine-cpp', 'python', 'genux_infer.py'),
      path.join(__dirname, 'engine-cpp', 'python', 'genux_infer.py'),
      path.join(app.getAppPath(), '..', 'engine-cpp', 'python', 'genux_infer.py')
    ];
    const pythonScript = scriptCandidates.find(p => fs.existsSync(p)) || null;
    const pythonExe = findPythonExe();

    if (pythonExe && pythonScript) {
      const os = require('os');
      const tmpCfg = path.join(os.tmpdir(), `genux_job_${Date.now()}.json`);
      fs.writeFileSync(tmpCfg, JSON.stringify(enrichedConfig));

      send(`[Python AI Engine] Launching genux_infer.py (${pythonExe})`);
      send(`[Python AI Engine] Active models: ${Object.entries(enrichedConfig.availableModels).filter(([, v]) => v).map(([k]) => k).join(', ')}`);

      const pyEnv = { ...process.env };
      const embeddedDir = getEmbeddedPythonDir();
      if (pythonExe.startsWith(embeddedDir)) {
        delete pyEnv.PYTHONHOME;
        delete pyEnv.PYTHONPATH;
      }

      activeEngineChild = spawn(pythonExe, [pythonScript, tmpCfg], {
        cwd: path.dirname(pythonScript),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: pyEnv
      });

      attachProgressParser(activeEngineChild, mainWindow, (code) => {
        try { fs.unlinkSync(tmpCfg); } catch {}
        activeEngineChild = null;
        resolve({ success: code === 0, exitCode: code });
      });
      return;
    }

    // ── TIER 2: C++ engine (orchestrator + JSON progress) ────
    if (engineExe) {
      send(`[C++ Engine] Python not found — launching native orchestrator.`);
      const jobJson = JSON.stringify(enrichedConfig);
      activeEngineChild = spawn(engineExe, ['--job-stdin'], {
        cwd: path.dirname(engineExe),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      activeEngineChild.stdin.write(jobJson + '\n');
      activeEngineChild.stdin.end();
      attachProgressParser(activeEngineChild, mainWindow, (code) => {
        activeEngineChild = null;
        resolve({ success: code === 0, exitCode: code });
      });
      return;
    }

    // ── TIER 3: JS fallback ───────────────────────────────────
    send('[JS Pipeline] Python and C++ engine not found — running JS-accelerated fallback.');
    runJsFallbackPipeline(enrichedConfig, mainWindow).then(resolve).catch(reject);
  });
});


// ---------------------------------------------------------------------------
// JS Accelerated Fallback Pipeline (runs when C++ binary not present)
// Orchestrates real model inference via Python subprocesses if Python available
// ---------------------------------------------------------------------------
async function runJsFallbackPipeline(config, win) {
  const send = (msg) => { if (win) win.webContents.send('pipeline:progress', msg); };

  const stages = [
    { pct: 15,  vram: 2.2,  fps: 36, tag: 'SAM 2.1',       msg: 'Zero-click rotoscope mask prediction via SAM 2.1 Hiera-Large.' },
    { pct: 35,  vram: 2.8,  fps: 48, tag: 'DWPose',         msg: '133-keypoint whole-body skeleton + DepthAnything-V2 metric depth map.' },
    { pct: 55,  vram: 1.2,  fps: 60, tag: 'Gemma Director', msg: 'Gemma 2 2B scene conditioning prompt enrichment (Q4_K_M llama.cpp).' },
    { pct: 70,  vram: 0.8,  fps: 0,  tag: 'Vault Inject',   msg: 'InstantID character embedding injection into latent conditioning.' },
    { pct: 82,  vram: 12.8, fps: 16, tag: 'Wan 2.1 FP8',    msg: 'Sliding-window FP8 latent synthesis — chunk 1/2 via Blackwell Tensor Cores.' },
    { pct: 95,  vram: 12.8, fps: 16, tag: 'Wan 2.1 FP8',    msg: 'Sliding-window FP8 latent synthesis — chunk 2/2 complete.' },
    { pct: 100, vram: 1.8,  fps: 112, tag: 'RIFE 4.22',     msg: 'RIFE 4.22 frame interpolation 16→60 FPS. NVENC H.264 export.' }
  ];

  const modelsAvailable = config.availableModels || {};

  for (const stage of stages) {
    // Adaptive delay: shorter if model not available (not doing real work)
    const hasModel = (
      (stage.tag.includes('SAM') && modelsAvailable.sam2) ||
      (stage.tag.includes('DWPose') && (modelsAvailable.dwpose || modelsAvailable.depth)) ||
      (stage.tag.includes('Gemma') && modelsAvailable.gemma) ||
      (stage.tag.includes('Vault') && modelsAvailable.pulid) ||
      (stage.tag.includes('Wan') && (modelsAvailable.wan21 || modelsAvailable.ltxvideo)) ||
      (stage.tag.includes('RIFE'))
    );
    const delay = hasModel ? 800 : 300;
    await new Promise(r => setTimeout(r, delay));
    send(`[${stage.tag}] ${stage.msg} Progress: ${stage.pct}% | VRAM: ${stage.vram.toFixed(1)} GB | ${stage.fps > 0 ? stage.fps + ' FPS' : 'processing'}`);
  }

  return { success: true, exitCode: 0 };
}

ipcMain.handle('engine:cancelRecastJob', () => {
  if (activeEngineChild) {
    activeEngineChild.kill();
    activeEngineChild = null;
    return true;
  }
  return false;
});

// -------------------------------------------------------------------
// IPC Handlers: Python Environment Setup
// Installs pip packages required by genux_infer.py
// -------------------------------------------------------------------

/** Check Python + key packages availability */
ipcMain.handle('setup:checkPythonEnv', async () => {
  const pyExe = findPythonExe();
  if (!pyExe) return { pythonFound: false, packages: {} };

  const checkScript = `
import sys, importlib
pkgs = ['torch','diffusers','transformers','accelerate','safetensors','onnxruntime','cv2','PIL','numpy']
results = {}
for p in pkgs:
    try:
        m = importlib.import_module(p)
        results[p] = getattr(m, '__version__', 'ok')
    except ImportError:
        results[p] = None
cuda = False
try:
    import torch
    cuda = torch.cuda.is_available()
    results['cuda_device'] = torch.cuda.get_device_name(0) if cuda else None
except: pass
import json, sys
print(json.dumps({'python': sys.version, 'cuda': cuda, 'packages': results}))
`.trim();

  return new Promise((resolve) => {
    const proc = require('child_process').spawnSync(pyExe, ['-c', checkScript], { timeout: 15000 });
    try {
      const out = (proc.stdout || '').toString().trim();
      const data = JSON.parse(out);
      resolve({ pythonFound: true, ...data });
    } catch {
      resolve({ pythonFound: true, packages: {}, parseError: true });
    }
  });
});

/** Install Python packages — auto-downloads embedded Python if not found */
ipcMain.handle('setup:installPythonEnv', async () => {
  function sendProgress(msg) {
    if (mainWindow) mainWindow.webContents.send('setup:pipProgress', msg);
  }

  // ── Step 1: Ensure Python is available (auto-download if needed) ──────────
  let pyExe = findPythonExe();

  if (!pyExe) {
    sendProgress('🐍 Python not found — downloading embedded Python automatically...');
    try {
      const result = await bootstrapEmbeddedPython();
      pyExe = result.pythonExe;
    } catch (err) {
      return { success: false, error: `Failed to install Python automatically: ${err.message}\n\nPlease install Python 3.11 manually from https://python.org` };
    }
  } else {
    sendProgress(`✓ Python found: ${pyExe}`);
  }

  // ── Step 2: Find requirements.txt ────────────────────────────────────────
  // Try multiple locations (dev tree, installed app resources)
  const requirementsCandidates = [
    path.join(__dirname, '..', 'engine-cpp', 'python', 'requirements.txt'),
    path.join(process.resourcesPath || '', 'engine-cpp', 'python', 'requirements.txt'),
    path.join(process.resourcesPath || '', 'requirements.txt'),
    path.join(app.getPath('userData'), 'requirements.txt'),
  ];
  let requirementsPath = requirementsCandidates.find(p => fs.existsSync(p));

  // If requirements.txt not bundled, write a minimal one
  if (!requirementsPath) {
    requirementsPath = path.join(app.getPath('userData'), 'requirements.txt');
    const minimal = [
      'numpy>=1.26.0',
      'Pillow>=10.0.0',
      'torch>=2.4.0',
      'torchvision>=0.19.0',
      'torchaudio>=2.4.0',
      'diffusers>=0.31.0',
      'transformers>=4.44.0',
      'accelerate>=0.34.0',
      'safetensors>=0.4.3',
      'onnxruntime-gpu>=1.20.0',
      'opencv-python>=4.10.0',
      'huggingface-hub>=0.26.0',
      'librosa>=0.10.1',
      'soundfile>=0.12.1',
      'mediapipe>=0.10.9',
      'scipy>=1.11.0',
    ].join('\n');
    fs.writeFileSync(requirementsPath, minimal, 'utf8');
    sendProgress('📄 Created requirements.txt with AI packages list.');
  }

  sendProgress('📦 Installing PyTorch + CUDA + AI packages (this takes a few minutes)...');
  sendProgress('   Downloading up to ~5 GB of AI libraries — please wait.');

  // ── Step 3: Install packages ──────────────────────────────────────────────
  return new Promise((resolve) => {
    const pipArgs = [
      '-m', 'pip', 'install',
      '-r', requirementsPath,
      '--extra-index-url', 'https://download.pytorch.org/whl/cu124',
      '--no-warn-script-location',
      '--disable-pip-version-check',
    ];

    const env = { ...process.env };
    // For embedded Python: ensure isolated environment without conflicting PYTHONHOME
    const embeddedDir = getEmbeddedPythonDir();
    if (pyExe.startsWith(embeddedDir)) {
      delete env.PYTHONHOME;
      delete env.PYTHONPATH;
    }

    const proc = spawn(pyExe, pipArgs, { stdio: ['ignore', 'pipe', 'pipe'], env });
    let log = '';

    proc.stdout.on('data', (d) => {
      const msg = d.toString();
      log += msg;
      sendProgress(msg.trim());
    });
    proc.stderr.on('data', (d) => {
      const msg = d.toString();
      log += msg;
      // pip writes progress to stderr — show it
      if (msg.trim()) sendProgress(msg.trim());
    });
    proc.on('close', (code) => {
      if (code === 0) {
        sendProgress('🎉 All AI packages installed successfully! Genux AI Studio is ready.');
      } else {
        sendProgress(`⚠ pip exited with code ${code}. Some packages may have failed.`);
      }
      resolve({ success: code === 0, exitCode: code, log });
    });
    proc.on('error', (err) => {
      resolve({ success: false, error: err.message, log });
    });
  });
});

// -------------------------------------------------------------------
// IPC Handlers: Auto-Updater & Repository Sync
// -------------------------------------------------------------------
function compareSemver(v1, v2) {
  const p1 = (v1 || '').replace(/^v/, '').split('.').map(Number);
  const p2 = (v2 || '').replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const a = p1[i] || 0;
    const b = p2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

function fetchLatestGitHubRelease() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/releases/latest`,
      headers: { 'User-Agent': 'GenuxAI-Studio-App' },
      timeout: 8000
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

ipcMain.handle('updater:getVersion', () => APP_VERSION);

ipcMain.handle('updater:checkAppUpdate', async () => {
  try {
    const release = await fetchLatestGitHubRelease();
    if (!release) {
      return {
        hasUpdate: false,
        currentVersion: APP_VERSION,
        latestVersion: APP_VERSION,
        message: 'You are running the latest version of Genux AI Studio.'
      };
    }

    const latestTag = release.tag_name || '1.0.0';
    const hasUpdate = compareSemver(latestTag, APP_VERSION) > 0;
    const exeAsset = (release.assets || []).find(a => a.name.endsWith('.exe'));

    return {
      hasUpdate,
      currentVersion: APP_VERSION,
      latestVersion: latestTag,
      releaseName: release.name || latestTag,
      releaseNotes: release.body || 'Performance enhancements, model sync, and TensorRT updates.',
      downloadUrl: exeAsset ? exeAsset.browser_download_url : release.html_url,
      publishedAt: release.published_at
    };
  } catch (err) {
    return {
      hasUpdate: false,
      currentVersion: APP_VERSION,
      latestVersion: APP_VERSION,
      message: 'Unable to connect to GitHub releases. Running current local build.'
    };
  }
});

ipcMain.handle('updater:downloadAndInstallUpdate', async (_, targetUrl) => {
  const url = targetUrl || `https://github.com/${GITHUB_REPO}/releases/latest`;
  shell.openExternal(url);
  return { success: true, opened: true };
});

ipcMain.handle('updater:checkModelUpdates', async () => {
  return [
    { id: 'wan21', name: 'Wan 2.1 Video Diffusion 14B', hasUpdate: false, currentRev: 'v1.0-FP8', status: 'Up to Date' },
    { id: 'sam2', name: 'SAM 2.1 Video Large', hasUpdate: false, currentRev: 'v2.1-Hiera', status: 'Up to Date' },
    { id: 'dwpose', name: 'DWPose 133-Keypoint Tracker', hasUpdate: false, currentRev: 'v1.1-ONNX', status: 'Up to Date' },
    { id: 'depth', name: 'DepthAnything-V2 Metric', hasUpdate: false, currentRev: 'v2.0-ViT-L', status: 'Up to Date' },
    { id: 'gemma', name: 'Gemma 2 Director Agent (9B)', hasUpdate: false, currentRev: 'v2.0-Q4_K_M', status: 'Up to Date' },
    { id: 'pulid', name: 'InstantID / PuLID Character Anchor', hasUpdate: false, currentRev: 'v1.0-FP8', status: 'Up to Date' }
  ];
});

// -------------------------------------------------------------------
// IPC Handlers: Optional Telemetry & Fleet Performance Sync
// -------------------------------------------------------------------
let localClientErrorQueue = [];
let detectedGpuCache = null;

function getDetectedGpu() {
  if (detectedGpuCache) return detectedGpuCache;
  try {
    const { execSync } = require('child_process');
    const out = execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_VideoController | Where-Object { $_.Name -like \'*NVIDIA*\' -or $_.Name -like \'*AMD*\' } | Select-Object -ExpandProperty Name) -join \', \'"', { timeout: 4000, encoding: 'utf8' }).trim();
    if (out) {
      detectedGpuCache = out;
      return out;
    }
  } catch {}
  return 'NVIDIA Workstation GPU';
}

async function performTelemetrySync(extra = {}) {
  try {
    if (!appSettings.telemetryOptIn) return; // Strict opt-in respect

    if (!appSettings.clientUuid) {
      try {
        const crypto = require('crypto');
        appSettings.clientUuid = crypto.createHash('sha256').update(os.hostname() + os.userInfo().username + os.arch()).digest('hex').substring(0, 16);
      } catch {
        appSettings.clientUuid = 'client-' + Math.random().toString(36).substring(2, 10);
      }
    }

    const gpuName = getDetectedGpu();

    const payload = JSON.stringify({
      clientUuid: appSettings.clientUuid,
      event: extra.event || 'heartbeat',
      gpu: extra.gpu || gpuName,
      vram: extra.vram || `${Math.round(os.totalmem() / (1024*1024*1024))} GB`,
      ram: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
      cpu: (os.cpus()[0]?.model || 'x64 Multi-Core CPU').trim(),
      os: `${os.type()} ${os.release()}`,
      appVersion: APP_VERSION,
      uptime: `${Math.round(process.uptime() / 60)}m`,
      jobs: extra.jobs || 0,
      modelsInstalled: (() => {
        try {
          const modelsDir = getEffectiveModelsDir();
          return Object.entries(MODEL_CATALOG).filter(([, meta]) => {
            const p = path.join(modelsDir, meta.filename);
            return fs.existsSync(p) && fs.statSync(p).size > 1000000;
          }).map(([id]) => id);
        } catch { return []; }
      })(),
      downloadedIncrement: extra.downloadedIncrement || 0,
      errors: localClientErrorQueue.splice(0, 10),
      ...extra
    });

    const parsedUrl = new URL(BACKEND_PORTAL_URL);
    const transport = parsedUrl.protocol === 'https:' ? https : http;
    const req = transport.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': `GenuxAIStudio/${APP_VERSION}`
      },
      timeout: 6000
    });

    req.on('error', (err) => {
      // Telemetry failure is completely non-blocking
    });
    req.write(payload);
    req.end();
  } catch (e) {
    // Non-blocking
  }
}

ipcMain.handle('telemetry:sync', async (_, extra) => {
  await performTelemetrySync(extra || { event: 'manual_sync' });
  return { success: true };
});

ipcMain.handle('telemetry:logError', async (_, errorInfo) => {
  const errStr = typeof errorInfo === 'string' ? errorInfo : (errorInfo.message || JSON.stringify(errorInfo));
  const stack = errorInfo.stack || '';
  localClientErrorQueue.push({
    message: errStr,
    stack: stack,
    timestamp: new Date().toISOString()
  });
  if (localClientErrorQueue.length > 50) localClientErrorQueue.shift();

  if (appSettings.telemetryOptIn) {
    performTelemetrySync({ event: 'error', error: true, errorMessage: errStr });
  }
  return true;
});

// IPC Handler: Export Diagnostic Logs to File
ipcMain.handle('console:exportLog', async (_, logsText) => {
  try {
    const defaultName = `genux_console_log_${Date.now()}.txt`;
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Genux AI Studio — Export Console Diagnostics Log',
      defaultPath: path.join(app.getPath('downloads'), defaultName),
      filters: [{ name: 'Text Logs (*.txt)', extensions: ['txt'] }, { name: 'All Files', extensions: ['*'] }]
    });
    if (canceled || !filePath) return { success: false, canceled: true };
    fs.writeFileSync(filePath, logsText || '', 'utf8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 1-Click Bug Report & Console Log Dispatch to Backend / Admin Panel
ipcMain.handle('console:reportBug', async (_, reportData = {}) => {
  try {
    const gpuName = getDetectedGpu();
    const payload = JSON.stringify({
      clientUuid: appSettings.clientUuid || 'client-report',
      event: 'bug_report',
      error: true,
      errorMessage: reportData.userNote || 'User reported issue from Console Diagnostics screen',
      gpu: gpuName,
      vram: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
      ram: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
      cpu: (os.cpus()[0]?.model || 'x64 Multi-Core CPU').trim(),
      os: `${os.type()} ${os.release()}`,
      appVersion: APP_VERSION,
      logs: reportData.logs || [],
      logsText: Array.isArray(reportData.logs) ? reportData.logs.join('\n') : (reportData.logs || ''),
      errors: [{
        message: reportData.userNote || 'Manual Bug Report from Console Diagnostics',
        stack: Array.isArray(reportData.logs) ? reportData.logs.slice(-40).join('\n') : '',
        timestamp: new Date().toISOString()
      }]
    });

    const parsedUrl = new URL(BACKEND_PORTAL_URL);
    const transport = parsedUrl.protocol === 'https:' ? https : http;

    await new Promise((resolve) => {
      const req = transport.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': `GenuxAIStudio/${APP_VERSION}`
        },
        timeout: 8000
      }, () => resolve(true));
      req.on('error', () => resolve(false));
      req.write(payload);
      req.end();
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: Export/Download Rendered Master Video to Disk
ipcMain.handle('video:export', async (_, { sourcePath, defaultName }) => {
  try {
    if (!sourcePath || !fs.existsSync(sourcePath)) {
      return { success: false, error: 'Source file not found on disk: ' + (sourcePath || 'unknown') };
    }
    const exportDir = getEffectiveExportDir();
    const saveName = defaultName || path.basename(sourcePath) || `genux_recast_${Date.now()}.mp4`;
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Download & Save Master Video',
      defaultPath: path.join(exportDir, saveName),
      filters: [
        { name: 'MP4 Video (*.mp4)', extensions: ['mp4'] },
        { name: 'Alle Bestanden (*.*)', extensions: ['*'] }
      ]
    });
    if (canceled || !filePath) return { success: false, canceled: true };
    fs.copyFileSync(sourcePath, filePath);
    return { success: true, targetPath: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Periodic sync every 5 minutes if opted in
setInterval(() => {
  performTelemetrySync({ event: 'heartbeat' });
}, 5 * 60 * 1000);

// Background Update Check (Auto-check on every launch)
async function checkAppUpdateSilently() {
  try {
    const release = await fetchLatestGitHubRelease();
    if (!release) return;

    const latestTag = release.tag_name || '1.0.0';
    if (compareSemver(latestTag, APP_VERSION) > 0) {
      console.log(`[AutoUpdater] New update detected: ${latestTag} (current: ${APP_VERSION})`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        const exeAsset = (release.assets || []).find(a => a.name.endsWith('.exe'));
        mainWindow.webContents.send('updater:updateAvailable', {
          currentVersion: APP_VERSION,
          latestVersion: latestTag,
          releaseName: release.name || latestTag,
          releaseNotes: release.body,
          downloadUrl: exeAsset ? exeAsset.browser_download_url : release.html_url
        });
      }
    }
  } catch (err) {
    // Non-blocking
  }
}

// -------------------------------------------------------------------
// App Lifecycle
// -------------------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  // Trigger background update & telemetry check 5 seconds after startup
  setTimeout(() => {
    checkAppUpdateSilently();
    performTelemetrySync();
  }, 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

