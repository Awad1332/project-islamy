-- Abaya Studio AI — PostgreSQL schema for the production Repository adapter.
-- Mirrors src/lib/store/repository.ts. Every row is scoped by store_id (multi-tenant SaaS).

create table stores (
  id                  text primary key,               -- e.g. 'demo'
  name                text not null,
  currency            text not null default 'SAR',
  base_price          integer not null,               -- SAR
  base_lead_time_days integer not null default 5,
  size_rules          jsonb not null,                 -- SizeRules
  updated_at          timestamptz not null default now()
);

create type option_group as enum
  ('cut','length','sleeve','neckline','closure','fabric','color','embroidery','extra');

create table design_options (
  store_id        text not null references stores(id) on delete cascade,
  id              text not null,                      -- '<group>.<code>'
  "group"         option_group not null,
  code            text not null,
  name            text not null,
  name_en         text not null,
  description     text not null default '',
  price           integer not null default 0,
  available       boolean not null default true,
  sku             text not null,
  lead_time_days  integer not null default 0,
  image_url       text,
  visual          jsonb,                              -- OptionVisual
  prompt          text,
  sort_order      integer not null default 0,
  primary key (store_id, id),
  unique (store_id, "group", code)
);

-- Compatibility rules (both kinds are evaluated symmetrically by the engine).
create table option_rules (
  store_id   text not null,
  option_id  text not null,
  other_id   text not null,
  kind       text not null check (kind in ('incompatible','compatible_only')),
  primary key (store_id, option_id, other_id, kind),
  foreign key (store_id, option_id) references design_options(store_id, id) on delete cascade,
  foreign key (store_id, other_id)  references design_options(store_id, id) on delete cascade
);

create table size_chart (
  store_id    text not null references stores(id) on delete cascade,
  size        text not null,
  length_cm   numeric not null,
  bust_cm     numeric not null,
  min_height  numeric not null,
  max_height  numeric not null,
  primary key (store_id, size)
);

create type design_status as enum ('draft','saved','in_cart','ordered');

create sequence design_number start 10000;

create table designs (
  id            text primary key,
  code          text not null unique,                -- 'AB10294'
  store_id      text not null references stores(id),
  config        jsonb not null,                       -- DesignConfig (option codes)
  sku           text not null,
  price         jsonb not null,                       -- PriceBreakdown snapshot
  price_total   integer not null,
  size          jsonb,
  images        jsonb not null default '[]',
  prompt        text,
  status        design_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  saved_at      timestamptz,
  cart_added_at timestamptz,
  ordered_at    timestamptz
);
create index designs_store_created on designs (store_id, created_at desc);
-- Analytics: preference shares per option are simple GROUP BYs over config.
create index designs_config_gin on designs using gin (config);

create table carts (
  id          text primary key,
  store_id    text not null references stores(id),
  items       jsonb not null default '[]',
  updated_at  timestamptz not null default now()
);

create table orders (
  id          text primary key,
  number      text not null,
  store_id    text not null references stores(id),
  cart_id     text not null,
  items       jsonb not null,
  total       integer not null,
  created_at  timestamptz not null default now()
);

create table product_templates (
  id                  text primary key,
  store_id            text not null references stores(id),
  source_design_code  text not null references designs(code),
  name                text not null,
  description         text not null default '',
  images              jsonb not null,
  price               integer not null,
  sku                 text not null,
  sizes               jsonb not null,
  components          jsonb not null,
  config              jsonb not null,
  lead_time_days      integer not null,
  status              text not null default 'draft',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table merchants (
  email     text primary key,
  store_id  text not null references stores(id),
  name      text not null
);

create table otp_codes (
  email       text primary key,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    integer not null default 0
);
