# ABAYA OS — Architecture & Implementation Plan

Multi-tenant SaaS for Saudi abaya brands. Arabic-first (RTL) with English, SAR currency,
`Asia/Riyadh` timezone, configurable VAT (default 15%).

## 1. Topology

```
abaya-os/
├── apps/
│   ├── api/        NestJS 11 REST API  (Prisma 6 → PostgreSQL 16, ioredis/BullMQ → Redis, S3 SDK → MinIO/S3)
│   └── web/        Next.js 15 App Router (TypeScript, Tailwind, shadcn/ui-style components, TanStack Query)
├── packages/
│   └── shared/     Zod schemas, enums, money/VAT helpers, size-recommendation engine (used by API + web)
├── docker-compose.yml   postgres, redis, minio (+ bucket bootstrap), api, web
└── docs/                ARCHITECTURE, API, DEPLOYMENT, INTEGRATIONS-STATUS
```

## 2. Multi-tenancy & security

* **Shared database, shared schema, `tenantId` column** on every tenant-owned table, with composite
  indexes/uniques prefixed by `tenantId` (e.g. `@@unique([tenantId, sku])`).
* Tenant is resolved **only from the verified JWT** (never from headers/body). `TenantGuard` puts
  `{userId, tenantId, role}` on the request; every service method takes `tenantId` and every Prisma
  query filters by it. Cross-tenant lookups return 404 (no existence leak). E2E tests assert isolation.
* **Auth:** email + password (bcrypt, cost 12), short-lived access JWT (15 min) + rotating refresh
  tokens (opaque, SHA-256 hashed in DB, revocable, reuse-detection revokes the family).
* **RBAC:** roles `OWNER`, `ADMIN`, `MANAGER`, `STAFF`, `SUPPORT` per membership + platform flag
  `isPlatformAdmin`. Permissions are declared per role in `packages/shared` and enforced by
  `@RequirePermission('orders:write')` + `PermissionsGuard`.
* **Public API:** tenant API keys (`ak_live_…`), SHA-256 hashed, scoped, sent as `x-api-key`.
* **Secrets at rest:** integration credentials encrypted with AES-256-GCM (`ENCRYPTION_KEY`).
* Helmet, CORS allow-list, rate limiting (Redis-backed throttler), Zod validation on every input,
  audit log for sensitive mutations, tenant suspension enforced at guard level.

## 3. Domain modules (API)

| Module | Persistence | Notes |
|---|---|---|
| auth | User, Membership, RefreshToken | register (creates tenant + owner + trial subscription), login, refresh, logout, me, switch tenant |
| tenants/settings | Tenant, TenantSettings | store profile (AR/EN names), VAT rate/enabled/prices-include-VAT, VAT & CR numbers, currency SAR, tz Asia/Riyadh |
| team | Membership, Invitation | invite (token link), change role, remove; owner protected |
| billing | Plan, Subscription, BillingInvoice | plan limits enforced (products, staff); payment gateway adapter — **not connected** until keys verified |
| catalog | Category, Product, ProductVariant, ProductImage | abaya attributes (fabric, cut, sleeve, closure, embellishment, occasion, opacity, care); variant matrix size × color × length |
| media | MediaAsset | upload to S3-compatible storage; refuses if storage not configured |
| inventory | Location, InventoryLevel, StockMovement | adjust / receive / transfer; reservations on order; low-stock alerts |
| customers (CRM) | Customer, CustomerMeasurement, CustomerNote | tags, lifetime value, measurement profiles |
| orders | Order, OrderItem, OrderEvent, Payment | per-tenant sequential numbers, VAT computation, status machine, stock decrement |
| returns | ReturnRequest, ReturnItem | return / exchange, approve → receive → restock → refund / replacement order |
| sizing | SizeChart, SizeChartRow, SizeRecommendation | merchant-defined measurements; deterministic recommendation engine with confidence & reasons |
| ai-content | AiGeneration | product title/description/SEO in AR/EN via Anthropic API; **disabled** unless key verified |
| ai-images | ImageJob | provider interface + job queue; no provider bundled ⇒ jobs rejected honestly |
| marketing | Segment, Campaign, Automation, AutomationRun | rule-based segments evaluated in SQL; sends require a verified channel |
| inbox | Channel, Conversation, Message | internal notes and replies persisted; outbound delivery only via verified channel adapters; signed inbound webhook endpoint |
| analytics | (queries) | revenue, AOV, orders, returns rate, top products, daily sales bucketed in Asia/Riyadh, Redis cache |
| integrations | Integration | status: NOT_CONFIGURED → CONFIGURED → VERIFIED / FAILED; real verification calls only |
| developer | ApiKey, WebhookEndpoint, WebhookDelivery | public v1 API, HMAC-signed outbound webhooks via BullMQ |
| admin (platform) | — | tenants list/suspend, plans CRUD, platform metrics |
| onboarding | Tenant.onboarding | checklist computed from real data |
| audit | AuditLog | who/what/when |

## 4. Honesty rules for external services

An integration is shown as **connected** only if `status = VERIFIED`, which is set exclusively by a
successful live API call made by the verification routine. Providers with real verification
implemented: Anthropic, S3-compatible storage, Moyasar, WhatsApp Cloud API, SMTP (connection test).
Providers with only architecture (Salla, Zid, Tap, Instagram, image-generation) stay
`CONFIGURED`/unverified and features depending on them return `503 INTEGRATION_NOT_CONNECTED`.
No seed data is created as "production" data: the seed creates plans, a platform admin and an
explicitly-labelled **demo** tenant (`demo` slug) only when `SEED_DEMO=true`.

## 5. Frontend

* `/[locale]` is avoided; locale lives in a cookie (`ar` default) → `<html lang dir>`; dictionaries in
  `src/i18n/{ar,en}.ts`. Logical CSS properties (`ms-`, `pe-`, `start-`) keep RTL/LTR symmetric.
* Theme tokens: ivory `#FAF7F2`, charcoal `#2B2B2B`, muted beige `#E8DFD3`, gold `#B8975A` (accents only).
  Fonts: IBM Plex Sans Arabic (UI) + Playfair-style display for headings.
* Every data view uses a shared `<QueryState>` handling loading skeletons, error with retry, and
  empty states with a primary action.
* Auth: access token in memory + refresh token in httpOnly cookie set by the API.

## 6. Phases

1. Monorepo, shared package, Prisma schema + migration, Nest bootstrap (config, prisma, redis, guards, errors, swagger).
2. Auth/tenancy/RBAC/team/settings/billing/audit.
3. Catalog/media/inventory/customers/orders/returns/sizing.
4. AI content/images, marketing, inbox, analytics, integrations, developer API, admin, onboarding.
5. Web app: shell, i18n, auth, every module screen.
6. Tests (unit: VAT, sizing, RBAC, crypto; e2e: auth, isolation, orders/inventory, returns), Docker, docs.
