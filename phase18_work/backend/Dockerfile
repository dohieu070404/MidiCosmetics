FROM node:20.19.5-bookworm-slim AS deps

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    npm_config_registry=https://registry.npmjs.org/ \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false \
    npm_config_progress=false \
    npm_config_loglevel=error \
    PRISMA_GENERATE_SKIP_AUTOINSTALL=true

COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma

RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund --no-progress
RUN ./node_modules/.bin/prisma generate --schema=prisma/schema.prisma

FROM node:20.19.5-bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    npm_config_registry=https://registry.npmjs.org/ \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false \
    npm_config_progress=false \
    npm_config_loglevel=error \
    PRISMA_GENERATE_SKIP_AUTOINSTALL=true

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma
COPY src ./src
COPY templates ./templates
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh \
  && mkdir -p /app/uploads \
  && groupadd --system nodeapp \
  && useradd --system --gid nodeapp --home-dir /app nodeapp \
  && chown -R nodeapp:nodeapp /app

USER nodeapp

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
