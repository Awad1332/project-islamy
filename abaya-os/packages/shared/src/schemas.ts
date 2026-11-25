import { z } from 'zod';
import * as E from './enums';

const money = z.number().int().min(0).max(1_000_000_00); // halalas, ≤ 1M SAR
const id = z.string().min(1).max(64);
const optText = (max = 500) => z.string().trim().max(max).optional().nullable();
const saPhone = z
  .string()
  .trim()
  .regex(/^\+?9665\d{8}$|^05\d{8}$/, 'invalid_saudi_mobile')
  .transform((v) => (v.startsWith('05') ? `+966${v.slice(1)}` : v.startsWith('+') ? v : `+${v}`));

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
});
export type Pagination = z.infer<typeof paginationSchema>;

// ---------- Auth ----------
export const passwordSchema = z.string().min(10, 'password_too_short').max(128)
  .regex(/[A-Za-z]/, 'password_needs_letter').regex(/\d/, 'password_needs_digit');
export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  storeNameAr: z.string().trim().min(2).max(100),
  storeNameEn: z.string().trim().max(100).optional(),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/, 'invalid_slug'),
  locale: z.enum(['ar', 'en']).default('ar'),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
  tenantSlug: z.string().trim().toLowerCase().optional(),
});
export const acceptInviteSchema = z.object({
  token: z.string().min(20).max(200),
  fullName: z.string().trim().min(2).max(100),
  password: passwordSchema,
});
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });

// ---------- Tenant settings ----------
export const tenantSettingsSchema = z.object({
  nameAr: z.string().trim().min(2).max(100),
  nameEn: optText(100),
  logoUrl: z.string().url().max(500).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: saPhone.optional().nullable(),
  vatEnabled: z.boolean(),
  vatRateBps: z.number().int().min(0).max(10000),
  pricesIncludeVat: z.boolean(),
  vatNumber: z.string().trim().regex(/^3\d{13}3$/, 'invalid_vat_number').optional().nullable().or(z.literal('')),
  commercialRegistration: z.string().trim().regex(/^\d{10}$/, 'invalid_cr').optional().nullable().or(z.literal('')),
  defaultLocale: z.enum(['ar', 'en']),
  addressCity: optText(80),
  addressLine: optText(200),
  lowStockThreshold: z.number().int().min(0).max(10000),
  freeShippingThreshold: money.optional().nullable(),
  defaultShippingFee: money,
});

// ---------- Team ----------
export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(E.ROLES).refine((r) => r !== 'OWNER', 'cannot_invite_owner'),
});
export const updateMemberSchema = z.object({ role: z.enum(E.ROLES) });

// ---------- Catalog ----------
export const categorySchema = z.object({
  nameAr: z.string().trim().min(1).max(100),
  nameEn: optText(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,60}$/, 'invalid_slug'),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

export const variantSchema = z.object({
  id: id.optional(),
  sku: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9._-]+$/, 'invalid_sku'),
  size: z.string().trim().min(1).max(20),
  color: z.string().trim().min(1).max(40),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  length: z.string().trim().max(20).optional().nullable(),
  price: money,
  compareAtPrice: money.optional().nullable(),
  costPrice: money.optional().nullable(),
  barcode: optText(64),
  weightGrams: z.number().int().min(0).max(100000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  titleAr: z.string().trim().min(2).max(200),
  titleEn: optText(200),
  descriptionAr: optText(5000),
  descriptionEn: optText(5000),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,100}$/, 'invalid_slug'),
  status: z.enum(E.PRODUCT_STATUSES).default('DRAFT'),
  categoryId: id.optional().nullable(),
  sizeChartId: id.optional().nullable(),
  cut: z.enum(E.ABAYA_CUTS).optional().nullable(),
  fabric: z.enum(E.ABAYA_FABRICS).optional().nullable(),
  sleeveType: z.enum(E.SLEEVE_TYPES).optional().nullable(),
  closure: z.enum(E.CLOSURE_TYPES).optional().nullable(),
  embellishment: z.enum(E.EMBELLISHMENTS).optional().nullable(),
  opacity: z.enum(E.OPACITY_LEVELS).optional().nullable(),
  occasions: z.array(z.enum(E.OCCASIONS)).max(8).default([]),
  includesShayla: z.boolean().default(false),
  careInstructionsAr: optText(1000),
  careInstructionsEn: optText(1000),
  seoTitle: optText(70),
  seoDescription: optText(160),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  variants: z.array(variantSchema).min(1, 'at_least_one_variant').max(300),
}).superRefine((p, ctx) => {
  const skus = new Set<string>();
  const combos = new Set<string>();
  p.variants.forEach((v, i) => {
    if (skus.has(v.sku.toLowerCase())) ctx.addIssue({ code: 'custom', path: ['variants', i, 'sku'], message: 'duplicate_sku' });
    skus.add(v.sku.toLowerCase());
    const c = `${v.size}|${v.color}|${v.length ?? ''}`.toLowerCase();
    if (combos.has(c)) ctx.addIssue({ code: 'custom', path: ['variants', i], message: 'duplicate_variant' });
    combos.add(c);
    if (v.compareAtPrice != null && v.compareAtPrice <= v.price)
      ctx.addIssue({ code: 'custom', path: ['variants', i, 'compareAtPrice'], message: 'compare_at_must_exceed_price' });
  });
});
export type ProductInput = z.infer<typeof productSchema>;

