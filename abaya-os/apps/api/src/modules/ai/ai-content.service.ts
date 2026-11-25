import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { aiGenerateSchema, paginationSchema } from '@abaya/shared';
import { PrismaService } from '../../common/prisma.service';
import { RedisService } from '../../common/redis.service';
import { AuditService } from '../../common/audit.service';
import { AppError, integrationNotConnected, notFound } from '../../common/errors';
import { paged } from '../../common/zod';
import type { AuthUser } from '../../common/auth';
import { env } from '../../config/env';
import { BillingService } from '../billing/billing.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { PROVIDERS } from '../integrations/providers';

const TYPE_INSTRUCTIONS: Record<string, { ar: string; en: string }> = {
  PRODUCT_TITLE: {
    ar: 'اكتبي 5 عناوين مقترحة للمنتج، كل عنوان في سطر مستقل، لا يتجاوز 60 حرفاً، بدون ترقيم أو رموز تعبيرية.',
    en: 'Write 5 product title options, one per line, max 60 characters each, no numbering or emojis.',
  },
  PRODUCT_DESCRIPTION: {
    ar: 'اكتبي وصفاً للمنتج في 3 فقرات قصيرة: إحساس القطعة وأناقتها، تفاصيل القماش والقصّة والخياطة، ومناسبات الارتداء ونصائح التنسيق. ثم قائمة نقاط بالمواصفات وتعليمات العناية.',
    en: 'Write a product description in 3 short paragraphs (feel & elegance, fabric/cut/craftsmanship, occasions & styling), then a bullet list of specifications and care.',
  },
  SEO: {
    ar: 'أعيدي النتيجة بصيغة JSON فقط بالمفاتيح: seoTitle (حتى 60 حرفاً)، seoDescription (حتى 155 حرفاً)، keywords (مصفوفة حتى 10 كلمات بحث يستخدمها المتسوقون في السعودية).',
    en: 'Return JSON only with keys: seoTitle (≤60 chars), seoDescription (≤155 chars), keywords (array of ≤10 search terms shoppers in Saudi Arabia use).',
  },
  INSTAGRAM_CAPTION: {
    ar: 'اكتبي 3 تعليقات إنستقرام مختلفة، كل واحد بين علامتي ---، مع دعوة لاتخاذ إجراء ووسوم مناسبة للسوق السعودي (حتى 8 وسوم).',
    en: 'Write 3 distinct Instagram captions separated by ---, each with a call to action and up to 8 hashtags relevant to the Saudi market.',
  },
};

const TONES: Record<string, string> = {
  LUXURY: 'luxurious, refined, understated — like a high-end Saudi couture house',
  MODEST_ELEGANT: 'modest, graceful, warm and trustworthy',
  YOUTHFUL: 'fresh, youthful and confident, but still modest',
  MINIMAL: 'minimal, calm and precise',
};

@Injectable()
export class AiContentService {
  private readonly logger = new Logger(AiContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly billing: BillingService,
    private readonly integrations: IntegrationsService,
  ) {}

  /** Tenant key (verified) takes precedence; otherwise the platform key, but only after a live check succeeded. */
  async resolveKey(tenantId: string): Promise<{ apiKey: string; source: 'tenant' | 'platform' } | null> {
    const creds = await this.integrations.verifiedCredentials(tenantId, 'ANTHROPIC');
    if (creds?.apiKey) return { apiKey: creds.apiKey, source: 'tenant' };
    const platformKey = env().ANTHROPIC_API_KEY;
    if (!platformKey) return null;
    const cacheKey = 'platform:anthropic:verified';
    const cached = await this.redis.client.get(cacheKey).catch(() => null);
    if (cached === 'ok') return { apiKey: platformKey, source: 'platform' };
    if (cached === 'fail') return null;
    const r = await PROVIDERS.ANTHROPIC.verify!({ apiKey: platformKey });
    await this.redis.client.set(cacheKey, r.ok ? 'ok' : 'fail', 'EX', r.ok ? 3600 : 300).catch(() => undefined);
    return r.ok ? { apiKey: platformKey, source: 'platform' } : null;
  }

