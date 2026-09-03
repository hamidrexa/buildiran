# ==========================================
# Base Stage (Shared dependencies)
# ==========================================
FROM node:20-alpine AS base
WORKDIR /app

# Install package dependencies
COPY package.json package-lock.json ./
RUN npm ci

# ==========================================
# Development Stage (Metro / Expo Dev Server)
# ==========================================
FROM base AS dev
WORKDIR /app
COPY . .
# Metro bundler port
EXPOSE 8081
# Start Expo development server in tunnel/lan mode
CMD ["npx", "expo", "start", "--host", "lan"]

# ==========================================
# Build Stage (Static Web Export)
# ==========================================
FROM base AS builder
WORKDIR /app
COPY . .
ENV NODE_ENV=production
RUN npx expo export --platform web

# ==========================================
# Production Web Server (Nginx)
# ==========================================
FROM nginx:alpine AS web-prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
