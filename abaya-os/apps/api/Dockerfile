# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
RUN corepack enable && apk add --no-cache openssl
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter "@abaya/api..."
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @abaya/shared build \
 && pnpm --filter @abaya/api exec prisma generate \
 && pnpm --filter @abaya/api build

FROM node:22-alpine
RUN apk add --no-cache openssl && corepack enable && addgroup -S app && adduser -S app -G app
WORKDIR /repo
ENV NODE_ENV=production
# Keep the workspace layout so the @abaya/shared workspace link resolves.
COPY --from=build --chown=app:app /repo /repo
USER app
WORKDIR /repo/apps/api
EXPOSE 4000
# Apply pending migrations (non-destructive), then start.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
