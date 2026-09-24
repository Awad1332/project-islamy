# 03 — Architecture, Database, API, Security, Privacy, Scalability

## 1. قرارات تقنية أساسية

| القرار | الاختيار | السبب |
|--------|---------|-------|
| النمط | **Modular Monolith** (وليس Microservices) | فريق صغير؛ الحدود بين الـModules واضحة في الكود ويمكن فصلها لاحقًا |
| اللغة | TypeScript (Backend + Frontend) | لغة واحدة لفريق 2–3 مطورين؛ SDKs سلة الرسمية بـ Node (express-starter-kit, oauth2-merchant) |
| Backend | NestJS (أو Fastify + Modules) | Modules/DI جاهزة تطابق التقسيم المطلوب |
| Frontend | Next.js + Tailwind (RTL) | SSR للتقارير المشاركة، سرعة تطوير |
| DB | PostgreSQL 16 (+ Partitioning) | علاقات + JSONB للخام + RLS للـTenancy |
| Queue | Redis + BullMQ | Rate limit لكل متجر، Retries، Scheduling |
| Events (لاحقًا) | ClickHouse | فقط عندما تتجاوز أحداث الـTracker ~50M/شهر |
| Hosting | منطقة داخل السعودية (GCP Dammam أو Oracle Jeddah/Riyadh أو STC Cloud) | نظام حماية البيانات الشخصية (PDPL) وثقة التاجر |
| LLM | Claude عبر API (Sonnet للشرح والتقارير، Haiku للتصنيف القصير) خلف طبقة `LLMGateway` مستقلة عن المزود | إمكانية التبديل، والتحكم في التكلفة والتسجيل |

## 2. الـModules

```
┌──────────────────────────────── NABD Modular Monolith ────────────────────────────────┐
│                                                                                        │
│  [Identity & Tenancy]  orgs, users, memberships, roles, agency links                   │
│  [Store Mgmt]          stores, connections (tokens), settings, onboarding answers      │
│  [Integrations/Salla]  OAuth, API client (rate-limited), webhook receiver, backfill    │
│  [Tracker]             snippet JS, event collector endpoint, bot filter                │
│  [Ingestion]           raw payload store → Normalizer → canonical tables               │
│  [Metrics Engine]      daily store/product/customer metrics (SQL, deterministic)       │
│  [Opportunity Engine]  detectors → scoring → dedupe → lifecycle                        │
│  [Experiment Engine]   design, baseline, power check, monitor, analyze, decide         │
│  [Memory]              timeline events, learnings, suppression rules                   │
│  [AI Layer]            LLMGateway, prompt templates, fact packs, validator             │
│  [Briefs & Reports]    daily brief, weekly report, PDF, share links                    │
│  [Notifications]       budgets, channels (in-app, email), dedupe                       │
│  [Billing]             Salla subscription webhooks, plan entitlements, usage           │
│  [Audit]               audit_log for every write & every AI output                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

قاعدة: كل Module يكشف Service Interface فقط. لا Module يقرأ جداول Module آخر مباشرة إلا عبر Views مخصصة للقراءة (Metrics → Opportunity).

## 3. Data Pipeline

```
Salla API (backfill)  ─┐
Salla Webhooks        ─┼─► raw_payloads (JSONB, append-only, idempotent by (source, external_id, hash))
Tracker events        ─┘                │
                                        ▼
                               Normalizer (per entity, versioned mappers)
                                        │
                                        ▼
                  canonical tables: products, orders, order_items, customers, carts, coupons,
                                    product_snapshots (price/stock daily), storefront_events
                                        │
                                        ▼
                    Metrics Engine (nightly + incremental hourly; pure SQL, versioned formulas)
                                        │
                                        ▼
       daily_store_metrics · daily_product_metrics · customer_state (RFM) · product_pairs
                                        │
                                        ▼
                Opportunity Engine (detectors read metrics only; write opportunities + evidence)
                                        │
                                        ▼
                  Memory check (suppress / adjust / annotate using past learnings)
                                        │
                                        ▼
                AI Layer: fact pack (JSON with IDs) → LLM → Validator → stored explanation
                                        │
                                        ▼
                     Dashboard · Daily Brief · Weekly Report · Agency view