export const productQuerySchema = paginationSchema.extend({
  status: z.enum(E.PRODUCT_STATUSES).optional(),
  categoryId: id.optional(),
});

// ---------- Inventory ----------
export const locationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  city: optText(80),
  isDefault: z.boolean().default(false),
});
export const adjustStockSchema = z.object({
  variantId: id,
  locationId: id,
  type: z.enum(['ADJUSTMENT', 'RECEIPT']),
  quantity: z.number().int().min(-100000).max(100000).refine((q) => q !== 0, 'quantity_nonzero'),
  note: optText(300),
});
export const transferStockSchema = z.object({
  variantId: id,
  fromLocationId: id,
  toLocationId: id,
  quantity: z.number().int().min(1).max(100000),
  note: optText(300),
}).refine((t) => t.fromLocationId !== t.toLocationId, { message: 'same_location', path: ['toLocationId'] });

// ---------- Customers ----------
export const measurementSchema = z.object({
  label: z.string().trim().min(1).max(60).default('default'),
  height: z.number().min(100).max(220).optional().nullable(),
  bust: z.number().min(50).max(200).optional().nullable(),
  waist: z.number().min(40).max(200).optional().nullable(),
  hips: z.number().min(50).max(220).optional().nullable(),
  shoulder: z.number().min(25).max(70).optional().nullable(),
  armLength: z.number().min(40).max(90).optional().nullable(),
  fitPreference: z.enum(E.FIT_PREFERENCES).default('REGULAR'),
  wearsHeels: z.boolean().default(false),
});
export const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: saPhone.optional().nullable(),
  email: z.string().trim().toLowerCase().email().optional().nullable().or(z.literal('').transform(() => null)),
  city: optText(80),
  district: optText(80),
  addressLine: optText(300),
  birthday: z.coerce.date().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
  acceptsMarketing: z.boolean().default(false),
  notes: optText(2000),
});
export const customerQuerySchema = paginationSchema.extend({ tag: z.string().max(40).optional() });
export const customerNoteSchema = z.object({ body: z.string().trim().min(1).max(2000) });

