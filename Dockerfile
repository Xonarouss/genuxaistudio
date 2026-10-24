# =======================================================
# Genux AI Unified Production Container for Coolify
# Serves: Website + Docs Portal + Admin 2FA + Telemetry API
# All in ONE single lightweight container on Port 3000
# =======================================================

# Stage 1: Build Frontend Website & Docs
FROM node:20-alpine AS web-builder
WORKDIR /build/web-portal
COPY web-portal/package*.json ./
RUN npm install
COPY web-portal/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install Backend Dependencies
COPY backend-portal/package*.json ./
RUN npm install --omit=dev

# Copy Backend Core
COPY backend-portal/ ./

# Copy Built Frontend Website & Docs from Stage 1 into public/web
COPY --from=web-builder /build/web-portal/dist ./public/web

# Expose Port 3000 for Coolify Application Router
EXPOSE 3000

# Volume for Persistent 2FA Admin Credentials & Telemetry Database
VOLUME ["/app/data"]

CMD ["node", "server.js"]