```

**قاعدة ذهبية**: الـAI لا يرى جداول خام ولا يحسب أي رقم. يستقبل Fact Pack جاهزًا.

## 4. Database Schema (PostgreSQL)

> كل جدول تابع لمتجر يحمل `store_id` ويخضع لـ Row Level Security. الأموال بـ `numeric(14,2)` وبعملة المتجر. الأوقات `timestamptz` وتُحوّل لتوقيت الرياض عند التجميع اليومي.

```sql
-- ============ Identity & Tenancy ============
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('merchant','agency')),
  branding jsonb,                          -- white-label later (logo, colors, "Powered by")
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  email citext unique,
  name text,
  salla_user_id bigint,                    -- من /oauth2/user/info
  locale text not null default 'ar',
  created_at timestamptz not null default now()
);

create table memberships (
  user_id uuid references users(id),
  organization_id uuid references organizations(id),
  role text not null check (role in ('owner','admin','member','viewer','account_manager')),
  primary key (user_id, organization_id)
);

-- ============ Stores ============
create table stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),   -- المالك (التاجر)
  salla_merchant_id bigint unique not null,
  name text, domain text, currency char(3) default 'SAR',
  category text,                           -- من الـOnboarding (عطور، أزياء...)
  timezone text not null default 'Asia/Riyadh',
  maturity_tier text check (maturity_tier in ('insufficient','growing','advanced')),
  status text not null default 'active',   -- active | uninstalled | suspended
  installed_at timestamptz, uninstalled_at timestamptz
);

create table agency_store_links (          -- وكالة ترى متجر عميل (بموافقة التاجر)
  agency_org_id uuid references organizations(id),
  store_id uuid references stores(id),
  assigned_user_id uuid references users(id),
  granted_by_user_id uuid references users(id),
  granted_at timestamptz not null default now(),
  primary key (agency_org_id, store_id)
);

create table store_connections (
  store_id uuid primary key references stores(id),
  access_token_enc bytea not null,         -- envelope encryption (KMS)
  refresh_token_enc bytea not null,
  access_expires_at timestamptz not null,
  scopes text[],
  refresh_lock_version int not null default 0,  -- optimistic lock: refresh token أحادي الاستخدام
  last_refreshed_at timestamptz
);

create table store_settings (
  store_id uuid primary key references stores(id),
  goal text,                                -- revenue | aov | retention | conversion
  default_margin_pct numeric(5,2),          -- هامش تقريبي من التاجر
  category_margins jsonb,
  has_ga4 boolean, ga4_property_id text,
  free_shipping_threshold numeric(14,2),
  notification_prefs jsonb
);

-- ============ Ingestion ============
create table raw_payloads (
  id bigserial,
  store_id uuid not null,
  source text not null,                     -- salla_api | salla_webhook | tracker | ga4
  entity text not null,                     -- order | product | customer | cart | ...
  external_id text,
  payload jsonb not null,
  payload_hash bytea not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  primary key (id, received_at)
) partition by range (received_at);         -- شهري؛ حذف بعد 90 يومًا
create unique index on raw_payloads (store_id, source, entity, external_id, payload_hash, received_at);

create table sync_jobs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  kind text not null,                       -- backfill | reconcile | incremental
  entity text not null,
  cursor jsonb,                             -- للاستئناف بعد الانقطاع
  status text not null,                     -- queued | running | done | failed
  pages_done int default 0, pages_total int,
  error text, started_at timestamptz, finished_at timestamptz
);

