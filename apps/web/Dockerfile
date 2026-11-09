# Build context: repo root (see docker-compose.yml).
FROM node:22-slim
WORKDIR /repo
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @aifirst/web...

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo/apps/web
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["./node_modules/.bin/next", "start", "--port", "3000"]
