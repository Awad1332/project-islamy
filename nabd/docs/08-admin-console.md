# 08 — لوحة تحكم الإدارة (Admin Console)

لوحة داخلية لفريق نبض، منفصلة عن تطبيق التاجر. تغطي الإيراد والباقات والمتاجر والمستخدمين والاستهداف والدعم والتدقيق.

## 1. قبل البناء: حدود يجب الاتفاق عليها

### أ. ما يحق لنا استخدامه في الاستهداف
نحن **معالج بيانات** لصالح التاجر (وثيقة 03، الخصوصية). لذلك نفصل بين نوعين من البيانات:

| النوع | أمثلة | استخدامه في الاستهداف |
|-------|-------|----------------------|
| **بيانات علاقتنا بالتاجر** (نحن المتحكم) | اسم التاجر، بريده، جواله من التثبيت، الباقة، تاريخ التثبيت، الاستخدام داخل نبض، عدد التجارب | ✅ مسموح، مع موافقة تسويقية للرسائل الترويجية وإمكانية إلغاء الاشتراك |
| **مؤشرات مجمعة عن حجم المتجر** | شريحة عدد الطلبات، نطاق الإيراد، الفئة، المدينة | ✅ مسموح داخليًا للتقسيم (مثلًا: "متاجر 1,000+ طلب على Starter")، بشرط ذكر ذلك في الشروط |
| **بيانات عملاء التاجر** | أسماء وجوالات المشترين، طلباتهم الفردية | ❌ **ممنوع تمامًا**. ليست بياناتنا، ولا تظهر في لوحة الإدارة إطلاقًا |

لذلك، طلب **"الداتا كاملة عن المتاجر"** يتحقق بالشكل التالي: كل ما يخص **المتجر كعميل لنا** يظهر كاملًا، وأرقام أدائه تظهر **مجمعة**. أما بيانات المشترين فلا تظهر، وأي دخول لبيانات متجر بعينه (للدعم) يكون بسبب مكتوب ومسجل.

هذا ليس تحفظًا نظريًا. نظام حماية البيانات الشخصية (PDPL) وشروط شركاء سلة يمنعان استخدام بيانات المتجر خارج الغرض الذي ثبّت التاجر التطبيق من أجله. أي تسريب أو إساءة هنا قد تُخرج التطبيق من متجر سلة.

### ب. الباقات والفوترة عبر سلة
الاشتراكات التي تُدفع عبر متجر تطبيقات سلة **تُعرّف أسعارها في بوابة شركاء سلة**. لوحة الإدارة لا تستطيع تغيير سعر يدفعه التاجر في سلة وحدها. التصميم:
- **الباقة في نبض** = الحدود والمزايا (Entitlements) + ربط برقم الباقة في سلة (`salla_plan_id`).
- **تغيير السعر** = يتم في بوابة سلة، ثم يُحدّث في لوحتنا (أو يُقرأ تلقائيًا من Webhook الاشتراك).
- **باقات خارج سلة** (عقود الوكالات، Enterprise) = تُدار بالكامل من لوحتنا، بفواتير مباشرة.
- ⚠️ يجب التحقق من سلة: هل يُسمح بأكثر من باقة، وبباقات مخفية أو خاصة، وبترقية الباقة من داخل التطبيق.

## 2. الأقسام

| القسم | ماذا يعرض | ماذا يمكن فعله |
|-------|-----------|----------------|
| **نظرة عامة** | MRR، المتاجر النشطة، التجارب المجانية، التحويل للمدفوع، الإلغاء، قمع التفعيل، توزيع الباقات | فلترة بالفترة |
| **المتاجر** | جدول كل المتاجر: الباقة، الحالة، شريحة الطلبات، الفئة، المدينة، مؤشر الصحة، آخر نشاط، التجارب، الوكالة | بحث وفلترة، فتح ملف المتجر، إضافة وسوم وملاحظات |
| **ملف المتجر** | بيانات التاجر، سجل الاشتراك والفواتير، الاستخدام، حالة المزامنة، الفرص والتجارب (عدد ونتائج مجمعة)، المستخدمون، سجل التواصل | تغيير الباقة يدويًا (للعقود المباشرة)، تمديد التجربة، منح كوبون، إعادة المزامنة، "دخول للدعم" بسبب مكتوب |
| **المستخدمون** | كل مستخدمي نبض: المتجر، الدور، آخر دخول، حالة الموافقة التسويقية | تعطيل مستخدم، إعادة إرسال دعوة |
| **الباقات** | الباقات الحالية: السعر، الحدود، المزايا، عدد المشتركين، الإيراد | إنشاء باقة، إصدار جديد لباقة، إخفاء باقة، باقة خاصة لعميل |
| **الكوبونات والعروض** | أكواد الخصم وعروض المؤسسين | إنشاء كود بنسبة، مدة، حد استخدام |
| **الاستهداف** | منشئ شرائح بشروط | معاينة العدد والقائمة، حفظ الشريحة، إرسال حملة بريد داخلية، تصدير (لصلاحيات محددة فقط) |
| **صحة النظام** | المزامنات الفاشلة، التوكنات المنتهية، تأخر الـWebhooks، تكلفة الـAI لكل متجر | إعادة تشغيل Job |
| **الفريق والصلاحيات** | موظفو نبض وأدوارهم | إضافة موظف، تغيير دور |
| **سجل التدقيق** | كل إجراء إداري: من، متى، ماذا، ولماذا | بحث، تصدير |

