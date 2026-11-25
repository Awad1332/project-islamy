/* eslint-disable no-console */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLANS = [
  { code: 'starter', nameAr: 'البداية', nameEn: 'Starter', priceMonthly: 19900, priceYearly: 199000, maxProducts: 100, maxStaff: 3, aiCreditsMonthly: 50, features: ['catalog', 'orders', 'inventory', 'crm', 'sizing', 'returns'] },
  { code: 'growth', nameAr: 'النمو', nameEn: 'Growth', priceMonthly: 49900, priceYearly: 499000, maxProducts: 1000, maxStaff: 10, aiCreditsMonthly: 500, features: ['catalog', 'orders', 'inventory', 'crm', 'sizing', 'returns', 'marketing', 'inbox', 'api'] },
  { code: 'couture', nameAr: 'كوتور', nameEn: 'Couture', priceMonthly: 129900, priceYearly: 1299000, maxProducts: 10000, maxStaff: 50, aiCreditsMonthly: 3000, features: ['all', 'priority_support', 'multi_location'] },
];

async function seedPlans() {
  for (const p of PLANS) await prisma.plan.upsert({ where: { code: p.code }, create: p, update: p });
  console.log(`✓ ${PLANS.length} plans`);
}

async function seedPlatformAdmin() {
  const email = (process.env.PLATFORM_ADMIN_EMAIL ?? '').toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD ?? '';
  if (!email || password.length < 10) {
    console.log('• PLATFORM_ADMIN_EMAIL/PASSWORD not set — skipping platform admin');
    return;
  }
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, fullName: 'Platform Admin', passwordHash: await bcrypt.hash(password, 12), isPlatformAdmin: true },
    update: { isPlatformAdmin: true },
  });
  const tenant = await prisma.tenant.upsert({ where: { slug: 'abaya-os-hq' }, create: { slug: 'abaya-os-hq', nameAr: 'إدارة المنصة', nameEn: 'Platform HQ' }, update: {} });
  await prisma.membership.upsert({ where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } }, create: { tenantId: tenant.id, userId: user.id, role: 'OWNER' }, update: {} });
  console.log(`✓ platform admin ${email}`);
}