-- ============ Canonical commerce data ============
create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  salla_product_id bigint not null,
  name text not null, sku text, category_ids bigint[],
  price numeric(14,2), sale_price numeric(14,2), cost_price numeric(14,2),
  quantity int, unlimited_quantity boolean,
  status text, images_count int, description_length int,
  created_at_source timestamptz, updated_at_source timestamptz,
  unique (store_id, salla_product_id)
);

create table product_snapshots (            -- لقطة يومية: أساس كشف تغيّر السعر/نفاد المخزون
  store_id uuid not null, product_id uuid not null, snapshot_date date not null,
  price numeric(14,2), sale_price numeric(14,2), quantity int, status text,
  primary key (store_id, product_id, snapshot_date)
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  salla_customer_id bigint not null,
  email_hash bytea, phone_hash bytea,       -- لا نخزّن PII خامًا إلا عند الحاجة للتصدير (انظر الخصوصية)
  city text, country text,
  first_order_at timestamptz, last_order_at timestamptz,
  orders_count int default 0, total_spent numeric(14,2) default 0,
  unique (store_id, salla_customer_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  salla_order_id bigint not null,
  customer_id uuid references customers(id),
  status text not null,                     -- normalized: pending|completed|cancelled|refunded|...
  source_status text,                       -- كما جاءت من سلة
  payment_method text,                      -- cod | card | tabby | tamara | ...
  subtotal numeric(14,2), discount numeric(14,2), shipping numeric(14,2), tax numeric(14,2),
  total numeric(14,2) not null,
  coupon_code text,
  items_count int,
  city text,
  placed_at timestamptz not null,
  updated_at_source timestamptz,
  unique (store_id, salla_order_id)
);
create index on orders (store_id, placed_at);

create table order_items (
  id bigserial primary key,
  store_id uuid not null, order_id uuid not null references orders(id),
  product_id uuid references products(id),
  quantity int not null, unit_price numeric(14,2), total numeric(14,2),
  cost_price numeric(14,2)                  -- snapshot وقت البيع إن توفر
);
create index on order_items (store_id, product_id);

create table abandoned_carts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null, salla_cart_id bigint not null,
  customer_id uuid, total numeric(14,2), items jsonb,
  created_at_source timestamptz, recovered_order_id uuid,
  unique (store_id, salla_cart_id)
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null, salla_coupon_id bigint, code text,
  type text, amount numeric(14,2), starts_at timestamptz, expires_at timestamptz,
  created_by_nabd boolean default false, experiment_id uuid
);

create table storefront_events (            -- من الـTracker
  store_id uuid not null,
  event_time timestamptz not null,
  session_id text not null,                 -- مجهول، يتجدد؛ لا cookies تعريفية
  event text not null,                      -- product_view | add_to_cart | checkout_start | ...
  product_id uuid, value numeric(14,2),
  device text, referrer_class text          -- direct|social|search|ads|other (مصنّف، لا URL كامل)
) partition by range (event_time);

-- ============ Metrics ============
create table daily_store_metrics (
  store_id uuid not null, day date not null,
  revenue numeric(14,2), orders int, aov numeric(14,2),
  new_customers int, returning_customers int,
  cancelled_orders int, cod_share numeric(5,4), coupon_orders int,
  sessions int, product_views int, add_to_carts int, checkouts int,   -- null إن لم يعمل الـTracker
  abandoned_carts int, abandoned_value numeric(14,2),
  formula_version int not null,
  primary key (store_id, day)
);

create table daily_product_metrics (
  store_id uuid not null, product_id uuid not null, day date not null,
  units int, revenue numeric(14,2), orders int,
  views int, add_to_carts int,
  in_stock boolean, price numeric(14,2),
  primary key (store_id, product_id, day)
);

create table customer_state (               -- تُحدّث يوميًا
  store_id uuid not null, customer_id uuid not null,
  recency_days int, frequency int, monetary numeric(14,2),
  segment text,                             -- new | active | at_risk | dormant | lost | vip
  primary key (store_id, customer_id)
);

