import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

export async function createApp() {
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = mod.createNestApplication({ rawBody: true });
  configureApp(app);
  await app.init();
  return app;
}

export const prisma = new PrismaClient();

export async function ensurePlans() {
  await prisma.plan.upsert({
    where: { code: 'starter' },
    create: { code: 'starter', nameAr: 'البداية', nameEn: 'Starter', priceMonthly: 19900, priceYearly: 199000, maxProducts: 5, maxStaff: 3, aiCreditsMonthly: 5, features: [] },
    update: {},
  });
}

let n = 0;
export async function registerStore(app: INestApplication, prefix = 'store') {
  n++;
  const slug = `${prefix}-${Date.now().toString(36)}-${n}`;
  const email = `${slug}@test.local`;
  const res = await request(app.getHttpServer()).post('/api/auth/register').send({
    fullName: 'مالكة الاختبار', email, password: 'Password123', storeNameAr: 'متجر اختبار', slug,
  });
  if (res.status !== 201) throw new Error(`register failed ${res.status} ${JSON.stringify(res.body)}`);
  const cookie = res.headers['set-cookie'] as unknown as string[];
  const me = await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${res.body.accessToken}`);
  return { token: res.body.accessToken as string, cookie, email, slug, tenantId: me.body.tenant.id as string };
}

export function api(app: INestApplication, token?: string) {
  const s = request(app.getHttpServer());
  const wrap = (r: request.Test) => (token ? r.set('Authorization', `Bearer ${token}`) : r);
  return {
    get: (u: string) => wrap(s.get(`/api${u}`)),
    post: (u: string, b?: object) => wrap(s.post(`/api${u}`)).send(b ?? {}),
    put: (u: string, b?: object) => wrap(s.put(`/api${u}`)).send(b ?? {}),
    patch: (u: string, b?: object) => wrap(s.patch(`/api${u}`)).send(b ?? {}),
    delete: (u: string) => wrap(s.delete(`/api${u}`)),
  };
}

export function productBody(slug: string, skuPrefix = slug.toUpperCase(), price = 46000) {
  return {
    titleAr: 'عباية كريب سوداء', slug, status: 'ACTIVE', cut: 'CLOSED', fabric: 'CREPE', occasions: ['DAILY'],
    variants: [
      { sku: `${skuPrefix}-M-56`, size: 'M', color: 'أسود', length: '56', price },
      { sku: `${skuPrefix}-L-58`, size: 'L', color: 'أسود', length: '58', price },
    ],
  };
}