async function seedDemo() {
  if (process.env.SEED_DEMO !== 'true') {
    console.log('• SEED_DEMO != true — no demo store created');
    return;
  }
  if (await prisma.tenant.findUnique({ where: { slug: 'demo' } })) {
    console.log('• demo store already exists');
    return;
  }
  // Lazy imports so plain seeding doesn't need the full app.
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../src/app.module');
  const { OrdersService } = await import('../src/modules/orders/orders.service');
  const { InventoryService } = await import('../src/modules/inventory/inventory.service');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const orders = app.get(OrdersService);
  const inventory = app.get(InventoryService);

  const plan = await prisma.plan.findUniqueOrThrow({ where: { code: 'growth' } });
  const now = new Date();
  const owner = await prisma.user.create({ data: { email: 'demo@abaya-os.local', fullName: 'مالكة المتجر التجريبي', passwordHash: await bcrypt.hash('Demo-Store-2026', 12) } });
  const t = await prisma.tenant.create({
    data: {
      slug: 'demo', isDemo: true, nameAr: 'دار ليان للعبايات (تجريبي)', nameEn: 'Dar Layan Abayas (Demo)', contactPhone: '+966500000000', addressCity: 'الرياض',
      vatEnabled: true, vatRateBps: 1500, pricesIncludeVat: true, defaultShippingFee: 2500, freeShippingThreshold: 50000,
    },
  });
  await prisma.membership.create({ data: { tenantId: t.id, userId: owner.id, role: 'OWNER' } });
  await prisma.subscription.create({ data: { tenantId: t.id, planId: plan.id, status: 'TRIALING', trialEndsAt: new Date(now.getTime() + 14 * 86400_000), currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime() + 14 * 86400_000) } });
  const riyadh = await prisma.location.create({ data: { tenantId: t.id, name: 'المستودع الرئيسي - الرياض', city: 'الرياض', isDefault: true } });
  await prisma.location.create({ data: { tenantId: t.id, name: 'بوتيك جدة', city: 'جدة' } });

  const daily = await prisma.category.create({ data: { tenantId: t.id, nameAr: 'عبايات يومية', nameEn: 'Everyday', slug: 'everyday', sortOrder: 1 } });
  const evening = await prisma.category.create({ data: { tenantId: t.id, nameAr: 'عبايات المناسبات', nameEn: 'Occasion', slug: 'occasion', sortOrder: 2 } });

  const chart = await prisma.sizeChart.create({
    data: {
      tenantId: t.id, name: 'الجدول الأساسي', isDefault: true, heelAllowanceCm: 5,
      weights: { bust: 3, shoulder: 2, hips: 2 },
      rows: [
        { label: 'S', ranges: { bust: { min: 80, max: 88 }, shoulder: { min: 35, max: 38 }, hips: { min: 86, max: 95 } } },
        { label: 'M', ranges: { bust: { min: 89, max: 96 }, shoulder: { min: 38.5, max: 40 }, hips: { min: 96, max: 104 } } },
        { label: 'L', ranges: { bust: { min: 97, max: 105 }, shoulder: { min: 40.5, max: 42 }, hips: { min: 105, max: 113 } } },
        { label: 'XL', ranges: { bust: { min: 106, max: 116 }, shoulder: { min: 42.5, max: 45 }, hips: { min: 114, max: 124 } } },
      ],
      lengthRows: [
        { label: '52', heightMin: 145, heightMax: 151 }, { label: '54', heightMin: 152, heightMax: 157 },
        { label: '56', heightMin: 158, heightMax: 163 }, { label: '58', heightMin: 164, heightMax: 169 },
        { label: '60', heightMin: 170, heightMax: 176 },
      ],
    },
  });

  const mk = async (slug: string, titleAr: string, titleEn: string, catId: string, cut: string, fabric: string, price: number, colors: [string, string][], occasions: string[]) => {
    const sizes = ['S', 'M', 'L', 'XL'];
    const lengths = ['54', '56', '58'];
    const variants = colors.flatMap(([c, hex], ci) => sizes.flatMap((s) => lengths.map((l) => ({
      tenantId: t.id, sku: `${slug.toUpperCase().slice(0, 6)}-${ci}${s}-${l}`, size: s, color: c, colorHex: hex, length: l, price, costPrice: Math.round(price * 0.4),
    }))));
    const p = await prisma.product.create({
      data: {
        tenantId: t.id, slug, titleAr, titleEn, status: 'ACTIVE', categoryId: catId, sizeChartId: chart.id, cut, fabric, sleeveType: 'WIDE',
        closure: 'SNAPS', embellishment: 'NONE', opacity: 'OPAQUE', occasions, includesShayla: true, tags: ['demo'],
        descriptionAr: 'منتج تجريبي لأغراض العرض فقط.', variants: { create: variants },
      },
      include: { variants: true },
    });
    await prisma.$transaction(async (tx) => {
      for (const v of p.variants) await inventory.move(tx, { tenantId: t.id, variantId: v.id, locationId: riyadh.id, delta: 6, type: 'RECEIPT', note: 'demo seed' });
    }, { timeout: 60000 });
    return p;
  };
  const p1 = await mk('nida-classic', 'عباية نيدا كلاسيك', 'Classic Nida Abaya', daily.id, 'CLOSED', 'NIDA', 34500, [['أسود', '#111111'], ['كحلي', '#1f2a44']], ['DAILY', 'WORK']);
  const p2 = await mk('crepe-kimono', 'عباية كريب كيمونو', 'Crepe Kimono Abaya', daily.id, 'KIMONO', 'CREPE', 42000, [['بيج', '#d8c3a5'], ['رمادي فحمي', '#3b3b3b']], ['DAILY', 'TRAVEL']);
  const p3 = await mk('eid-embroidered', 'عباية العيد المطرزة', 'Embroidered Eid Abaya', evening.id, 'OPEN_FRONT', 'CHIFFON', 89000, [['أسود ذهبي', '#1a1a1a']], ['EID', 'EVENING', 'WEDDING']);

  const cities = ['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'المدينة المنورة', 'الخبر'];
  const names = ['نورة العتيبي', 'سارة القحطاني', 'ريم الشهري', 'هيا الدوسري', 'لمى الغامدي', 'جود الحربي', 'منيرة الزهراني', 'العنود المطيري'];
  const customers = [];
  for (let i = 0; i < names.length; i++) {
    customers.push(await prisma.customer.create({
      data: { tenantId: t.id, fullName: names[i], phone: `+9665${String(10000000 + i * 1234567).slice(0, 8)}`, city: cities[i % cities.length], acceptsMarketing: i % 2 === 0, tags: i < 3 ? ['vip', 'demo'] : ['demo'] },
    }));
  }
  await prisma.customerMeasurement.create({ data: { tenantId: t.id, customerId: customers[0].id, height: 162, bust: 92, waist: 76, hips: 100, shoulder: 39, armLength: 58, fitPreference: 'REGULAR' } });

  const pickVariant = (p: typeof p1, i: number) => p.variants[(i * 7) % p.variants.length];
  const statuses = ['DELIVERED', 'DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED', 'PENDING'] as const;
  for (let i = 0; i < 14; i++) {
    const c = customers[i % customers.length];
    const prod = [p1, p2, p3][i % 3];
    const order = await prisma.$transaction((tx) => orders.createInTx(tx, t.id, owner.id, {
      customerId: c.id, channel: (['ONLINE_STORE', 'INSTAGRAM', 'WHATSAPP', 'BOUTIQUE'] as const)[i % 4], paymentMethod: (['MADA', 'APPLE_PAY', 'TABBY', 'STC_PAY'] as const)[i % 4],
      items: [{ variantId: pickVariant(prod, i).id, quantity: 1 + (i % 2) }], discount: 0, shippingCity: c.city, shippingName: c.fullName,
    } as never, { source: 'demo seed' }), { timeout: 30000 });
    const status = statuses[i % statuses.length];
    const placedAt = new Date(now.getTime() - (i * 2 + 1) * 86400_000);
    await prisma.order.update({ where: { id: order.id }, data: { status, placedAt, ...(status !== 'PENDING' ? { paymentStatus: 'PAID', amountPaid: order.total } : {}) } });
    if (status !== 'PENDING') await prisma.payment.create({ data: { tenantId: t.id, orderId: order.id, amount: order.total, method: 'MADA', provider: 'MANUAL', reference: 'demo' } });
  }
  await app.close();
  console.log('✓ demo store "demo" — login demo@abaya-os.local / Demo-Store-2026 (clearly flagged isDemo=true)');
}

async function main() {
  await seedPlans();
  await seedPlatformAdmin();
  await seedDemo();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
