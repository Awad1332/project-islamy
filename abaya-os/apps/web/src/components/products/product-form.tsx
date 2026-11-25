'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, ImagePlus, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import {
  ABAYA_CUTS, ABAYA_FABRICS, CLOSURE_TYPES, EMBELLISHMENTS, OCCASIONS, OPACITY_LEVELS, PRODUCT_STATUSES, SLEEVE_TYPES, productSchema,
} from '@abaya/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useUiMode } from '@/lib/mode';
import { MoreOptions } from '@/components/ui/details';
import { useI18n } from '@/i18n';
import { attrLabel } from '@/i18n/attrs';
import { useAction } from '@/lib/hooks';
import { errorText, fieldErrors } from '@/lib/errors';
import { sarInput, slugify, toHalalas } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';

interface VariantRow { id?: string; initialStock?: string; sku: string; size: string; color: string; colorHex?: string | null; length?: string | null; price: string; compareAtPrice: string; costPrice: string; isActive: boolean; stock?: number }

function toForm(p: any) {
  return {
    titleAr: p?.titleAr ?? '', titleEn: p?.titleEn ?? '', descriptionAr: p?.descriptionAr ?? '', descriptionEn: p?.descriptionEn ?? '', slug: p?.slug ?? '',
    status: p?.status ?? 'DRAFT', categoryId: p?.categoryId ?? '', sizeChartId: p?.sizeChartId ?? '', cut: p?.cut ?? '', fabric: p?.fabric ?? '',
    sleeveType: p?.sleeveType ?? '', closure: p?.closure ?? '', embellishment: p?.embellishment ?? '', opacity: p?.opacity ?? '',
    occasions: (p?.occasions ?? []) as string[], includesShayla: p?.includesShayla ?? false, careInstructionsAr: p?.careInstructionsAr ?? '',
    careInstructionsEn: p?.careInstructionsEn ?? '', seoTitle: p?.seoTitle ?? '', seoDescription: p?.seoDescription ?? '', tags: ((p?.tags ?? []) as string[]).join(', '),
  };
}
function toRows(p: any): VariantRow[] {
  return (p?.variants ?? []).map((v: any) => ({
    id: v.id, sku: v.sku, size: v.size, color: v.color, colorHex: v.colorHex, length: v.length ?? '', price: sarInput(v.price), compareAtPrice: sarInput(v.compareAtPrice),
    costPrice: sarInput(v.costPrice), isActive: v.isActive, stock: v.inventory?.reduce((s: number, l: any) => s + l.onHand, 0),
  }));
}

