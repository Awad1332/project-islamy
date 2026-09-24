# 04 — خطة التكامل مع سلة

> **مستوى التحقق**: ✅ = مؤكد من توثيق سلة المفهرس · ⚠️ = مرجّح ويجب التحقق بحساب Partner · ❌ = غير متاح حسب ما وجدته

## 1. مصفوفة توفر البيانات (أهم جدول في المشروع)

| البيانات | المصدر | الحالة | تاريخ سابق للتثبيت؟ | ما يعتمد عليها |
|----------|--------|--------|--------------------|----------------|
| الطلبات (الإجمالي، الحالة، الدفع، الكوبون، المدينة) | Merchant API + Webhooks | ✅ | ✅ نعم | الإيراد، AOV، الإلغاء، COD |
| عناصر الطلب | تفاصيل الطلب | ⚠️ هل ضمن القائمة أم طلب لكل طلب؟ | ✅ | Bundles، أداء المنتجات |
| المنتجات (سعر، سعر مخفض، كمية، حالة، صور) | API + Webhooks | ✅ | الحالة الحالية فقط | نفاد المخزون، تغيّر السعر |
| سعر التكلفة `cost_price` | حقل المنتج | ⚠️ موجود لكن غالبًا فارغ | — | الربحية (نطلب هامشًا تقريبيًا بدلًا منه) |
| **تاريخ الأسعار والمخزون** | — | ❌ لا يوجد | ❌ | نبنيه نحن بلقطات يومية من يوم التثبيت |
| العملاء | API (محدود 500/10 دقائق) | ✅ | ✅ | الشرائح، إعادة التنشيط |
| السلات المتروكة | API + Webhook | ✅ | ⚠️ لفترة محدودة غالبًا | فرص الاسترجاع |
| الكوبونات والعروض الخاصة | API (قراءة/كتابة) | ✅ | ✅ | تنفيذ التجارب، تتبع الخصومات |
| الشحنات | API | ✅ | ✅ | مشاكل تشغيلية (لاحقًا) |
| المراجعات/التقييمات | API | ✅ | ✅ | مؤشر لجودة المنتج (لاحقًا) |
| **الزيارات، الجلسات، مشاهدات المنتج، مصادر الزيارات** | — | ❌ لم أجد endpoint لها | ❌ | **التحويل**. البديل: Tracker أو GA4 |
| أحداث الواجهة (مشاهدة، إضافة للسلة، Checkout) | App Snippet + Twilight SDK events | ✅ | ❌ من يوم التثبيت فقط | التحويل لكل منتج، القُمع |
| GA4 (زيارات تاريخية) | Google Analytics Data API (OAuth للتاجر) | ✅ إن كان لدى التاجر GA | ✅ | تاريخ الزيارات + المصادر |
| الإنفاق الإعلاني | Ads APIs | خارج MVP | — | ROAS |
| اشتراك التطبيق | Partners Apps API + Webhooks `app.subscription.*` | ✅ | — | Billing |

### النتيجة العملية
- **يوم 1**: فرص من الطلبات/العملاء/المنتجات (6 Detectors).
- **يوم 14–21**: فرص التحويل من الـTracker (4 Detectors) — بشرط حجم زيارات كافٍ.
- **فوري للتحويل**: فقط إن ربط التاجر GA4 وكان تتبع المنتجات فيه سليمًا (ليس مضمونًا).
- **يجب أن نقول ذلك للتاجر في الـOnboarding** بدل أن يبحث عن "معدل التحويل" ويجده فارغًا.

## 2. نوع التطبيق والمصادقة

- **Public App** في متجر تطبيقات سلة (قناة التوزيع الأساسية)، + **Private App** للمتاجر التجريبية في مرحلة التصميم.
- **OAuth Easy Mode** (موصى به من سلة): عند التثبيت ترسل سلة Webhook `app.store.authorize` يحتوي على التوكنات → لا شاشة Callback معقدة.
- ✅ **Refresh token صالح لمدة شهر، وأحادي الاستخدام**. استخدامه مرتين = إبطال الوصول → التاجر يعيد التثبيت. التصميم:
  1. Job كل ساعة يحدّث التوكنات التي تنتهي خلال 48 ساعة.
  2. قفل موزع (Redis `SET NX` + `refresh_lock_version` في DB) — عملية تحديث واحدة فقط لكل متجر.
  3. حفظ التوكن الجديد في Transaction **قبل** أي استخدام.
  4. إذا فشل التحديث بـ `invalid_grant` → حالة `reauth_required` + بريد للتاجر + لافتة في التطبيق.
- الحصول على بيانات المستخدم/المتجر من `/oauth2/user/info` لإنشاء الحساب تلقائيًا (لا تسجيل منفصل).

## 3. الـWebhooks المطلوبة

| الحدث | الاستخدام |
|-------|----------|
| `app.store.authorize`, `app.installed`, `app.uninstalled`, `app.updated` | دورة حياة التطبيق |
| `app.trial.started/expired`, `app.subscription.started/renewed/expired/canceled` | Billing (⚠️ أسماء الأحداث بالتحديد يجب مطابقتها مع التوثيق) |
| `order.created`, `order.updated`, `order.status.updated`, `order.cancelled`, `order.refunded` | الطلبات |
| `product.created`, `product.updated`, `product.deleted`, `product.quantity.low` | المنتجات + **Memory تلقائي** (تغيّر السعر/الحالة) |
| `customer.created`, `customer.updated` | العملاء |
| `abandoned.cart` | السلات |
| `coupon.applied` | تتبع الكوبونات (خصوصًا كوبونات التجارب) |