create table product_pairs (                -- Market basket، تُحسب أسبوعيًا
  store_id uuid not null, product_a uuid not null, product_b uuid not null,
  window_days int not null,
  orders_a int, orders_b int, orders_ab int,
  support numeric, confidence_a_to_b numeric, lift numeric,
  computed_at timestamptz,
  primary key (store_id, product_a, product_b, window_days)
);

-- ============ Opportunities ============
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  detector text not null,                   -- 'dormant_customers_v1' ...
  category text not null,                   -- revenue|conversion|aov|retention|product|marketing|customer|operations
  entity_type text, entity_ids uuid[],      -- المنتجات/الشرائح المعنية
  dedupe_key text not null,                 -- يمنع تكرار نفس الفرصة
  status text not null default 'open',      -- open|snoozed|dismissed|in_experiment|resolved|expired
  score numeric(5,2) not null,
  score_breakdown jsonb not null,           -- impact, confidence, ease, speed, reach, strategic
  impact_low numeric(14,2), impact_high numeric(14,2), impact_basis text,
  confidence text not null,                 -- low|medium|high
  difficulty text not null,                 -- easy|medium|hard
  facts jsonb not null,                     -- Fact Pack (المصدر الوحيد للـAI)
  explanation_ar text, explanation_meta jsonb,
  memory_notes jsonb,                       -- "سبق اختبار خصم 20%..."
  dismiss_reason text,
  detected_at timestamptz not null default now(), expires_at timestamptz
);
-- فرصة مفتوحة واحدة فقط لكل dedupe_key
create unique index opportunities_one_active on opportunities (store_id, dedupe_key)
  where status in ('open','snoozed','in_experiment');

create table recommended_actions (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id),
  action_type text not null,                -- winback_campaign|bundle|pdp_improve|restock|threshold_change...
  title_ar text, steps jsonb, assets jsonb, -- قالب رسالة، كود كوبون مقترح...
  executable_via_api boolean default false
);

-- ============ Experiments ============
create table experiments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  opportunity_id uuid references opportunities(id),
  name text not null, hypothesis text not null,
  design text not null,                     -- holdout | pre_post_control | pre_post
  primary_metric text not null,             -- aov | cvr | repeat_rate | revenue_per_view | units
  guardrail_metrics text[],                 -- margin, cancellation_rate...
  entity_ids uuid[], control_entity_ids uuid[],
  baseline jsonb not null,                  -- القيم + الفترة + الطريقة
  target_value numeric, min_detectable_effect numeric,
  planned_start date, planned_end date, actual_start date, actual_end date,
  status text not null default 'draft',     -- draft|running|analyzing|concluded|aborted
  result jsonb,                             -- effect, CI, p/probability, contamination flags
  outcome text,                             -- win|loss|inconclusive
  decision text,                            -- continue|stop|iterate|extend
  decided_by uuid references users(id), decided_at timestamptz
);

create table experiment_assignments (       -- للـHoldout على مستوى العميل
  experiment_id uuid not null references experiments(id),
  customer_id uuid not null,
  arm text not null check (arm in ('treatment','control')),
  primary key (experiment_id, customer_id)
);

-- ============ Memory ============
create table memory_events (
  id bigserial primary key,
  store_id uuid not null,
  occurred_at timestamptz not null,
  kind text not null,                       -- price_change|stock_out|restock|product_added|coupon_created|
                                            -- experiment_started|experiment_concluded|decision|note|season
  entity_type text, entity_id uuid,
  source text not null,                     -- webhook|snapshot_diff|user|system
  data jsonb not null,
  summary_ar text
);
create index on memory_events (store_id, occurred_at desc);

