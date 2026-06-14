FROM node:20.19.5-bookworm-slim AS builder

WORKDIR /app

ENV npm_config_registry=https://registry.npmjs.org/ \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false \
    npm_config_progress=false \
    npm_config_loglevel=error

ARG VITE_APP_NAME="Midi Cosmetics"
ARG VITE_API_BASE_URL="/api/v1"
ARG VITE_API_ORIGIN="http://localhost:8081"
ARG VITE_ENABLE_API_MOCKING="false"
ARG VITE_ADMIN_LOGIN_PATH="/quan-tri-midi-secure-2026"

ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_API_ORIGIN=$VITE_API_ORIGIN \
    VITE_ENABLE_API_MOCKING=$VITE_ENABLE_API_MOCKING \
    VITE_ADMIN_LOGIN_PATH=$VITE_ADMIN_LOGIN_PATH

COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund --no-progress

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