**مبادئ المعالجة**:
- الرد 200 فورًا، المعالجة Async.
- Idempotency بـ `(event, external_id, hash)`.
- **لا نثق أن الـWebhooks كاملة**: مصالحة ليلية تجلب الطلبات المحدثة آخر 72 ساعة وتقارنها.
- ترتيب الأحداث غير مضمون: نعتمد `updated_at` من المصدر، ولا نكتب نسخة أقدم فوق أحدث.

## 4. خطة الـBackfill

```
عند app.store.authorize:
  1. stores + store_connections + subscription(trial)
  2. Queue (بالأولوية):
     a. products (كل الصفحات)               → snapshot أول
     b. orders آخر 90 يومًا (+ items)         → metrics → detectors → أول فرص ✨
     c. customers (مع احترام 500/10 دقائق)
     d. abandoned carts, coupons
     e. orders من 90 يومًا إلى 12 شهرًا      → إعادة حساب Baselines والموسمية
  3. تثبيت App Snippet (الـTracker)
  4. إشعار: "جاهز" + أول فرصة
```

- كل Job يحفظ `cursor` ويستأنف بعد الانقطاع.
- Token bucket لكل متجر مضبوط على حد خطته (قراءة ترويسات Rate limit من الاستجابة والتكيف معها، وBackoff عند 429).
- شاشة تقدم للتاجر: "استوردنا 4,120 من 11,800 طلب".

## 5. الـTracker (App Snippet)

- سكربت صغير (< 5KB gzip) يُحقن عبر App Snippet، يستمع لأحداث Twilight SDK (مشاهدة منتج، إضافة للسلة، بدء الدفع) ويرسلها Batch إلى `/t/e` عبر `navigator.sendBeacon`.
- لا Cookies طرف ثالث؛ Session ID في `sessionStorage`.
- **مخاطر يجب اختبارها**: ثيمات قديمة/مخصصة قد لا تطلق كل الأحداث؛ مانعات الإعلانات؛ المتاجر التي تستخدم تطبيق جوال (لا يعمل فيه الـSnippet). لذلك: **مؤشر "صحة التتبع"** يقارن `checkout_start` المتتبعة بالطلبات الفعلية. إن كانت التغطية < 60% → لا نعرض فرص التحويل لهذا المتجر ونخبره بالسبب.

## 6. الكتابة إلى سلة (تنفيذ الإجراءات)

في MVP، الكتابة **اختيارية ومحدودة**:
- إنشاء كوبون للتجربة (مرتبط بـ `experiment_id` لتتبع الاستخدام بدقة).
- (لاحقًا) إنشاء عرض خاص/Bundle عبر Special Offers API.
- **لا** نعدّل أسعار أو أوصاف منتجات تلقائيًا في MVP (خطر عالٍ، وثقة منخفضة في البداية).

## 7. الفوترة عبر سلة

- التطبيقات المدفوعة في سلة تُفوتر عبر سلة (Built-in billing & payouts)، مع دعم Add-ons.
- ⚠️ **يجب التحقق**: نسبة عمولة سلة، هل يُسمح بالتسعير المتدرج حسب حجم الطلبات، وهل يمكن فوترة الوكالات خارج سلة (عقود مباشرة).
- خطة: الاشتراكات الفردية عبر سلة؛ عقود الوكالات مباشرة (فاتورة شهرية).

## 8. قائمة التحقق قبل البناء (أسبوع 1)

- [ ] حساب Salla Partners + متجر تجريبي بخطة حقيقية
- [ ] تأكيد: هل يوجد أي endpoint للتقارير/الزيارات؟
- [ ] تأكيد: هل `GET /orders` يعيد items؟ حد `per_page`؟ فلترة بالتاريخ و`updated_at`؟
- [ ] تأكيد: مدة احتفاظ السلات المتروكة في الـAPI
- [ ] تأكيد: قائمة أحداث Twilight المتاحة للـSnippet وتغطيتها في الثيمات الشائعة
- [ ] تأكيد: أحداث الاشتراك وعمولة المتجر وسياسة المراجعة (مدة مراجعة التطبيق قبل النشر)
- [ ] قراءة سياسة سلة لاستخدام بيانات التجار في Benchmarks مجمعة

## المصادر
- [Salla Docs — Get Started](https://docs.salla.dev/421117m0)
- [Salla Docs — Rate Limiting](https://docs.salla.dev/421125m0)
- [Salla Docs — Authorization](https://docs.salla.dev/421118m0)
- [Salla Docs — Webhooks](https://docs.salla.dev/421119m0)
- [Salla Docs — List Abandoned Carts](https://docs.salla.dev/5394138e0)
- [Salla Docs — Device Mode (App Snippet tracker)](https://docs.salla.dev/1724504m0)
- [Salla Docs — Twilight JS SDK Events](https://docs.salla.dev/422611m0)
- [Salla Docs — Handling Add-On Subscriptions](https://docs.salla.dev/2213496m0)
- [Salla Developers — Apps Add-Ons Pricing](https://salla.dev/blog/apps-add-ons-pricing/)
- [SallaApp/oauth2-merchant (GitHub)](https://github.com/SallaApp/oauth2-merchant)
- [مركز مساعدة سلة — ربط Google Analytics](https://help.salla.sa/article/%D8%A7%D9%84%D8%B1%D8%A8%D8%B7-%D9%85%D8%B9-google-analytics/u6l7x3qvtvkykkvcwqtr1jol)
