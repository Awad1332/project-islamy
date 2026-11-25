import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { api, createApp, ensurePlans, prisma, productBody, registerStore } from './helpers';
import { decodeTlv } from '../src/modules/orders/zatca';

let app: INestApplication;

beforeAll(async () => {
  await ensurePlans();
  app = await createApp();
});
afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('auth', () => {
  it('registers a store with owner, trial subscription and default location', async () => {
    const s = await registerStore(app);
    const me = await api(app, s.token).get('/auth/me').expect(200);
    expect(me.body.role).toBe('OWNER');
    expect(me.body.tenant.currency).toBe('SAR');
    expect(me.body.tenant.timezone).toBe('Asia/Riyadh');
    expect(me.body.tenant.vatRateBps).toBe(1500);
    const sub = await prisma.subscription.findUnique({ where: { tenantId: s.tenantId } });
    expect(sub?.status).toBe('TRIALING');
    expect(await prisma.location.count({ where: { tenantId: s.tenantId, isDefault: true } })).toBe(1);
  });

  it('rejects weak passwords and duplicate emails', async () => {
    const s = await registerStore(app);
    await api(app).post('/auth/register', { fullName: 'x y', email: 'weak@test.local', password: 'short', storeNameAr: 'متجر', slug: 'weak-store' }).expect(422);
    const dup = await api(app).post('/auth/register', { fullName: 'x y', email: s.email, password: 'Password123', storeNameAr: 'متجر', slug: 'another-slug-1' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects bad credentials and missing tokens', async () => {
    const s = await registerStore(app);
    const r = await api(app).post('/auth/login', { email: s.email, password: 'WrongPass123' });
    expect(r.status).toBe(401);
    await api(app).get('/products').expect(401);
    await api(app, 'garbage').get('/products').expect(401);
  });

  it('rotates refresh tokens and revokes the family on reuse', async () => {
    const s = await registerStore(app);
    const login = await api(app).post('/auth/login', { email: s.email, password: 'Password123' }).expect(200);
    const cookie = (login.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
    const r1 = await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', cookie).send({}).expect(200);
    expect(r1.body.accessToken).toBeTruthy();
    const reuse = await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', cookie).send({});
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('REFRESH_REUSED');
    const newCookie = (r1.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
    await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', newCookie).send({}).expect(401);
  });
});

describe('tenant isolation', () => {
  it('never exposes another tenant’s data', async () => {
    const a = await registerStore(app, 'iso-a');
    const b = await registerStore(app, 'iso-b');
    const p = await api(app, a.token).post('/products', productBody('iso-abaya', 'ISOA')).expect(201);
    await api(app, b.token).get(`/products/${p.body.id}`).expect(404);
    await api(app, b.token).put(`/products/${p.body.id}`, productBody('iso-abaya', 'ISOB')).expect(404);
    await api(app, b.token).delete(`/products/${p.body.id}`).expect(404);
    const list = await api(app, b.token).get('/products').expect(200);
    expect(list.body.items.find((x: { id: string }) => x.id === p.body.id)).toBeUndefined();
    // Using a foreign variant in an order is rejected.
    await api(app, b.token).post('/orders', { items: [{ variantId: p.body.variants[0].id, quantity: 1 }] }).expect(404);
    // Same slug/SKU allowed across tenants.
    await api(app, b.token).post('/products', productBody('iso-abaya', 'ISOA')).expect(201);
  });
});

describe('RBAC & team', () => {
  it('invited staff gets limited permissions and cannot escalate', async () => {
    const owner = await registerStore(app, 'rbac');
    const inv = await api(app, owner.token).post('/team/invitations', { email: `staff-${owner.slug}@test.local`, role: 'STAFF' }).expect(201);
    const token = new URL(inv.body.inviteUrl).searchParams.get('token');
    const acc = await api(app).post('/auth/accept-invite', { token, fullName: 'موظفة', password: 'Password123' }).expect(201);
    const staff = api(app, acc.body.accessToken);
    await staff.get('/products').expect(200);
    await staff.get('/settings').expect(200);
    const denied = await staff.put('/settings', {});
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('PERMISSION_DENIED');
    await staff.post('/team/invitations', { email: 'x@test.local', role: 'ADMIN' }).expect(403);
    await staff.get('/analytics/overview').expect(403);
    await api(app, owner.token).post('/team/invitations', { email: 'o@test.local', role: 'OWNER' }).expect(422);
  });
});

describe('catalog', () => {
  it('validates abaya variants and enforces plan limits', async () => {
    const s = await registerStore(app, 'cat');
    const bad = productBody('dup-sku', 'DUP');
    bad.variants[1].sku = bad.variants[0].sku;
    const r = await api(app, s.token).post('/products', bad);
    expect(r.status).toBe(422);
    expect(JSON.stringify(r.body.error.details)).toContain('duplicate_sku');
    for (let i = 0; i < 5; i++) await api(app, s.token).post('/products', productBody(`lim-${i}`, `LIM${i}`)).expect(201);
    const over = await api(app, s.token).post('/products', productBody('lim-over', 'LIMX'));
    expect(over.status).toBe(402);
    expect(over.body.error.code).toBe('PLAN_LIMIT_PRODUCTS');
  });
});

async function setupStock(token: string, slug: string, qty = 5) {
  const p = await api(app, token).post('/products', productBody(slug)).expect(201);
  const locs = await api(app, token).get('/locations').expect(200);
  const loc = locs.body[0].id;
  for (const v of p.body.variants) await api(app, token).post('/inventory/adjust', { variantId: v.id, locationId: loc, type: 'RECEIPT', quantity: qty }).expect(201);
  return { product: p.body, locationId: loc as string, variantId: p.body.variants.find((v: { size: string }) => v.size === 'M').id as string };
}

describe('orders & inventory', () => {
  it('creates VAT-inclusive orders, decrements stock, blocks overselling and restocks on cancel', async () => {
    const s = await registerStore(app, 'ord');
    await api(app, s.token).put('/settings', {
      nameAr: 'متجر', vatEnabled: true, vatRateBps: 1500, pricesIncludeVat: true, defaultLocale: 'ar', lowStockThreshold: 1, defaultShippingFee: 2300, vatNumber: '300000000000003',
    }).expect(200);
    const { variantId } = await setupStock(s.token, 'ord-abaya', 3);
    const cust = await api(app, s.token).post('/customers', { fullName: 'نورة', phone: '0551234567' }).expect(201);
    expect(cust.body.phone).toBe('+966551234567');
    const o = await api(app, s.token).post('/orders', { customerId: cust.body.id, items: [{ variantId, quantity: 2 }], paymentMethod: 'MADA' }).expect(201);
    expect(o.body.number).toBe('1001');
    expect(o.body.total).toBe(46000 * 2 + 2300);
    expect(o.body.vatTotal).toBe(Math.round((92000 * 1500) / 11500) + Math.round((2300 * 1500) / 11500));
    const inv = await api(app, s.token).get('/inventory?q=ORD-ABAYA-M').expect(200);
    expect(inv.body.items[0].onHand).toBe(1);

    const over = await api(app, s.token).post('/orders', { items: [{ variantId, quantity: 2 }] });
    expect(over.status).toBe(409);
    expect(over.body.error.code).toBe('INSUFFICIENT_STOCK');

    await api(app, s.token).patch(`/orders/${o.body.id}/status`, { status: 'DELIVERED' }).expect(409);
    await api(app, s.token).post(`/orders/${o.body.id}/payments`, { amount: 999999, method: 'MADA' }).expect(400);
    await api(app, s.token).patch(`/orders/${o.body.id}/status`, { status: 'CANCELLED' }).expect(200);
    const after = await api(app, s.token).get('/inventory?q=ORD-ABAYA-M').expect(200);
    expect(after.body.items[0].onHand).toBe(3);
    const c = await api(app, s.token).get(`/customers/${cust.body.id}`).expect(200);
    expect(c.body.ordersCount).toBe(0);

    const invoice = await api(app, s.token).get(`/orders/${o.body.id}/invoice`).expect(200);
    const tlv = decodeTlv(invoice.body.zatcaQrBase64);
    expect(tlv[2]).toBe('300000000000003');
    expect(tlv[4]).toBe((o.body.total / 100).toFixed(2));
  });

  it('serialises concurrent orders without overselling', async () => {
    const s = await registerStore(app, 'race');
    const { variantId } = await setupStock(s.token, 'race-abaya', 3);
    const results = await Promise.all(Array.from({ length: 6 }, () => api(app, s.token).post('/orders', { items: [{ variantId, quantity: 1 }] })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    expect(results.filter((r) => r.status === 409)).toHaveLength(3);
    const lvl = await prisma.inventoryLevel.findFirst({ where: { variantId } });
    expect(lvl?.onHand).toBe(0);
  });
});

describe('returns & exchanges', () => {
  it('runs a return with restock + refund and an exchange producing a replacement order', async () => {
    const s = await registerStore(app, 'ret');
    const { product, variantId } = await setupStock(s.token, 'ret-abaya', 5);
    const o = await api(app, s.token).post('/orders', { items: [{ variantId, quantity: 2 }], shippingFee: 0 }).expect(201);
    await api(app, s.token).post('/returns', { orderId: o.body.id, type: 'RETURN', reason: 'SIZE_TOO_SMALL', items: [{ orderItemId: o.body.items[0].id, quantity: 1 }] }).expect(409);
    await api(app, s.token).post(`/orders/${o.body.id}/payments`, { amount: o.body.total, method: 'APPLE_PAY' }).expect(201);
    for (const st of ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']) await api(app, s.token).patch(`/orders/${o.body.id}/status`, { status: st }).expect(200);

    const r = await api(app, s.token).post('/returns', { orderId: o.body.id, type: 'RETURN', reason: 'SIZE_TOO_SMALL', items: [{ orderItemId: o.body.items[0].id, quantity: 1 }] }).expect(201);
    expect(r.body.number).toBe('R-101');
    await api(app, s.token).post('/returns', { orderId: o.body.id, type: 'RETURN', reason: 'OTHER', items: [{ orderItemId: o.body.items[0].id, quantity: 2 }] }).expect(400);
    await api(app, s.token).post(`/returns/${r.body.id}/transition`, { action: 'COMPLETE' }).expect(409);
    await api(app, s.token).post(`/returns/${r.body.id}/transition`, { action: 'APPROVE' }).expect(201);
    await api(app, s.token).post(`/returns/${r.body.id}/transition`, { action: 'RECEIVE', restock: true }).expect(201);
    const done = await api(app, s.token).post(`/returns/${r.body.id}/transition`, { action: 'COMPLETE' }).expect(201);
    expect(done.body.refundAmount).toBe(46000);
    const order = await api(app, s.token).get(`/orders/${o.body.id}`).expect(200);
    expect(order.body.paymentStatus).toBe('PARTIALLY_REFUNDED');
    expect((await prisma.inventoryLevel.findFirst({ where: { variantId } }))?.onHand).toBe(4);

    const otherVariant = product.variants.find((v: { size: string }) => v.size === 'L').id;
    const ex = await api(app, s.token).post('/returns', { orderId: o.body.id, type: 'EXCHANGE', reason: 'SIZE_TOO_SMALL', items: [{ orderItemId: o.body.items[0].id, quantity: 1, exchangeVariantId: otherVariant }] }).expect(201);
    for (const action of ['APPROVE', 'RECEIVE', 'COMPLETE']) await api(app, s.token).post(`/returns/${ex.body.id}/transition`, { action }).expect(201);
    const exDone = await api(app, s.token).get(`/returns/${ex.body.id}`).expect(200);
    const repl = await api(app, s.token).get(`/orders/${exDone.body.replacementOrderId}`).expect(200);
    expect(repl.body.total).toBe(0);
    expect(repl.body.paymentStatus).toBe('PAID');
    expect((await prisma.inventoryLevel.findFirst({ where: { variantId: otherVariant } }))?.onHand).toBe(4);
  });
});

describe('sizing', () => {
  it('recommends size and length from merchant chart and customer measurements', async () => {
    const s = await registerStore(app, 'size');
    const chart = await api(app, s.token).post('/size-charts', {
      name: 'أساسي', isDefault: true, weights: { bust: 3, hips: 2 },
      rows: [{ label: 'M', ranges: { bust: { min: 88, max: 96 }, hips: { min: 96, max: 104 } } }, { label: 'L', ranges: { bust: { min: 97, max: 104 }, hips: { min: 105, max: 112 } } }],
      lengthRows: [{ label: '54', heightMin: 150, heightMax: 157 }, { label: '56', heightMin: 158, heightMax: 164 }], heelAllowanceCm: 4,
    }).expect(201);
    const rec = await api(app, s.token).post('/size-charts/recommend', { sizeChartId: chart.body.id, measurements: { height: 160, bust: 99, hips: 108, fitPreference: 'REGULAR', wearsHeels: false } }).expect(200);
    expect(rec.body.size).toBe('L');
    expect(rec.body.length).toBe('56');
    expect(await prisma.sizeRecommendation.count({ where: { tenantId: s.tenantId } })).toBe(1);
  });
});

describe('integrations honesty', () => {
  it('never reports unverified services as connected and refuses dependent features', async () => {
    const s = await registerStore(app, 'int');
    const list = await api(app, s.token).get('/integrations').expect(200);
    expect(list.body.every((i: { connected: boolean }) => i.connected === false)).toBe(true);
    await api(app, s.token).put('/integrations', { provider: 'ZID', credentials: { authorizationToken: 'x', managerToken: 'y' } }).expect(200);
    const v = await api(app, s.token).post('/integrations/ZID/verify').expect(200);
    expect(v.body.verified).toBe(false);
    expect(v.body.reason).toBe('VERIFICATION_NOT_IMPLEMENTED');
    const stored = await prisma.integration.findFirst({ where: { tenantId: s.tenantId, provider: 'ZID' } });
    expect(stored?.credentialsEnc).not.toContain('managerToken');
    const after = await api(app, s.token).get('/integrations').expect(200);
    const zid = after.body.find((i: { provider: string }) => i.provider === 'ZID');
    expect(zid.connected).toBe(false);
    expect(zid.maskedCredentials.managerToken).not.toBe('y');

    const ai = await api(app, s.token).post('/ai/content/generate', { type: 'PRODUCT_DESCRIPTION' });
    expect(ai.status).toBe(503);
    expect(ai.body.error.code).toBe('INTEGRATION_NOT_CONNECTED');
    const up = await api(app, s.token).post('/media');
    expect(up.status).toBe(400);

    const seg = await api(app, s.token).post('/marketing/segments', { name: 'الكل', rules: {} }).expect(201);
    const camp = await api(app, s.token).post('/marketing/campaigns', { name: 'حملة', channel: 'WHATSAPP', segmentId: seg.body.id, bodyAr: 'مرحبا {{name}}' }).expect(201);
    const launch = await api(app, s.token).post(`/marketing/campaigns/${camp.body.id}/launch`, {});
    expect(launch.status).toBe(503);

    const ch = await api(app, s.token).post('/inbox/channels', { type: 'WHATSAPP', name: 'واتساب' }).expect(201);
    const conv = await api(app, s.token).post('/inbox/conversations', { channelId: ch.body.id, contactHandle: '+966551112222' }).expect(201);
    const msg = await api(app, s.token).post(`/inbox/conversations/${conv.body.id}/messages`, { body: 'أهلاً', kind: 'REPLY' }).expect(201);
    expect(msg.body.status).toBe('NOT_SENT');
    expect(msg.body.error).toBe('CHANNEL_NOT_CONNECTED');
  });
});

describe('public API', () => {
  it('authenticates with scoped API keys', async () => {
    const s = await registerStore(app, 'pub');
    await api(app, s.token).post('/products', productBody('pub-abaya')).expect(201);
    const k = await api(app, s.token).post('/developer/api-keys', { name: 'ERP', scopes: ['products:read'] }).expect(201);
    const pub = request(app.getHttpServer());
    const r = await pub.get('/api/public/v1/products').set('x-api-key', k.body.key).expect(200);
    expect(r.body.items).toHaveLength(1);
    await pub.get('/api/public/v1/orders').set('x-api-key', k.body.key).expect(403);
    await pub.get('/api/public/v1/products').set('x-api-key', 'ak_live_wrong').expect(401);
    await api(app, s.token).delete(`/developer/api-keys/${k.body.id}`).expect(200);
    await pub.get('/api/public/v1/products').set('x-api-key', k.body.key).expect(401);
  });
});

describe('analytics', () => {
  it('reports revenue in halalas bucketed by Riyadh day', async () => {
    const s = await registerStore(app, 'ana');
    const { variantId } = await setupStock(s.token, 'ana-abaya', 5);
    await api(app, s.token).post('/orders', { items: [{ variantId, quantity: 1 }], shippingFee: 0 }).expect(201);
    const r = await api(app, s.token).get('/analytics/overview').expect(200);
    expect(r.body.kpis.revenue).toBe(46000);
    expect(r.body.kpis.orders).toBe(1);
    expect(r.body.range.timezone).toBe('Asia/Riyadh');
    expect(r.body.series.reduce((a: number, d: { revenue: number }) => a + d.revenue, 0)).toBe(46000);
    expect(r.body.sizes[0]).toMatchObject({ size: 'M', length: '56', units: 1 });
  });
});
