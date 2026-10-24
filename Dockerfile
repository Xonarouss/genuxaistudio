# Multi-stage Dockerfile for Genux AI Website & Docs Portal
# Optimized for 1-Click Deployment on Coolify
FROM node:20-alpine AS build

WORKDIR /app

# Copy web-portal package files and install
COPY web-portal/package*.json ./
RUN npm ci

# Copy web-portal source files
COPY web-portal/ ./

# Build production bundle
RUN npm run build

# Production Stage with Nginx
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY web-portal/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