## 3. الاستهداف (Segments)

### أمثلة شرائح مفيدة تجاريًا
| الشريحة | الشروط | الإجراء المقترح |
|---------|--------|-----------------|
| جاهز للترقية | باقة Starter + طلبات شهرية > 300 + تجربتان مكتملتان | عرض ترقية إلى Growth |
| تجربة مجانية بلا تفعيل | Trial + لم يبدأ أي تجربة + بقي ≤ 5 أيام | رسالة إرشادية + مكالمة 15 دقيقة |
| خطر إلغاء | مدفوع + لا دخول منذ 14 يومًا + لا تجربة نشطة | تواصل من نجاح العملاء |
| سفراء محتملون | تجربتان ناجحتان+ + مشترك منذ 3 أشهر+ | طلب دراسة حالة أو إحالة |
| مرشح للوكالة | 5 متاجر+ بنفس البريد أو النطاق | عرض باقة الوكالات |
| ألغى التثبيت مؤخرًا | uninstalled خلال 30 يومًا | استبيان سبب الإلغاء (مرة واحدة) |

### الحقول المتاحة للشروط
الباقة، حالة الاشتراك، أيام متبقية في التجربة، تاريخ التثبيت، شريحة الطلبات الشهرية، نطاق الإيراد (نطاقات فقط وليس الرقم الدقيق)، الفئة، المدينة، مؤشر الصحة، آخر دخول، عدد التجارب (نشطة/مكتملة/ناجحة)، نسبة الفرص المنفذة، الوكالة، الوسوم، الموافقة التسويقية.

### قواعد الإرسال
- أي رسالة ترويجية تُرسل فقط لمن لديه `marketing_consent = true`. الرسائل التشغيلية (فاتورة، انتهاء تجربة) لا تحتاج موافقة.
- حد أقصى رسالة ترويجية واحدة أسبوعيًا لكل تاجر.
- التصدير إلى CSV متاح لدور `admin` فقط، ويُسجل في التدقيق مع السبب.

## 4. مؤشر صحة المتجر (للإدارة)
```
health = 0.35 × engagement   (أيام الدخول آخر 14 يومًا / 14)
       + 0.30 × loop         (تجربة نشطة أو مكتملة آخر 30 يومًا ؟ 1 : نسبة الفرص التي تم التفاعل معها)
       + 0.20 × data         (المزامنة سليمة + صحة التتبع ≥ 60%)
       + 0.15 × billing      (مدفوع بلا تعثر = 1، تعثر دفع = 0)
🟢 ≥ 0.7   🟡 0.4–0.7   🔴 < 0.4
```

## 5. أدوار فريق نبض (Staff RBAC)

| الدور | يرى | يفعل |
|-------|-----|------|
| `owner` | كل شيء | كل شيء + إدارة الفريق |
| `admin` | كل شيء عدا المفاتيح والأسرار | الباقات، الكوبونات، التصدير، تغيير اشتراك يدوي |
| `growth` | المتاجر (بيانات مجمعة)، الشرائح | إنشاء شرائح وحملات، دون تصدير |
| `support` | ملف المتجر وحالة المزامنة | إعادة مزامنة، تمديد التجربة حتى 7 أيام، دخول للدعم بسبب مكتوب ومدة 30 دقيقة |
| `finance` | الاشتراكات والفواتير والإيراد | تصدير مالي |
| `viewer` | النظرة العامة فقط | — |

**الأمان**: لوحة الإدارة على نطاق منفصل (`admin.nabd…`)، دخول عبر SSO + مصادقة ثنائية إلزامية، قائمة IP مسموحة اختيارية، مهلة جلسة 30 دقيقة، وكل إجراء في `audit_log` مع `reason` إلزامي للإجراءات الحساسة.

## 6. إضافات على قاعدة البيانات