export function ProductForm({ product }: { product?: any }) {
  const { t, locale } = useI18n();
  const { can, me } = useAuth();
  const { pro } = useUiMode();
  const router = useRouter();
  const editable = can('catalog:write');
  const [f, setF] = useState(() => toForm(product));
  const [rows, setRows] = useState<VariantRow[]>(() => toRows(product));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [gen, setGen] = useState({ sizes: 'S, M, L, XL', colors: 'أسود', lengths: '52, 54, 56, 58', price: '', prefix: '' });
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api<any[]>('/categories') });
  const charts = useQuery({ queryKey: ['size-charts'], queryFn: () => api<any[]>('/size-charts') });
  const storage = useQuery({ queryKey: ['media-status'], queryFn: () => api<{ configured: boolean; reachable: boolean }>('/media/status') });

  const set = <K extends keyof ReturnType<typeof toForm>>(k: K, v: ReturnType<typeof toForm>[K]) => setF((s: ReturnType<typeof toForm>) => ({ ...s, [k]: v }));
  const vatLabel = me?.tenant.vatEnabled ? (me.tenant.pricesIncludeVat ? t('products.inclVat') : t('products.exclVat')) : '';

  function generate() {
    const split = (s: string) => s.split(/[,،]/).map((x) => x.trim()).filter(Boolean);
    const sizes = split(gen.sizes);
    const colors = split(gen.colors);
    const lengths = split(gen.lengths);
    const prefix = (gen.prefix || f.slug || 'ABY').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'ABY';
    const existing = new Set(rows.map((r) => `${r.size}|${r.color}|${r.length ?? ''}`));
    const add: VariantRow[] = [];
    colors.forEach((c, ci) => sizes.forEach((s) => (lengths.length ? lengths : ['']).forEach((l) => {
      if (existing.has(`${s}|${c}|${l}`)) return;
      add.push({ sku: `${prefix}-${ci + 1}${s}${l ? `-${l}` : ''}`.replace(/\s+/g, ''), size: s, color: c, length: l || null, price: gen.price, compareAtPrice: '', costPrice: '', isActive: true });
    })));
    setRows((r) => [...r, ...add]);
  }

  function payload() {
    return {
      ...f,
      slug: f.slug || undefined,
      titleEn: f.titleEn || null, descriptionAr: f.descriptionAr || null, descriptionEn: f.descriptionEn || null,
      categoryId: f.categoryId || null, sizeChartId: f.sizeChartId || null,
      cut: f.cut || null, fabric: f.fabric || null, sleeveType: f.sleeveType || null, closure: f.closure || null, embellishment: f.embellishment || null, opacity: f.opacity || null,
      careInstructionsAr: f.careInstructionsAr || null, careInstructionsEn: f.careInstructionsEn || null, seoTitle: f.seoTitle || null, seoDescription: f.seoDescription || null,
      tags: f.tags.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      variants: rows.map((r, i) => ({
        ...(r.id ? { id: r.id } : { initialStock: Math.max(0, Number(r.initialStock) || 0) }),
        sku: r.sku.trim() || `${(f.slug || 'ABY').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'ABY'}-${Date.now().toString(36).slice(-3).toUpperCase()}${i}`, size: r.size, color: r.color, colorHex: r.colorHex || null, length: r.length || null,
        price: toHalalas(r.price), compareAtPrice: r.compareAtPrice ? toHalalas(r.compareAtPrice) : null, costPrice: r.costPrice ? toHalalas(r.costPrice) : null, isActive: r.isActive,
      })),
    };
  }

  async function save() {
    const body = payload();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      const errs = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), t(`errors.${i.message}`, i.message)]));
      setErrors(errs);
      toast.error(t('errors.VALIDATION_FAILED'));
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const r = product ? await api(`/products/${product.id}`, { method: 'PUT', body: parsed.data }) : await api('/products', { body: parsed.data });
      toast.success(t('common.saved'));
      if (!product) router.replace(`/products/${r.id}`);
      else setRows(toRows(r));
    } catch (e) {
      setErrors(fieldErrors(e, t));
      toast.error(errorText(e, t));
    } finally {
      setSaving(false);
    }
  }

  const remove = useAction(() => api(`/products/${product.id}`, { method: 'DELETE' }), { success: t('common.deleted'), onSuccess: () => router.replace('/products') });
  const duplicate = useAction(() => api(`/products/${product.id}/duplicate`, { method: 'POST' }), { success: t('common.created'), onSuccess: (r: any) => router.push(`/products/${r.id}`) });
  const upload = useAction(async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const asset = await api('/media', { body: fd });
    return api(`/products/${product.id}/images`, { body: { assetId: asset.id } });
  }, { invalidate: [['product', product?.id]] });
  const removeImage = useAction((id: string) => api(`/products/${product.id}/images/${id}`, { method: 'DELETE' }), { invalidate: [['product', product?.id]], success: t('common.deleted') });

  const err = (k: string) => errors[k];
  const optionGroup = (key: string, values: readonly string[]) => (
    <Field label={t(`products.${key}`)}>
      <Select value={(f as any)[key]} onChange={(e) => set(key as any, e.target.value)} disabled={!editable}>
        <option value="">—</option>
        {values.map((v) => <option key={v} value={v}>{attrLabel(key, v, locale)}</option>)}
      </Select>
    </Field>
  );

  const totalStock = useMemo(() => rows.reduce((s, r) => s + (r.stock ?? 0), 0), [rows]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('products.titleAr')} error={err('titleAr')}><Input value={f.titleAr} disabled={!editable} onChange={(e) => set('titleAr', e.target.value)} /></Field>
              <Field label={t('products.titleEn')}><Input dir="ltr" value={f.titleEn} disabled={!editable} onChange={(e) => { set('titleEn', e.target.value); if (!product && !f.slug) set('slug', slugify(e.target.value)); }} onBlur={() => !f.slug && set('slug', slugify(f.titleEn))} /></Field>
            </div>
            {pro && <Field label={t('products.slug')} error={err('slug')} hint="a-z 0-9 -"><Input dir="ltr" value={f.slug} disabled={!editable} onChange={(e) => set('slug', slugify(e.target.value))} /></Field>}
            <Field label={t('products.descriptionAr')}><Textarea rows={5} value={f.descriptionAr} disabled={!editable} onChange={(e) => set('descriptionAr', e.target.value)} /></Field>
            <Field label={t('products.descriptionEn')}><Textarea dir="ltr" rows={4} value={f.descriptionEn} disabled={!editable} onChange={(e) => set('descriptionEn', e.target.value)} /></Field>
            {product && can('ai:use') && <Button variant="outline" size="sm" onClick={() => router.push(`/ai?productId=${product.id}`)}><Sparkles />{t('nav.ai')}</Button>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('products.attributes')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {optionGroup('cut', ABAYA_CUTS)}
              {optionGroup('fabric', ABAYA_FABRICS)}
              {pro && optionGroup('sleeveType', SLEEVE_TYPES)}
              {pro && optionGroup('closure', CLOSURE_TYPES)}
              {pro && optionGroup('embellishment', EMBELLISHMENTS)}
              {pro && optionGroup('opacity', OPACITY_LEVELS)}
            </div>
            {!pro && (
              <MoreOptions label={t('common.moreOptions')}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {optionGroup('sleeveType', SLEEVE_TYPES)}
                  {optionGroup('closure', CLOSURE_TYPES)}
                  {optionGroup('embellishment', EMBELLISHMENTS)}
                  {optionGroup('opacity', OPACITY_LEVELS)}
                </div>
              </MoreOptions>
            )}
            <div>
              <Label>{t('products.occasions')}</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {OCCASIONS.map((o) => {
                  const on = f.occasions.includes(o);
                  return (
                    <button key={o} type="button" disabled={!editable} onClick={() => set('occasions', on ? f.occasions.filter((x) => x !== o) : [...f.occasions, o])}
                      className={`rounded-full border px-3 py-1 text-xs transition ${on ? 'border-gold bg-gold-100 text-gold-700' : 'hover:bg-accent'}`}>
                      {attrLabel('occasions', o, locale)}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm"><Switch checked={f.includesShayla} disabled={!editable} onCheckedChange={(v) => set('includesShayla', v)} />{t('products.includesShayla')}</label>
            {pro && <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${t('products.care')} (AR)`}><Textarea rows={2} value={f.careInstructionsAr} disabled={!editable} onChange={(e) => set('careInstructionsAr', e.target.value)} /></Field>
              <Field label={`${t('products.care')} (EN)`}><Textarea dir="ltr" rows={2} value={f.careInstructionsEn} disabled={!editable} onChange={(e) => set('careInstructionsEn', e.target.value)} /></Field>
            </div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('products.variants')}</CardTitle>
            <CardDescription>{t('products.priceHint')}{vatLabel ? ` — ${vatLabel}` : ''}{product ? ` · ${t('products.stock')}: ${totalStock}` : ''}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editable && pro && (
              <div className="rounded-lg border border-dashed border-gold-300 bg-gold-100/30 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Wand2 className="size-4 text-gold-700" />{t('products.generator')}</div>
                <div className="grid gap-3 sm:grid-cols-5">
                  <Field label={t('products.sizes')}><Input value={gen.sizes} onChange={(e) => setGen({ ...gen, sizes: e.target.value })} /></Field>
                  <Field label={t('products.colors')}><Input value={gen.colors} onChange={(e) => setGen({ ...gen, colors: e.target.value })} /></Field>
                  <Field label={t('products.lengths')}><Input dir="ltr" value={gen.lengths} onChange={(e) => setGen({ ...gen, lengths: e.target.value })} /></Field>
                  <Field label={t('products.basePrice')}><Input type="number" min={0} step="0.01" value={gen.price} onChange={(e) => setGen({ ...gen, price: e.target.value })} /></Field>
                  <Field label={t('products.skuPrefix')}><Input dir="ltr" value={gen.prefix} onChange={(e) => setGen({ ...gen, prefix: e.target.value })} /></Field>
                </div>
                <Button className="mt-3" variant="secondary" size="sm" onClick={generate}><Wand2 />{t('products.generate')}</Button>
              </div>
            )}
            {err('variants') && <p className="text-sm text-destructive">{err('variants')}</p>}
            {rows.length > 0 && (
              <Table>
                <THead><TR>{pro && <TH>{t('products.sku')}</TH>}<TH>{t('products.size')}</TH><TH>{t('products.color')}</TH><TH>{t('products.length')}</TH><TH>{t('products.price')}</TH>{pro && <TH>{t('products.compareAt')}</TH>}{pro && <TH>{t('products.cost')}</TH>}<TH>{t('products.stock')}</TH><TH /></TR></THead>
                <TBody>
                  {rows.map((r, i) => {
                    const upd = (k: keyof VariantRow, v: unknown) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
                    const e = (k: string) => errors[`variants.${i}.${k}`] || errors[`variants.${i}`];
                    return (
                      <TR key={r.id ?? `n${i}`} className={!r.isActive ? 'opacity-50' : ''}>
                        {pro && <TD><Input dir="ltr" className="h-8 min-w-[130px] text-xs" aria-invalid={Boolean(e('sku'))} title={e('sku')} value={r.sku} disabled={!editable} onChange={(ev) => upd('sku', ev.target.value)} /></TD>}
                        <TD><Input className="h-8 w-16 text-xs" value={r.size} disabled={!editable} onChange={(ev) => upd('size', ev.target.value)} /></TD>
                        <TD><Input className="h-8 w-24 text-xs" value={r.color} disabled={!editable} onChange={(ev) => upd('color', ev.target.value)} /></TD>
                        <TD><Input dir="ltr" className="h-8 w-16 text-xs" value={r.length ?? ''} disabled={!editable} onChange={(ev) => upd('length', ev.target.value)} /></TD>
                        <TD><Input type="number" step="0.01" className="h-8 w-24 text-xs" value={r.price} disabled={!editable} onChange={(ev) => upd('price', ev.target.value)} /></TD>
                        {pro && <TD><Input type="number" step="0.01" className="h-8 w-24 text-xs" aria-invalid={Boolean(e('compareAtPrice'))} title={e('compareAtPrice')} value={r.compareAtPrice} disabled={!editable} onChange={(ev) => upd('compareAtPrice', ev.target.value)} /></TD>}
                        {pro && <TD><Input type="number" step="0.01" className="h-8 w-24 text-xs" value={r.costPrice} disabled={!editable} onChange={(ev) => upd('costPrice', ev.target.value)} /></TD>}
                        <TD>{r.id ? <span className="num text-xs">{r.stock ?? 0}</span> : <Input type="number" min={0} className="h-8 w-20 text-xs" placeholder="0" title={t('products.initialStock')} value={r.initialStock ?? ''} disabled={!editable} onChange={(ev) => upd('initialStock', ev.target.value)} />}</TD>
                        <TD>{editable && <Button variant="ghost" size="icon" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="remove"><X /></Button>}</TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
            {editable && <Button variant="outline" size="sm" onClick={() => setRows((r) => [...r, { sku: '', size: '', color: '', length: '', price: gen.price, compareAtPrice: '', costPrice: '', isActive: true }])}>{t('products.addVariant')}</Button>}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-5">
            <Field label={t('common.status')}>
              <Select value={f.status} disabled={!editable} onChange={(e) => set('status', e.target.value)}>
                {PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{t(`products.statuses.${s}`)}</option>)}
              </Select>
            </Field>
            <Field label={t('products.category')}>
              <Select value={f.categoryId} disabled={!editable} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">—</option>
                {categories.data?.map((c) => <option key={c.id} value={c.id}>{locale === 'en' && c.nameEn ? c.nameEn : c.nameAr}</option>)}
              </Select>
            </Field>
            <Field label={t('products.sizeChart')}>
              <Select value={f.sizeChartId} disabled={!editable} onChange={(e) => set('sizeChartId', e.target.value)}>
                <option value="">—</option>
                {charts.data?.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isDefault ? ' ★' : ''}</option>)}
              </Select>
            </Field>
            {pro && <Field label={t('products.tags')} hint={t('products.tagsHint')}><Input value={f.tags} disabled={!editable} onChange={(e) => set('tags', e.target.value)} /></Field>}
            {editable && <Button className="w-full" onClick={save} loading={saving}>{t('common.save')}</Button>}
            {product && editable && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => duplicate.mutate(undefined)} loading={duplicate.isPending}><Copy />{t('products.duplicate')}</Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => confirm(t('common.confirmDelete')) && remove.mutate(undefined)} loading={remove.isPending}><Trash2 /></Button>
              </div>
            )}
          </CardContent>
        </Card>

        {pro && <Card>
          <CardHeader><CardTitle>{t('products.seo')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label={t('products.seoTitle')} hint={`${f.seoTitle.length}/70`}><Input value={f.seoTitle} maxLength={70} disabled={!editable} onChange={(e) => set('seoTitle', e.target.value)} /></Field>
            <Field label={t('products.seoDescription')} hint={`${f.seoDescription.length}/160`}><Textarea rows={3} maxLength={160} value={f.seoDescription} disabled={!editable} onChange={(e) => set('seoDescription', e.target.value)} /></Field>
          </CardContent>
        </Card>}

        {product && (
          <Card>
            <CardHeader><CardTitle>{t('products.images')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {storage.data && !storage.data.reachable && <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">{t('products.storageOff')}</p>}
              <div className="grid grid-cols-3 gap-2">
                {product.images.map((img: any) => (
                  <div key={img.id} className="group relative aspect-[3/4] overflow-hidden rounded-md bg-beige-100">
                    <img src={img.url} alt={img.altAr ?? ''} className="size-full object-cover" />
                    {editable && <button onClick={() => removeImage.mutate(img.id)} className="absolute end-1 top-1 hidden rounded bg-white/90 p-1 group-hover:block" aria-label="remove"><Trash2 className="size-3" /></button>}
                  </div>
                ))}
              </div>
              {editable && (
                <>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) upload.mutate(file); e.target.value = ''; }} />
                  <Button variant="outline" size="sm" className="w-full" disabled={!storage.data?.reachable} loading={upload.isPending} onClick={() => fileRef.current?.click()}><ImagePlus />{t('products.upload')}</Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
