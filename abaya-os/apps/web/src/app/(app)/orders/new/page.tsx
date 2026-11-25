'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { ORDER_CHANNELS, PAYMENT_METHODS, computeTotals } from '@abaya/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { toHalalas } from '@/lib/utils';
import { PageHeader } from '@/components/page';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { VariantPicker } from '@/components/orders/variant-picker';
import { MoreOptions } from '@/components/ui/details';
import { useUiMode } from '@/lib/mode';

export default function NewOrder() {
  const { t, money, locale } = useI18n();
  const { me } = useAuth();
  const { pro } = useUiMode();
  const router = useRouter();
  const [items, setItems] = useState<{ v: any; quantity: number }[]>([]);
  const [customerQ, setCustomerQ] = useState('');
  const [f, setF] = useState({ customerId: '', channel: 'MANUAL', paymentMethod: '', locationId: '', shippingFee: '', discount: '', shippingName: '', shippingPhone: '', shippingCity: '', shippingDistrict: '', shippingAddress: '', notes: '', giftMessage: '' });
  const customers = useQuery({ queryKey: ['customers-pick', customerQ], queryFn: () => api('/customers', { query: { q: customerQ, pageSize: 20 } }) });
  const locations = useQuery({ queryKey: ['locations'], queryFn: () => api<any[]>('/locations') });
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  const preview = useMemo(() => {
    if (!me) return null;
    const t0 = me.tenant;
    const listed = items.reduce((s, i) => s + i.v.price * i.quantity, 0);
    const ship = f.shippingFee !== '' ? toHalalas(f.shippingFee) : t0.freeShippingThreshold != null && listed >= t0.freeShippingThreshold ? 0 : t0.defaultShippingFee;
    return computeTotals(items.map((i) => ({ unitPrice: i.v.price, quantity: i.quantity })), ship, t0 as any, toHalalas(f.discount || 0));
  }, [items, f.shippingFee, f.discount, me]);

  const create = useAction(() => api('/orders', {
    body: {
      customerId: f.customerId || null, channel: f.channel, paymentMethod: f.paymentMethod || null, locationId: f.locationId || null,
      items: items.map((i) => ({ variantId: i.v.id, quantity: i.quantity })),
      ...(f.shippingFee !== '' ? { shippingFee: toHalalas(f.shippingFee) } : {}), discount: toHalalas(f.discount || 0),
      shippingName: f.shippingName || null, shippingPhone: f.shippingPhone || null, shippingCity: f.shippingCity || null, shippingDistrict: f.shippingDistrict || null,
      shippingAddress: f.shippingAddress || null, notes: f.notes || null, giftMessage: f.giftMessage || null,
    },
  }), { invalidate: [['orders'], ['dashboard']], success: t('common.created'), onSuccess: (o: any) => router.replace(`/orders/${o.id}`) });

  function pickCustomer(id: string) {
    const c = customers.data?.items.find((x: any) => x.id === id);
    setF((s) => ({ ...s, customerId: id, shippingName: c?.fullName ?? s.shippingName, shippingPhone: c?.phone ?? s.shippingPhone, shippingCity: c?.city ?? s.shippingCity, shippingDistrict: c?.district ?? s.shippingDistrict, shippingAddress: c?.addressLine ?? s.shippingAddress }));
  }

  return (
    <>
      <PageHeader title={t('orders.new')} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>{t('orders.items')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <VariantPicker onPick={(v) => setItems((xs) => (xs.some((x) => x.v.id === v.id) ? xs.map((x) => (x.v.id === v.id ? { ...x, quantity: x.quantity + 1 } : x)) : [...xs, { v, quantity: 1 }]))} />
              {create.errors.items && <p className="text-sm text-destructive">{create.errors.items}</p>}
              {items.length > 0 && (
                <Table>
                  <THead><TR><TH>{t('common.name')}</TH><TH>{t('orders.unitPrice')}</TH><TH>{t('orders.quantity')}</TH><TH>{t('common.total')}</TH><TH /></TR></THead>
                  <TBody>
                    {items.map((i, idx) => (
                      <TR key={i.v.id}>
                        <TD><div className="font-medium">{locale === 'en' && i.v.product.titleEn ? i.v.product.titleEn : i.v.product.titleAr}</div><div className="text-xs text-muted-foreground">{i.v.sku} · {i.v.size} · {i.v.color}{i.v.length ? ` · ${i.v.length}″` : ''}</div></TD>
                        <TD className="num">{money(i.v.price)}</TD>
                        <TD><Input type="number" min={1} max={i.v.stock || 1} className="h-8 w-20" value={i.quantity} onChange={(e) => setItems((xs) => xs.map((x, j) => (j === idx ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x)))} /></TD>
                        <TD className="num">{money(i.v.price * i.quantity)}</TD>
                        <TD><Button variant="ghost" size="icon" onClick={() => setItems((xs) => xs.filter((_, j) => j !== idx))} aria-label="remove"><X /></Button></TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('orders.shippingInfo')}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label={t('orders.recipient')}><Input value={f.shippingName} onChange={(e) => set('shippingName', e.target.value)} /></Field>
              <Field label={t('orders.phone')} error={create.errors.shippingPhone}><Input dir="ltr" placeholder="05XXXXXXXX" value={f.shippingPhone} onChange={(e) => set('shippingPhone', e.target.value)} /></Field>
              <Field label={t('orders.city')}><Input value={f.shippingCity} onChange={(e) => set('shippingCity', e.target.value)} /></Field>
              <Field label={t('orders.address')} className="sm:col-span-2"><Input value={f.shippingAddress} onChange={(e) => set('shippingAddress', e.target.value)} /></Field>
              <div className="sm:col-span-2">
                <MoreOptions key={String(pro)} label={t('common.moreOptions')} defaultOpen={pro}>
                  <Field label={t('orders.district')}><Input value={f.shippingDistrict} onChange={(e) => set('shippingDistrict', e.target.value)} /></Field>
                  <Field label={t('orders.giftMessage')}><Input value={f.giftMessage} onChange={(e) => set('giftMessage', e.target.value)} /></Field>
                  <Field label={t('common.notes')}><Textarea rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
                </MoreOptions>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-5">
              <Field label={t('orders.customer')}>
                <Input placeholder={t('common.search')} value={customerQ} onChange={(e) => setCustomerQ(e.target.value)} className="mb-2" />
                <Select value={f.customerId} onChange={(e) => pickCustomer(e.target.value)}>
                  <option value="">{t('orders.walkIn')}</option>
                  {customers.data?.items.map((c: any) => <option key={c.id} value={c.id}>{c.fullName}{c.phone ? ` — ${c.phone}` : ''}</option>)}
                </Select>
              </Field>
              <Field label={t('orders.paymentMethod')}><Select value={f.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}><option value="">—</option>{PAYMENT_METHODS.map((c) => <option key={c} value={c}>{t(`orders.methods.${c}`)}</option>)}</Select></Field>
              <MoreOptions key={String(pro)} label={t('common.moreOptions')} defaultOpen={pro}>
              <Field label={t('orders.channel')}><Select value={f.channel} onChange={(e) => set('channel', e.target.value)}>{ORDER_CHANNELS.map((c) => <option key={c} value={c}>{t(`orders.channels.${c}`)}</option>)}</Select></Field>
              <Field label={t('inventory.location')}><Select value={f.locationId} onChange={(e) => set('locationId', e.target.value)}><option value="">{t('inventory.default')}</option>{locations.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={`${t('orders.shipping')} (${t('common.sar')})`}><Input type="number" min={0} step="0.01" placeholder={me ? String(me.tenant.defaultShippingFee / 100) : ''} value={f.shippingFee} onChange={(e) => set('shippingFee', e.target.value)} /></Field>
                <Field label={`${t('orders.discount')} (${t('common.sar')})`}><Input type="number" min={0} step="0.01" value={f.discount} onChange={(e) => set('discount', e.target.value)} /></Field>
              </div>
              </MoreOptions>
            </CardContent>
          </Card>
          {preview && (
            <Card>
              <CardContent className="space-y-2 pt-5 text-sm">
                <Row k={t('orders.subtotal')} v={money(preview.subtotal)} />
                {preview.discountTotal > 0 && <Row k={t('orders.discount')} v={`- ${money(preview.discountTotal)}`} />}
                <Row k={t('orders.shipping')} v={money(preview.shippingTotal)} />
                <Row k={`${t('orders.vat')} (${(me!.tenant.vatEnabled ? me!.tenant.vatRateBps / 100 : 0)}%)`} v={money(preview.vatTotal)} />
                <div className="border-t pt-2"><Row k={t('orders.total')} v={money(preview.total)} bold /></div>
                <Button className="mt-3 w-full" disabled={!items.length} loading={create.isPending} onClick={() => create.mutate(undefined)}>{t('common.create')}</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? 'text-base font-semibold' : ''}`}><span className="text-muted-foreground">{k}</span><span className="num">{v}</span></div>;
}
