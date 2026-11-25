# Deployment

## Option A — Docker Compose (single host)

```bash
cd abaya-os
cp .env.example .env
# Fill in: POSTGRES_PASSWORD, JWT_ACCESS_SECRET (openssl rand -hex 32),
# ENCRYPTION_KEY (openssl rand -hex 32 — exactly 64 hex chars), S3_SECRET_ACCESS_KEY,
# PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASSWORD
docker compose up -d --build
# Seed subscription plans + platform admin (idempotent; add SEED_DEMO=true for a demo store):
docker compose exec api npx ts-node --transpile-only prisma/seed.ts
```

* Web: `http://localhost:3000` · API + Swagger: `http://localhost:4000/api/docs` · MinIO console: `http://localhost:9001`
* The API container runs `prisma migrate deploy` (non-destructive) on every start.
* The web container proxies `/api/*` to the API, so the refresh-token cookie is first-party.
  The proxy target is fixed at **build time** (`API_INTERNAL_URL` build arg) — rebuild `web` if it changes.

> The Compose file and Dockerfiles were validated with `docker compose config`, but images were **not
> built or run** in the development environment (no Docker daemon was available). Do a first
> `docker compose up --build` in staging before production.

## Option B — Managed services

| Component | Suggested service (Saudi data residency) |
|---|---|
| PostgreSQL 16 | Managed Postgres in a KSA region (e.g. Google Cloud `me-central2` Dammam, Oracle Jeddah/Riyadh, STC Cloud) |
| Redis 7 | Managed Redis in the same region (used for BullMQ queues, cache) |
| Object storage | Any S3-compatible bucket; set `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_URL` (CDN origin) |
| API | Container (`apps/api/Dockerfile`), ≥ 2 replicas behind a load balancer; workers run in-process |
| Web | Container (`apps/web/Dockerfile`) or any Node host running the Next.js standalone server |

### Production checklist

- [ ] `NODE_ENV=production`, `COOKIE_SECURE=true`, HTTPS everywhere, `CORS_ORIGINS` = your web origin only.
- [ ] Unique `JWT_ACCESS_SECRET` and `ENCRYPTION_KEY` from a secret manager. **Rotating `ENCRYPTION_KEY` makes stored integration credentials unreadable** — tenants must re-enter them.
- [ ] Postgres backups (PITR) and Redis persistence (AOF) enabled.
- [ ] Run the seed once to create plans; review plan prices (stored in halalas, VAT-exclusive).
- [ ] Put the API behind a reverse proxy that sets `X-Forwarded-For` (trust proxy is enabled) for accurate rate limiting and audit IPs.
- [ ] Webhook endpoints are restricted to HTTPS and public addresses in production.
- [ ] Review [INTEGRATIONS-STATUS.md](./INTEGRATIONS-STATUS.md) — configure and **verify** the services you need from *Integrations*.
- [ ] Consult a tax advisor about ZATCA Phase 2 obligations — only the Phase-1 QR is implemented.

## Local development (without Docker)

Requires Node 22, pnpm 10, PostgreSQL 16, Redis 7.

```bash
cd abaya-os && pnpm install
cp apps/api/.env.example apps/api/.env      # edit DATABASE_URL, secrets
pnpm build:shared
pnpm --filter @abaya/api exec prisma migrate deploy
pnpm db:seed                                 # SEED_DEMO=true for a demo store
pnpm dev:api                                 # :4000
pnpm dev:web                                 # :3000 (proxies /api → :4000)
```

## Tests

```bash
pnpm --filter @abaya/shared test   # VAT math, size engine, RBAC
pnpm --filter @abaya/web test      # client utils
pnpm --filter @abaya/api test      # e2e against Postgres+Redis (TEST_DATABASE_URL, default db abaya_os_test)
```

The API suite runs `prisma migrate deploy` on the test database and isolates every test in its own
freshly registered store, so it never needs to wipe data.
