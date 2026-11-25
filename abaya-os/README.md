# ABAYA OS · عباية OS

منصة SaaS متعددة المستأجرين لإدارة علامات ومتاجر العبايات السعودية — عربية أولاً (RTL) مع دعم الإنجليزية،
بالريال السعودي، بتوقيت الرياض، وضريبة قيمة مضافة قابلة للضبط.

A multi-tenant SaaS platform for Saudi abaya brands. Arabic-first RTL UI with English, SAR, Asia/Riyadh, configurable VAT.

| | |
|---|---|
| **Stack** | Next.js 15 · TypeScript · Tailwind · shadcn/ui-style components · NestJS 11 · Prisma 6 · PostgreSQL 16 · Redis 7 (BullMQ) · S3/MinIO |
| **Docs** | [Architecture](docs/ARCHITECTURE.md) · [API](docs/API.md) · [Deployment](docs/DEPLOYMENT.md) · [Integration status](docs/INTEGRATIONS-STATUS.md) |
| **Tests** | 31 automated tests: VAT & size engine units, API end-to-end (auth, tenant isolation, RBAC, concurrent stock, returns/exchanges, integrations honesty, public API, analytics) |

## Modules

- **Auth & tenancy** — store registration with 14-day trial, JWT + rotating refresh tokens with reuse detection, store switching, tenant isolation enforced on every query.
- **RBAC** — Owner / Admin / Manager / Staff / Support with per-permission guards; no role escalation; platform admin panel.
- **Catalog** — abaya attributes (cut, fabric, sleeves, closure, embellishment, opacity, occasions, shayla), variant matrix **size × colour × length**, categories, images on S3.
- **Inventory** — multi-location, atomic stock movements (no overselling under concurrency), transfers, low-stock alerts.
- **Orders** — sequential numbers per store, VAT-inclusive/exclusive totals, status machine, manual payment recording, ZATCA Phase-1 QR invoices.
- **Returns & exchanges** — approve → receive (restock) → complete (refund, or replacement order with value credit).
- **CRM** — customers, tags, notes, measurement profiles, lifetime value.
- **Size recommendation engine** — merchant-defined measurement ranges and length-by-height tables, fit preference and heel allowance, confidence + reasons.
- **AI content studio** — Arabic/English product copy via Claude (only after the key is verified), plan credits.
- **AI image studio** — job queue + provider adapter contract (no provider bundled — shown honestly).
- **Marketing** — rule-based segments, campaigns, event-driven automations; PDPL opt-in enforced; sends only through verified channels.
- **Unified inbox** — channels, conversations, replies & internal notes, signed WhatsApp inbound webhook.
- **Analytics** — revenue, AOV, VAT, returns, top products, best-selling sizes/lengths, Riyadh-day series.
- **Integrations** — encrypted credentials, live verification; **Developer** API keys, signed webhooks, public REST API v1.
- **Billing** — plans with limits (products, staff, AI credits), usage, manual plan assignment with VAT invoice records.
- **Onboarding** — checklist computed from real data; audit log.

## Quick start

```bash
cp .env.example .env    # fill secrets
docker compose up -d --build
docker compose exec api npx ts-node --transpile-only prisma/seed.ts
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for local development without Docker.

## Data policy

The seed creates subscription **plans** and an optional **platform admin**. A demo store
(`demo@abaya-os.local`) is created **only** when `SEED_DEMO=true`, and it is flagged `isDemo` and
labelled "تجريبي/Demo" everywhere in the UI. No external service is ever reported as connected
without a successful live verification — see [Integration status](docs/INTEGRATIONS-STATUS.md).
