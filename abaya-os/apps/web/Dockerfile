# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter "@abaya/web..."
COPY packages/shared packages/shared
COPY apps/web apps/web
ENV NEXT_TELEMETRY_DISABLED=1
# Next.js resolves rewrite destinations at build time, so the API address is a build arg.
ARG API_INTERNAL_URL=http://api:4000
ENV API_INTERNAL_URL=${API_INTERNAL_URL}
RUN pnpm --filter @abaya/shared build && pnpm --filter @abaya/web build

FROM node:22-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
USER app
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