// ---------- Orders ----------
export const orderItemInputSchema = z.object({
  variantId: id,
  quantity: z.number().int().min(1).max(100),
  unitPrice: money.optional(), // defaults to variant price
  discount: money.optional(),
});
export const createOrderSchema = z.object({
  customerId: id.optional().nullable(),
  channel: z.enum(E.ORDER_CHANNELS).default('MANUAL'),
  paymentMethod: z.enum(E.PAYMENT_METHODS).optional().nullable(),
  locationId: id.optional().nullable(),
  items: z.array(orderItemInputSchema).min(1).max(100),
  shippingFee: money.optional(),
  discount: money.default(0),
  shippingName: optText(120),
  shippingPhone: saPhone.optional().nullable(),
  shippingCity: optText(80),
  shippingDistrict: optText(80),
  shippingAddress: optText(300),
  notes: optText(1000),
  giftMessage: optText(300),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export const orderStatusSchema = z.object({ status: z.enum(E.ORDER_STATUSES), note: optText(300), trackingNumber: optText(100), carrier: optText(60) });
export const orderPaymentSchema = z.object({
  amount: money.refine((a) => a > 0, 'amount_positive'),
  method: z.enum(E.PAYMENT_METHODS),
  reference: optText(100),
});
export const orderQuerySchema = paginationSchema.extend({
  status: z.enum(E.ORDER_STATUSES).optional(),
  paymentStatus: z.enum(E.PAYMENT_STATUSES).optional(),
  customerId: id.optional(),
});

/** Allowed order status transitions. */
export const ORDER_TRANSITIONS: Record<E.OrderStatus, E.OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

// ---------- Returns ----------
export const createReturnSchema = z.object({
  orderId: id,
  type: z.enum(E.RETURN_TYPES),
  reason: z.enum(E.RETURN_REASONS),
  reasonNote: optText(1000),
  items: z.array(z.object({
    orderItemId: id,
    quantity: z.number().int().min(1).max(100),
    exchangeVariantId: id.optional().nullable(),
  })).min(1),
}).superRefine((r, ctx) => {
  if (r.type === 'EXCHANGE') r.items.forEach((it, i) => {
    if (!it.exchangeVariantId) ctx.addIssue({ code: 'custom', path: ['items', i, 'exchangeVariantId'], message: 'exchange_variant_required' });
  });
});
export const returnTransitionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'RECEIVE', 'COMPLETE', 'CANCEL']),
  restock: z.boolean().default(true),
  refundAmount: money.optional(),
  locationId: id.optional().nullable(),
  note: optText(500),
});
export const RETURN_TRANSITIONS: Record<E.ReturnStatus, Partial<Record<'APPROVE' | 'REJECT' | 'RECEIVE' | 'COMPLETE' | 'CANCEL', E.ReturnStatus>>> = {
  REQUESTED: { APPROVE: 'APPROVED', REJECT: 'REJECTED', CANCEL: 'CANCELLED' },
  APPROVED: { RECEIVE: 'RECEIVED', CANCEL: 'CANCELLED' },
  RECEIVED: { COMPLETE: 'COMPLETED' },
  REJECTED: {},
  COMPLETED: {},
  CANCELLED: {},
};

// ---------- Size charts ----------
const rangeSchema = z.object({ min: z.number().min(0).max(300), max: z.number().min(0).max(300) })
  .refine((r) => r.max >= r.min, 'max_lt_min');
export const sizeChartSchema = z.object({
  name: z.string().trim().min(2).max(100),
  isDefault: z.boolean().default(false),
  weights: z.record(z.enum(E.MEASUREMENT_KEYS), z.number().min(0).max(10)),
  rows: z.array(z.object({
    label: z.string().trim().min(1).max(20),
    ranges: z.record(z.enum(E.MEASUREMENT_KEYS), rangeSchema),
  })).min(1).max(30),
  lengthRows: z.array(z.object({
    label: z.string().trim().min(1).max(20),
    heightMin: z.number().min(100).max(230),
    heightMax: z.number().min(100).max(230),
  }).refine((r) => r.heightMax >= r.heightMin, 'max_lt_min')).max(30).default([]),
  heelAllowanceCm: z.number().min(0).max(15).default(0),
});
export const recommendSchema = z.object({
  sizeChartId: id.optional(),
  productId: id.optional(),
  customerId: id.optional(),
  measurementId: id.optional(),
  measurements: measurementSchema.omit({ label: true }).optional(),
}).refine((r) => r.sizeChartId || r.productId, { message: 'chart_or_product_required' })
  .refine((r) => r.measurements || r.customerId, { message: 'measurements_or_customer_required' });