create table learnings (                    -- خلاصة قابلة للاستخدام من التجارب
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  entity_type text, entity_id uuid,
  intervention text not null,               -- discount_pct | bundle | winback_coupon | pdp_change ...
  params jsonb,                             -- {"discount_pct":20}
  metric text, effect numeric, confidence text,
  side_effects jsonb,                       -- {"margin":"negative"}
  verdict text not null,                    -- works|does_not_work|harmful|unclear
  experiment_id uuid references experiments(id),
  valid_until date                          -- التعلّم له صلاحية (المواسم تتغير)
);

-- ============ Briefs, Reports, Notifications ============
create table briefs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null, kind text not null check (kind in ('daily','weekly')),
  period_start date, period_end date,
  content jsonb not null, rendered_ar text, pdf_url text, share_token text unique,
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null, user_id uuid,
  channel text, priority int, dedupe_key text,
  payload jsonb, sent_at timestamptz, opened_at timestamptz
);

-- ============ AI & Audit & Billing ============
create table ai_generations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null, purpose text,     -- opportunity_explanation|weekly_report|chat
  model text, prompt_version text,
  input_facts_hash bytea, output text,
  validation jsonb,                         -- الأرقام المطابقة، العبارات الممنوعة، fallback?
  input_tokens int, output_tokens int, cost_usd numeric(10,5),
  created_at timestamptz default now()
);

create table audit_log (
  id bigserial primary key,
  organization_id uuid, store_id uuid, actor_user_id uuid, actor_kind text, -- user|system|agency
  action text not null, target text, diff jsonb, ip inet,
  created_at timestamptz default now()
);

create table subscriptions (
  store_id uuid primary key references stores(id),
  plan text not null, status text not null, -- trial|active|past_due|cancelled
  source text default 'salla',
  trial_ends_at timestamptz, current_period_end timestamptz,
  salla_subscription_payload jsonb
);

create table usage_counters (
  store_id uuid not null, period date not null, metric text not null, value int not null default 0,
  primary key (store_id, period, metric)
);
```

## 5. API Architecture

**النمط**: REST داخلي (`/api/v1`) يخدم الواجهة، + endpoints عامة لـWebhooks والـTracker. لا GraphQL في MVP.

### 5.1 Public/Inbound
| Method | Path | الوصف |
|--------|------|-------|
| POST | `/webhooks/salla` | يستقبل كل أحداث سلة؛ يتحقق من التوقيع؛ يكتب في `raw_payloads`؛ يرد 200 خلال < 500ms ويعالج Async |
| POST | `/t/e` | Collector للـTracker (batch حتى 20 حدثًا)؛ مفتاح عام لكل متجر + Origin check + Rate limit |
| GET | `/share/r/:token` | تقرير أسبوعي للمشاركة (قراءة فقط، صلاحية محدودة) |

### 5.2 App API (مصادقة بجلسة + `X-Store-Id`)
```
GET    /api/v1/me
GET    /api/v1/stores                               # للوكالة: كل المتاجر المرتبطة
GET    /api/v1/stores/:id/overview?date=            # KPIs + top opportunity + attention + improved + task
GET    /api/v1/stores/:id/sync-status
PATCH  /api/v1/stores/:id/settings

GET    /api/v1/stores/:id/opportunities?category=&status=&limit=
GET    /api/v1/opportunities/:oid                   # evidence + explanation + actions + memory notes
POST   /api/v1/opportunities/:oid/dismiss           # { reason: not_relevant|inaccurate|done_already|later }
POST   /api/v1/opportunities/:oid/snooze            # { until }
POST   /api/v1/opportunities/:oid/experiments       # ينشئ تجربة Draft من الفرصة

GET    /api/v1/stores/:id/experiments?status=
GET    /api/v1/experiments/:eid
PATCH  /api/v1/experiments/:eid                     # تعديل المدة/المعايير قبل البدء
POST   /api/v1/experiments/:eid/start
POST   /api/v1/experiments/:eid/abort
POST   /api/v1/experiments/:eid/decision            # { decision, note }
POST   /api/v1/experiments/:eid/export-segment      # CSV للعملاء (Treatment فقط)
POST   /api/v1/experiments/:eid/create-coupon       # عبر Salla API

