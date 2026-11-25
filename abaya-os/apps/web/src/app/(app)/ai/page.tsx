'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Plug, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AI_GENERATION_TYPES } from '@abaya/shared';
import { api, type Paged } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FIELD_FOR: Record<string, string[]> = {
  PRODUCT_TITLE: ['titleAr', 'titleEn'], PRODUCT_DESCRIPTION: ['descriptionAr', 'descriptionEn'], SEO: ['seo'], INSTAGRAM_CAPTION: [],
};

function Studio() {
  const { t, date, num } = useI18n();
  const { can } = useAuth();
  const initialProduct = useSearchParams().get('productId') ?? '';
  const status = useQuery({ queryKey: ['ai-status'], queryFn: () => api('/ai/content/status') });
  const products = useQuery({ queryKey: ['products-pick'], queryFn: () => api('/products', { query: { pageSize: 100 } }) });
  const [f, setF] = useState({ type: 'PRODUCT_DESCRIPTION', productId: initialProduct, locale: 'ar', tone: 'LUXURY', keywords: '', extraInstructions: '' });
  const [output, setOutput] = useState<any>(null);
  const history = useQuery({ queryKey: ['ai-history', f.productId], queryFn: () => api<Paged<any>>('/ai/content/history', { query: { productId: f.productId || undefined, pageSize: 10 } }) });
  const gen = useAction(() => api('/ai/content/generate', { body: { ...f, productId: f.productId || undefined, keywords: f.keywords.split(/[,،]/).map((s) => s.trim()).filter(Boolean), extraInstructions: f.extraInstructions || null } }), {
    invalidate: [['ai-history'], ['ai-status']], success: false, onSuccess: setOutput,
  });
  const apply = useAction((p: { id: string; field: string; text: string }) => api(`/ai/content/${p.id}/apply`, { body: { field: p.field, text: p.text } }), { invalidate: [['ai-history']] });

  return (
    <>
      <PageHeader title={t('ai.title')} description={t('ai.sub')} actions={status.data?.credits && <Badge variant="gold">{t('ai.credits')}: <span className="num">{num(status.data.credits.used)}/{num(status.data.credits.limit)}</span></Badge>} />
      <QueryState q={status}>
        {(s) => !s.available ? (
          <EmptyState icon={Plug} title={t('ai.unavailable')} description={t('ai.unavailableSub')} action={can('integrations:manage') && <Button asChild variant="gold"><Link href="/integrations">{t('nav.integrations')}</Link></Button>} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardContent className="space-y-4 pt-5">
                <Field label={t('ai.type')}><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{AI_GENERATION_TYPES.map((x) => <option key={x} value={x}>{t(`ai.types.${x}`)}</option>)}</Select></Field>
                <Field label={t('ai.product')}><Select value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}><option value="">—</option>{products.data?.items.map((p: any) => <option key={p.id} value={p.id}>{p.titleAr}</option>)}</Select></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('ai.locale')}><Select value={f.locale} onChange={(e) => setF({ ...f, locale: e.target.value })}><option value="ar">العربية</option><option value="en">English</option></Select></Field>
                  <Field label={t('ai.tone')}><Select value={f.tone} onChange={(e) => setF({ ...f, tone: e.target.value })}>{['LUXURY', 'MODEST_ELEGANT', 'YOUTHFUL', 'MINIMAL'].map((x) => <option key={x} value={x}>{t(`ai.tones.${x}`)}</option>)}</Select></Field>
                </div>
                <Field label={t('ai.keywords')} hint={t('products.tagsHint')}><Input value={f.keywords} onChange={(e) => setF({ ...f, keywords: e.target.value })} /></Field>
                <Field label={t('ai.instructions')}><Textarea rows={3} value={f.extraInstructions} onChange={(e) => setF({ ...f, extraInstructions: e.target.value })} /></Field>
                <Button variant="gold" className="w-full" onClick={() => gen.mutate(undefined)} loading={gen.isPending}><Sparkles />{t('ai.generate')}</Button>
                <p className="text-xs text-muted-foreground">{t('ai.source')}: {s.source} · {s.model}</p>
              </CardContent>
            </Card>
            <div className="space-y-6 lg:col-span-3">
              {output && <Output gen={output} onApply={(field, text) => apply.mutate({ id: output.id, field, text })} applying={apply.isPending} />}
              <Card>
                <CardHeader><CardTitle>{t('ai.history')}</CardTitle></CardHeader>
                <CardContent>
                  <QueryState q={history} isEmpty={(d) => d.items.length === 0} empty={<p className="text-sm text-muted-foreground">{t('marketing.empty')}</p>}>
                    {(d) => (
                      <div className="space-y-2">
                        {d.items.map((g) => (
                          <button key={g.id} onClick={() => setOutput(g)} className="w-full rounded-md border p-3 text-start text-sm hover:border-gold">
                            <div className="flex justify-between text-xs text-muted-foreground"><span>{t(`ai.types.${g.type}`)} · {g.locale}</span><span>{date(g.createdAt, true)}{g.appliedAt ? ' ✓' : ''}</span></div>
                            <p className="mt-1 line-clamp-2">{g.output}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </QueryState>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </QueryState>
    </>
  );
}

function Output({ gen, onApply, applying }: { gen: any; onApply: (field: string, text: string) => void; applying: boolean }) {
  const { t } = useI18n();
  const [text, setText] = useState(gen.output);
  const fields = (FIELD_FOR[gen.type] ?? []).filter((f) => f === 'seo' || f.endsWith(gen.locale === 'ar' ? 'Ar' : 'En'));
  return (
    <Card className="border-gold-300">
      <CardHeader className="flex-row items-center justify-between"><CardTitle>{t('ai.output')}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(text); toast.success(t('common.copied')); }}><Copy />{t('common.copy')}</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea rows={12} dir={gen.locale === 'ar' ? 'rtl' : 'ltr'} value={text} onChange={(e) => setText(e.target.value)} />
        {gen.productId && fields.length > 0 && (
          <div className="flex flex-wrap gap-2">{fields.map((f) => <Button key={f} size="sm" variant="outline" loading={applying} onClick={() => onApply(f, text)}>{t('ai.applyTo')}: {t(`ai.fields.${f}`)}</Button>)}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Page() {
  return <Suspense><Studio /></Suspense>;
}