// ---------- AI ----------
export const aiGenerateSchema = z.object({
  type: z.enum(E.AI_GENERATION_TYPES),
  productId: id.optional(),
  locale: z.enum(['ar', 'en']).default('ar'),
  tone: z.enum(['LUXURY', 'MODEST_ELEGANT', 'YOUTHFUL', 'MINIMAL']).default('LUXURY'),
  keywords: z.array(z.string().trim().max(40)).max(15).default([]),
  extraInstructions: optText(500),
});
export const imageJobSchema = z.object({
  type: z.enum(E.IMAGE_JOB_TYPES),
  productId: id.optional().nullable(),
  sourceAssetId: id,
  prompt: optText(1000),
});

// ---------- Marketing ----------
export const segmentRuleSchema = z.object({
  minOrders: z.number().int().min(0).optional(),
  maxOrders: z.number().int().min(0).optional(),
  minSpent: money.optional(),
  lastOrderWithinDays: z.number().int().min(1).max(3650).optional(),
  noOrderForDays: z.number().int().min(1).max(3650).optional(),
  cities: z.array(z.string().max(80)).max(50).optional(),
  tags: z.array(z.string().max(40)).max(30).optional(),
  acceptsMarketing: z.boolean().optional(),
});
export const segmentSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: optText(500),
  rules: segmentRuleSchema,
});
export const campaignSchema = z.object({
  name: z.string().trim().min(2).max(120),
  channel: z.enum(E.CAMPAIGN_CHANNELS),
  segmentId: id,
  subject: optText(200),
  bodyAr: z.string().trim().min(1).max(4000),
  bodyEn: optText(4000),
  scheduledAt: z.coerce.date().optional().nullable(),
});
export const automationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  trigger: z.enum(E.AUTOMATION_TRIGGERS),
  channel: z.enum(E.CAMPAIGN_CHANNELS),
  delayMinutes: z.number().int().min(0).max(60 * 24 * 60),
  bodyAr: z.string().trim().min(1).max(4000),
  bodyEn: optText(4000),
  isActive: z.boolean().default(false),
});

// ---------- Inbox ----------
export const channelSchema = z.object({
  type: z.enum(E.CHANNEL_TYPES),
  name: z.string().trim().min(2).max(100),
  externalId: optText(120),
  integrationId: id.optional().nullable(),
});
export const conversationSchema = z.object({
  channelId: id,
  customerId: id.optional().nullable(),
  subject: optText(200),
  contactHandle: z.string().trim().min(1).max(120),
});
export const messageSchema = z.object({ body: z.string().trim().min(1).max(4000), kind: z.enum(['REPLY', 'NOTE']).default('REPLY') });
export const conversationUpdateSchema = z.object({
  status: z.enum(E.CONVERSATION_STATUSES).optional(),
  assigneeId: id.optional().nullable(),
  customerId: id.optional().nullable(),
});

// ---------- Integrations & developer ----------
export const integrationConfigSchema = z.object({
  provider: z.enum(E.INTEGRATION_PROVIDERS),
  credentials: z.record(z.string().min(1).max(60), z.string().max(4000)),
  settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});
export const apiKeySchema = z.object({
  name: z.string().trim().min(2).max(80),
  scopes: z.array(z.enum(['products:read', 'orders:read', 'orders:write', 'customers:read', 'inventory:read'])).min(1),
});
export const WEBHOOK_EVENTS = ['order.created', 'order.updated', 'product.updated', 'inventory.low_stock', 'return.created', 'return.updated', 'customer.created'] as const;
export const webhookSchema = z.object({
  url: z.string().url().max(500).refine((u) => /^https?:\/\//.test(u), 'invalid_url'),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
  isActive: z.boolean().default(true),
});

// ---------- Billing / admin ----------
export const planSchema = z.object({
  code: z.string().trim().regex(/^[a-z0-9_-]{2,40}$/),
  nameAr: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().min(2).max(80),
  priceMonthly: money,
  priceYearly: money,
  maxProducts: z.number().int().min(1),
  maxStaff: z.number().int().min(1),
  aiCreditsMonthly: z.number().int().min(0),
  features: z.array(z.string().max(60)).max(40).default([]),
  isActive: z.boolean().default(true),
});
export const changePlanSchema = z.object({ planCode: z.string().min(2).max(40), interval: z.enum(['MONTHLY', 'YEARLY']) });
export const analyticsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