GET    /api/v1/stores/:id/memory?from=&kind=
POST   /api/v1/stores/:id/memory                    # ملاحظة يدوية: "بدأت إعلان سناب"

GET    /api/v1/stores/:id/briefs/daily/latest
GET    /api/v1/stores/:id/reports/weekly?week=
POST   /api/v1/reports/:rid/share

GET    /api/v1/agency/portfolio                     # حالة كل متجر + أهم فرصة + آخر تجربة + آخر تواصل
POST   /api/v1/agency/stores/:id/touchpoints        # "اتصلت بالعميل"
```

### 5.3 Jobs (BullMQ)
| Queue | الجدولة | الوصف |
|-------|---------|-------|
| `salla-backfill` | عند التثبيت | صفحات بالترتيب: آخر 90 يومًا أولًا ثم الأقدم |
| `salla-reconcile` | ليليًا 03:00 الرياض | إعادة جلب الطلبات المحدثة آخر 72 ساعة (Webhooks قد تضيع) |
| `token-refresh` | كل ساعة | تحديث التوكنات التي تنتهي خلال 48 ساعة (مع قفل) |
| `snapshots` | يوميًا 00:30 | لقطات أسعار/مخزون |
| `metrics` | يوميًا 01:00 + تزايدي كل ساعة | |
| `detectors` | يوميًا 02:00 + أسبوعي للـpairs | |
| `experiments-monitor` | يوميًا | فحص التلوث، الـGuardrails، انتهاء المدة |
| `brief-daily` | 06:30 الرياض | |
| `report-weekly` | الأحد 07:00 | بداية الأسبوع السعودي |

## 6. Security Model

| الطبقة | الإجراء |
|--------|---------|
| Tenancy | Postgres RLS: `store_id = current_setting('app.store_id')`؛ اختبار آلي يحاول قراءة متجر آخر في كل CI |
| RBAC | owner / admin / member / viewer / account_manager؛ الوكالة لا ترى إلا المتاجر في `agency_store_links` وبعد موافقة صريحة من التاجر وقابلة للإلغاء |
| Tokens | Envelope encryption (KMS)؛ لا تظهر في Logs؛ Refresh بقفل موزع لأن **refresh token في سلة أحادي الاستخدام** — استخدامه مرتين يبطل الوصول ويجبر التاجر على إعادة التثبيت |
| Webhooks | التحقق من توقيع سلة (Signature/Token حسب إعداد التطبيق) + Idempotency + رفض الأحداث القديمة |
| Tracker | مفتاح عام لكل متجر، Origin allowlist = نطاق المتجر، Rate limit، فلترة Bots، لا يقبل PII |
| LLM | لا PII؛ نصوص المنتجات والمراجعات تُعامل كـ **Untrusted input** (Prompt Injection)؛ المخرج يمر بـ Validator؛ اتفاقية عدم الاحتفاظ بالبيانات مع المزود |
| التطبيق | OWASP ASVS L2؛ CSP صارم؛ Secrets في Secret Manager؛ Dependabot؛ اختبار اختراق قبل الإطلاق العام |
| Audit | كل كتابة (إنشاء كوبون، بدء تجربة، ربط وكالة) + كل مخرج AI يُسجّل |
| Least privilege | نطلب من سلة أقل Scopes ممكنة: قراءة للطلبات/المنتجات/العملاء/السلات؛ كتابة **فقط** للكوبونات والعروض الخاصة (اختيارية ويمكن تأجيلها) |

## 7. Privacy Considerations

1. **PDPL (نظام حماية البيانات الشخصية السعودي)**: نحن "معالج بيانات" لصالح التاجر (المتحكم). نحتاج اتفاقية معالجة بيانات (DPA) ضمن شروط الاستخدام، سجل أنشطة معالجة، وإجراء للإبلاغ عن الاختراقات.
2. **تقليل البيانات**: التحليلات لا تحتاج أسماء أو جوالات. نخزّن Hash للإيميل/الجوال (لربط العميل) و**لا نخزّن الخام** إلا إذا فعّل التاجر ميزة "تصدير الشريحة" — وحتى حينها نجلبها لحظيًا من سلة وقت التصدير ولا نحفظها.
3. **النقل عبر الحدود**: استدعاءات الـLLM قد تعالج خارج المملكة → نرسل **مجاميع وأرقامًا وأسماء منتجات فقط**، بلا بيانات شخصية. يوثق ذلك في سياسة الخصوصية.
4. **الـTracker**: Session ID مجهول يتجدد، بلا Fingerprinting، بلا تتبع عبر المواقع، يحترم إشارات عدم التتبع. نص إفصاح جاهز يضيفه التاجر لسياسة خصوصية متجره.
5. **إلغاء التثبيت**: عند `app.uninstalled` → إيقاف المزامنة فورًا، إبطال التوكنات، حذف البيانات بعد 30 يومًا (فترة سماح لإعادة التثبيت) مع إشعار.
6. **Benchmarks**: تستخدم مجاميع مجهولة فقط، بحد أدنى 10 متاجر في كل مجموعة مقارنة، ولا يمكن استنتاج متجر بعينه. موافقة ضمنية في الشروط مع إمكانية الانسحاب.
7. **الوكالات**: وصول الوكالة يتطلب موافقة التاجر، ويظهر للتاجر من يرى بياناته، ويمكنه الإلغاء بضغطة.

## 8. Scalability Plan

### الحسابات الأساسية
- حد سلة: 60–180 طلبًا/دقيقة **لكل متجر** حسب الخطة، و500 طلب/10 دقائق لـ endpoint العملاء.
- Backfill لمتجر 1,000 طلب/شهر (12 شهرًا = 12,000 طلب). بافتراض 50 عنصرًا/صفحة → 240 طلب API ≈ 4 دقائق عند 60/دقيقة.
- **خطر يجب التحقق منه**: إن كانت قائمة الطلبات لا تحتوي على العناصر (items) ونحتاج طلب تفاصيل لكل طلب → 12,000 طلب API ≈ 3.3 ساعات. لمتجر 20,000 طلب/شهر = أيام. الحل: استيراد آخر 90 يومًا أولًا (تظهر الفرص)، ثم الباقي في الخلفية، وسقف 6 أشهر للمتاجر الكبيرة.
- لأن الحد لكل متجر وليس للتطبيق كله، التوازي بين المتاجر سهل؛ الـQueue يحتاج Token bucket لكل `store_id`.

### المراحل
| المرحلة | عدد المتاجر | البنية |
|---------|------------|--------|
| 1 | 0–300 | خادم تطبيق واحد + Workers (2) + Postgres مُدار (4 vCPU) + Redis |
| 2 | 300–2,000 | فصل Workers حسب Queue، Read replica للـDashboard، تقسيم `order_items`/`storefront_events` حسب الزمن، Materialized views |
| 3 | 2,000+ | ClickHouse لأحداث الـTracker والمقاييس اليومية، Postgres للمعاملات والحالة فقط، تقسيم Workers بالـHash على `store_id` |

### مبادئ
- كل شيء يعرضه الـDashboard **محسوب مسبقًا** (لا Queries ثقيلة وقت الطلب).
- Detectors قابلة للتشغيل لكل متجر بشكل مستقل (Idempotent، يمكن إعادة تشغيلها).
- تكلفة الـLLM مقيدة لكل متجر شهريًا (Budget) حسب الخطة؛ الشروح تُخزّن ولا يُعاد توليدها إلا إذا تغيرت الـFacts.
