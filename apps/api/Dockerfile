# Build context: repo root (see docker-compose.yml).
FROM node:22-slim
WORKDIR /repo
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Install deps first so this layer is cached until a manifest or the lockfile changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @aifirst/api...

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api

ENV NODE_ENV=production
EXPOSE 4000
WORKDIR /repo/apps/api
# Migrate, seed if empty, then serve (src/docker-entrypoint.ts).
CMD ["node", "--import", "tsx", "src/docker-entrypoint.ts"]