  async status(u: AuthUser) {
    const key = await this.resolveKey(u.tenantId);
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId: u.tenantId }, include: { plan: true } });
    return {
      available: Boolean(key),
      source: key?.source ?? null,
      model: env().ANTHROPIC_MODEL,
      credits: sub ? { used: sub.aiCreditsUsed, limit: sub.plan.aiCreditsMonthly } : null,
    };
  }

  private async buildPrompt(tenantId: string, b: z.infer<typeof aiGenerateSchema>) {
    let productBlock = 'No product selected — write generic copy for a premium abaya.';
    if (b.productId) {
      const p = await this.prisma.product.findFirst({ where: { id: b.productId, tenantId }, include: { variants: true, category: true } });
      if (!p) throw notFound('product');
      const colors = [...new Set(p.variants.map((v) => v.color))];
      const sizes = [...new Set(p.variants.map((v) => v.size))];
      const lengths = [...new Set(p.variants.map((v) => v.length).filter(Boolean))];
      const prices = p.variants.map((v) => v.price);
      productBlock = JSON.stringify({
        titleAr: p.titleAr, titleEn: p.titleEn, category: p.category?.nameAr, cut: p.cut, fabric: p.fabric, sleeveType: p.sleeveType,
        closure: p.closure, embellishment: p.embellishment, opacity: p.opacity, occasions: p.occasions, includesShayla: p.includesShayla,
        colors, sizes, lengthsInches: lengths, priceRangeSar: prices.length ? [Math.min(...prices) / 100, Math.max(...prices) / 100] : null,
        existingDescription: p.descriptionAr?.slice(0, 1000),
      });
    }
    const t = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { nameAr: true, nameEn: true } });
    const lang = b.locale === 'ar' ? 'Arabic (Modern Standard with a natural Saudi/Gulf retail voice; use Saudi market terms such as عباية، طرحة/شيلة، كريب، نيدا، قصّة، مقاس، طول)' : 'English';
    const system = [
      `You write e-commerce copy for "${t.nameAr}${t.nameEn ? ` / ${t.nameEn}` : ''}", an abaya brand selling in Saudi Arabia.`,
      `Write in ${lang}. Tone: ${TONES[b.tone]}.`,
      'Respect modesty and local culture. Never invent facts that are not in the product data (no fabric composition, origin, or certifications unless given).',
      'Prices are in SAR. Do not mention prices unless asked. Output only the requested content, with no preamble.',
    ].join('\n');
    const instr = TYPE_INSTRUCTIONS[b.type][b.locale];
    const user = [
      `Product data (JSON): ${productBlock}`,
      b.keywords.length ? `Keywords to include naturally: ${b.keywords.join('، ')}` : '',
      b.extraInstructions ? `Merchant notes: ${b.extraInstructions}` : '',
      `Task: ${instr}`,
    ].filter(Boolean).join('\n\n');
    return { system, user };
  }

  async generate(u: AuthUser, b: z.infer<typeof aiGenerateSchema>) {
    const key = await this.resolveKey(u.tenantId);
    if (!key) throw integrationNotConnected('ANTHROPIC');
    const { system, user } = await this.buildPrompt(u.tenantId, b);
    await this.billing.consumeAiCredit(u.tenantId);

    const model = env().ANTHROPIC_MODEL;
    const client = new Anthropic({ apiKey: key.apiKey, timeout: 120_000 });
    let response: Anthropic.Beta.BetaMessage;
    try {
      response = await client.beta.messages.create({
        model,
        max_tokens: 8000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium' },
        system,
        messages: [{ role: 'user', content: user }],
      });
    } catch (e) {
      await this.billing.refundAiCredit(u.tenantId);
      if (e instanceof Anthropic.AuthenticationError) throw new AppError(502, 'AI_AUTH_FAILED', 'AI provider rejected the API key');
      if (e instanceof Anthropic.RateLimitError) throw new AppError(429, 'AI_RATE_LIMITED', 'AI provider rate limit reached, try again shortly');
      if (e instanceof Anthropic.APIError) throw new AppError(502, 'AI_PROVIDER_ERROR', `AI provider error ${e.status}`);
      this.logger.error(`AI call failed: ${(e as Error).message}`);
      throw new AppError(502, 'AI_PROVIDER_UNREACHABLE', 'Could not reach the AI provider');
    }
    if (response.stop_reason === 'refusal') {
      await this.billing.refundAiCredit(u.tenantId);
      throw new AppError(422, 'AI_REFUSED', 'The AI declined this request');
    }
    const output = response.content.flatMap((c) => (c.type === 'text' ? [c.text] : [])).join('\n').trim();
    if (!output) {
      await this.billing.refundAiCredit(u.tenantId);
      throw new AppError(502, 'AI_EMPTY_RESPONSE');
    }
    const gen = await this.prisma.aiGeneration.create({
      data: {
        tenantId: u.tenantId, userId: u.userId, productId: b.productId ?? null, type: b.type, locale: b.locale,
        provider: `anthropic:${key.source}`, model: response.model, prompt: user.slice(0, 8000), output,
        inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens,
      },
    });
    await this.audit.log(u, 'ai.generated', 'AiGeneration', gen.id, { type: b.type });
    return gen;
  }

  async history(u: AuthUser, q: z.infer<typeof paginationSchema>, productId?: string) {
    const where = { tenantId: u.tenantId, ...(productId ? { productId } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.aiGeneration.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      this.prisma.aiGeneration.count({ where }),
    ]);
    return paged(items, total, q.page, q.pageSize);
  }

  /** Apply generated text to the product's fields (merchant-confirmed). */
  async apply(u: AuthUser, id: string, field: 'titleAr' | 'titleEn' | 'descriptionAr' | 'descriptionEn' | 'seo', text?: string) {
    const gen = await this.prisma.aiGeneration.findFirst({ where: { id, tenantId: u.tenantId } });
    if (!gen) throw notFound('generation');
    if (!gen.productId) throw new AppError(400, 'NO_PRODUCT', 'Generation is not linked to a product');
    const value = (text ?? gen.output).trim();
    let data: Record<string, string> = {};
    if (field === 'seo') {
      try {
        const json = JSON.parse(value.replace(/^```(?:json)?|```$/g, '').trim());
        data = { seoTitle: String(json.seoTitle ?? '').slice(0, 70), seoDescription: String(json.seoDescription ?? '').slice(0, 160) };
      } catch {
        throw new AppError(422, 'SEO_PARSE_FAILED', 'Generated SEO output is not valid JSON');
      }
    } else {
      data = { [field]: field.startsWith('title') ? value.split('\n')[0].slice(0, 200) : value.slice(0, 5000) };
    }
    await this.prisma.product.updateMany({ where: { id: gen.productId, tenantId: u.tenantId }, data });
    await this.prisma.aiGeneration.update({ where: { id }, data: { appliedAt: new Date() } });
    await this.audit.log(u, 'ai.applied', 'Product', gen.productId, { field });
    return { ok: true };
  }
}
