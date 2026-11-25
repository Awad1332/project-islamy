'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { errorText } from '@/lib/errors';
import { cn, toHalalas } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field, Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { ChipPicker } from '@/components/ui/chips';

const COLORS: { ar: string; en: string; hex: string }[] = [
  { ar: 'أسود', en: 'Black', hex: '#111111' }, { ar: 'كحلي', en: 'Navy', hex: '#1f2a44' }, { ar: 'بيج', en: 'Beige', hex: '#d8c3a5' },
  { ar: 'رمادي', en: 'Grey', hex: '#8a8a8a' }, { ar: 'بني', en: 'Brown', hex: '#5b4636' }, { ar: 'زيتي', en: 'Olive', hex: '#556b2f' },
  { ar: 'عنابي', en: 'Burgundy', hex: '#6d1f2a' }, { ar: 'موف', en: 'Mauve', hex: '#7d5a7a' }, { ar: 'أبيض', en: 'White', hex: '#f5f5f0' },
];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const LENGTHS = ['50', '52', '54', '56', '58', '60', '62'];

export function QuickProduct() {
  const { t, locale, money } = useI18n();
  const { me } = useAuth();
  const router = useRouter();
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api<any[]>('/categories') });
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [colors, setColors] = useState<string[]>([locale === 'ar' ? 'أسود' : 'Black']);
  const [lengths, setLengths] = useState<string[]>(['54', '56', '58']);
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('3');
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  const freeSize = t('quick.freeSize');

  const combos = useMemo(() => colors.flatMap((c) => sizes.flatMap((s) => (lengths.length ? lengths : ['']).map((l) => ({ key: `${c}|${s}|${l}`, color: c, size: s, length: l })))), [colors, sizes, lengths]);
  const hexOf = (c: string) => COLORS.find((x) => x.ar === c || x.en === c)?.hex ?? null;

  const problem = step === 1 ? (!title.trim() ? t('quick.needName') : null)
    : step === 2 ? (!sizes.length ? t('quick.needSize') : !colors.length ? t('quick.needColor') : null)
    : (!price || toHalalas(price) <= 0 ? t('quick.needPrice') : null);

  async function save() {
    setBusy(true);
    const prefix = `A${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const code = (v: string, i: number) => v.replace(/[^A-Za-z0-9]/g, '') || `Z${i}`;
    try {
      const p = await api('/products', {
        body: {
          titleAr: title.trim(),
          titleEn: null,
          status: publish ? 'ACTIVE' : 'DRAFT',
          categoryId: categoryId || null,
          occasions: [], tags: [],
          variants: combos.map((c) => ({
            sku: `${prefix}-${colors.indexOf(c.color) + 1}${code(c.size, sizes.indexOf(c.size))}${c.length ? `-${code(c.length, 0)}` : ''}`,
            size: c.size, color: c.color, colorHex: hexOf(c.color), length: c.length || null,
            price: toHalalas(price), isActive: true,
            initialStock: Math.max(0, Number(overrides[c.key] ?? qty) || 0),
          })),
        },
      });
      toast.success(t('common.saved'));
      router.replace(`/products/${p.id}`);
    } catch (e) {
      toast.error(errorText(e, t));
      setBusy(false);
    }
  }

  const Next = locale === 'ar' ? ChevronLeft : ChevronRight;
  const Prev = locale === 'ar' ? ChevronRight : ChevronLeft;
  const steps = [t('quick.s1'), t('quick.s2'), t('quick.s3')];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ol className="flex items-center gap-2" aria-label={t('quick.title')}>
        {steps.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold', step > i + 1 ? 'bg-gold text-white' : step === i + 1 ? 'bg-charcoal text-ivory' : 'bg-muted text-muted-foreground')}>
              {step > i + 1 ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn('hidden h-px flex-1 sm:block', step > i + 1 ? 'bg-gold' : 'bg-border')} />
          </li>
        ))}
      </ol>
      <Card>
        <CardContent className="space-y-6 p-6 md:p-8">
          <div>
            <p className="text-xs text-muted-foreground">{t('quick.step')} {step} {t('quick.of')} 3</p>
            <h2 className="mt-1 font-display text-2xl">{steps[step - 1]}</h2>
          </div>

          {step === 1 && (
            <>
              <Field label={t('quick.name')}><Input autoFocus className="h-12 text-base" placeholder={t('quick.namePh')} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !problem && setStep(2)} /></Field>
              {(categories.data?.length ?? 0) > 0 && (
                <Field label={t('quick.category')}>
                  <Select className="h-12" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">—</option>
                    {categories.data!.map((c) => <option key={c.id} value={c.id}>{locale === 'en' && c.nameEn ? c.nameEn : c.nameAr}</option>)}
                  </Select>
                </Field>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-3"><Label>{t('quick.sizes')}</Label><ChipPicker ltr options={[...SIZES.map((s) => ({ value: s })), { value: freeSize }]} value={sizes} onChange={setSizes} addLabel={t('quick.otherSize')} /></div>
              <div className="space-y-3"><Label>{t('quick.colors')}</Label><ChipPicker options={COLORS.map((c) => ({ value: locale === 'ar' ? c.ar : c.en, swatch: c.hex }))} value={colors} onChange={setColors} addLabel={t('quick.otherColor')} /></div>
              <div className="space-y-3"><Label>{t('quick.lengths')}</Label><ChipPicker ltr options={LENGTHS.map((l) => ({ value: l, label: `${l}″` }))} value={lengths} onChange={setLengths} addLabel={t('quick.otherLength')} /></div>
              <p className={cn('text-sm', combos.length > 60 ? 'text-amber-800' : 'text-muted-foreground')}>{combos.length} {t('quick.options')}{combos.length > 60 ? ` — ${t('quick.tooMany')}` : ''}</p>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('quick.price')} hint={me?.tenant.vatEnabled ? (me.tenant.pricesIncludeVat ? t('products.inclVat') : t('products.exclVat')) : undefined}>
                  <Input autoFocus type="number" inputMode="decimal" min={0} step="0.01" className="h-12 text-lg" value={price} onChange={(e) => setPrice(e.target.value)} />
                </Field>
                <Field label={t('quick.qty')} hint={t('quick.qtyHint')}><Input type="number" inputMode="numeric" min={0} className="h-12 text-lg" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
              </div>
              <div className="max-h-80 overflow-y-auto rounded-xl border">
                {combos.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3 border-b px-4 py-2 last:border-0">
                    <span className="flex items-center gap-2 text-sm">
                      {hexOf(c.color) && <span className="size-3.5 rounded-full border border-black/10" style={{ background: hexOf(c.color)! }} />}
                      {c.color} · <b dir="ltr">{c.size}</b>{c.length && <> · <span className="num">{c.length}″</span></>}
                    </span>
                    <Input type="number" min={0} className="h-9 w-20 text-center" value={overrides[c.key] ?? qty} onChange={(e) => setOverrides({ ...overrides, [c.key]: e.target.value })} aria-label={`${c.color} ${c.size} ${c.length}`} />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-3 text-sm"><Switch checked={publish} onCheckedChange={setPublish} />{t('quick.publish')}</label>
              {price && <p className="text-sm text-muted-foreground">{combos.length} {t('quick.options')} × <span className="num">{money(toHalalas(price))}</span></p>}
            </>
          )}

          {problem && step > 0 && <p className="sr-only" role="status">{problem}</p>}
          <div className="flex items-center justify-between gap-3 border-t pt-5">
            {step > 1 ? <Button variant="ghost" onClick={() => setStep(step - 1)}><Prev />{t('common.back')}</Button> : <span />}
            {step < 3
              ? <Button size="lg" onClick={() => (problem ? toast.error(problem) : setStep(step + 1))}>{t('common.next')}<Next /></Button>
              : <Button size="lg" variant="gold" loading={busy} onClick={() => (problem ? toast.error(problem) : save())}><Check />{t('quick.save')}</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