```sql
-- ============ Plans & Entitlements ============
create table features (                       -- قاموس المزايا
  key text primary key,                       -- 'daily_brief_email', 'ga4', 'agency_view', 'ai_chat'
  name_ar text not null, kind text not null check (kind in ('flag','limit'))
);

create table plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                  -- 'starter', 'growth', 'pro', 'agency', 'custom_khobara'
  name_ar text not null, name_en text,
  billing_source text not null check (billing_source in ('salla','direct','free')),
  visibility text not null default 'public' check (visibility in ('public','hidden','private')),
  sort_order int, created_at timestamptz default now(), archived_at timestamptz
);

create table plan_versions (                  -- لا نعدّل باقة يستخدمها مشتركون؛ ننشئ إصدارًا جديدًا
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id),
  version int not null,
  price_monthly numeric(10,2), price_yearly numeric(10,2), currency char(3) default 'SAR',
  salla_plan_id text,                         -- الربط ببوابة سلة
  trial_days int default 14,
  max_monthly_orders int,                     -- null = غير محدود
  effective_from timestamptz not null default now(),
  unique (plan_id, version)
);

create table plan_entitlements (
  plan_version_id uuid references plan_versions(id),
  feature_key text references features(key),
  enabled boolean, limit_value int,           -- مثلًا active_experiments = 5
  primary key (plan_version_id, feature_key)
);

-- subscriptions (وثيقة 03) تُضاف لها:
alter table subscriptions add column plan_version_id uuid references plan_versions(id);
alter table subscriptions add column override_entitlements jsonb;   -- استثناءات لمتجر بعينه
alter table subscriptions add column discount_code text;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null, source text not null, -- salla | direct
  amount numeric(10,2), currency char(3), status text, period_start date, period_end date,
  external_ref text, issued_at timestamptz
);

create table promo_codes (
  code text primary key, percent_off int, months int, max_redemptions int,
  redeemed int default 0, plan_codes text[], expires_at timestamptz, created_by uuid
);

-- ============ Merchant CRM ============
create table merchant_profiles (              -- بيانات علاقتنا بالتاجر (نحن المتحكم)
  store_id uuid primary key references stores(id),
  owner_name text, owner_email citext, owner_phone text,
  marketing_consent boolean not null default false, consent_updated_at timestamptz,
  orders_band text,                           -- '<50','50-300','300-1500','1500-6000','6000+'
  revenue_band text,                          -- نطاقات فقط
  city text, category text,
  health_score numeric(3,2), health_updated_at timestamptz,
  tags text[], owner_staff_id uuid            -- مسؤول الحساب في نبض
);

create table merchant_notes (
  id bigserial primary key, store_id uuid not null, staff_id uuid not null,
  kind text,                                  -- note | call | email | meeting
  body text, created_at timestamptz default now()
);

create table segments (
  id uuid primary key default gen_random_uuid(),
  name text not null, rules jsonb not null,   -- {"all":[{"field":"plan","op":"=","value":"starter"}, ...]}
  created_by uuid, created_at timestamptz default now(), last_count int
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid references segments(id),
  channel text check (channel in ('email','in_app')),
  subject text, body text, status text,       -- draft | scheduled | sent
  sent_count int, opened_count int, converted_count int,
  scheduled_at timestamptz, sent_at timestamptz, created_by uuid
);

-- ============ Staff ============
create table staff_users (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null, name text,
  role text not null check (role in ('owner','admin','growth','support','finance','viewer')),
  mfa_enabled boolean not null default false, active boolean default true,
  last_login_at timestamptz
);

create table support_access_grants (          -- دخول مؤقت لبيانات متجر للدعم
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null, store_id uuid not null,
  reason text not null, expires_at timestamptz not null, created_at timestamptz default now()
);
```

**قاعدة تنفيذ المزايا**: الكود لا يسأل "ما باقة المتجر؟" بل يسأل `can(store, 'ga4')` و`limit(store, 'active_experiments')`. بهذا تُضاف باقة جديدة من لوحة الإدارة دون تعديل الكود.

## 7. Admin API (مختصر)

```
GET    /admin/v1/metrics/overview?from=&to=
GET    /admin/v1/stores?plan=&status=&orders_band=&category=&city=&health=&q=&page=
GET    /admin/v1/stores/:id
PATCH  /admin/v1/stores/:id              # tags, owner_staff_id
POST   /admin/v1/stores/:id/notes
POST   /admin/v1/stores/:id/trial-extension   { days, reason }
POST   /admin/v1/stores/:id/subscription      { plan_version_id, reason }   # direct billing فقط
POST   /admin/v1/stores/:id/resync
POST   /admin/v1/stores/:id/support-access    { reason }  → grant مدته 30 دقيقة

GET    /admin/v1/users?q=&role=&consent=
PATCH  /admin/v1/users/:id               # disable

GET    /admin/v1/plans
POST   /admin/v1/plans
POST   /admin/v1/plans/:id/versions
PATCH  /admin/v1/plans/:id               # visibility, archive
GET    /admin/v1/features

GET    /admin/v1/promo-codes | POST /admin/v1/promo-codes

POST   /admin/v1/segments/preview        { rules } → { count, sample[] }
POST   /admin/v1/segments
POST   /admin/v1/segments/:id/export     { reason }   # admin فقط
POST   /admin/v1/campaigns | POST /admin/v1/campaigns/:id/send

GET    /admin/v1/system/health
GET    /admin/v1/audit?actor=&action=&from=
```

## 8. مكانها في الـRoadmap
- **قبل الإطلاق (أسبوع 11–12)**: نظرة عامة، المتاجر وملف المتجر، الباقات (قراءة + ربط سلة)، سجل التدقيق، الفريق. **هذا الحد الأدنى لتشغيل المنتج.**
- **بعد الإطلاق (أسبوع 13–16)**: منشئ الباقات والإصدارات، الكوبونات، منشئ الشرائح، الحملات البريدية، مؤشر الصحة.
- **لاحقًا**: حملات داخل التطبيق، تكامل CRM خارجي (HubSpot مثلًا)، لوحات مالية متقدمة.
