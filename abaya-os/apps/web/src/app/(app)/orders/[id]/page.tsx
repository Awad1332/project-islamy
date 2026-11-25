'use client';
import Link from 'next/link';
import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Undo2, Wallet } from 'lucide-react';
import { ORDER_TRANSITIONS, PAYMENT_METHODS, type OrderStatus } from '@abaya/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { toHalalas } from '@/lib/utils';
import { PageHeader } from '@/components/page';
import { QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatusBadge } from '@/components/status';
import { Invoice } from '@/components/orders/invoice';

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, money, date } = useI18n();
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['order', id], queryFn: () => api(`/orders/${id}`) });
  const [statusDlg, setStatusDlg] = useState<{ status: OrderStatus; note: string; trackingNumber: string; carrier: string } | null>(null);
  const [pay, setPay] = useState<{ amount: string; method: string; reference: string } | null>(null);
  const [invoice, setInvoice] = useState(false);
  const inv = [['order', id], ['orders'], ['dashboard'], ['inventory']];
  const status = useAction((b: any) => api(`/orders/${id}/status`, { method: 'PATCH', body: b }), { invalidate: inv, onSuccess: () => setStatusDlg(null) });
  const payment = useAction((b: any) => api(`/orders/${id}/payments`, { body: b }), { invalidate: inv, onSuccess: () => setPay(null) });

  return (
    <QueryState q={q}>
      {(o) => {
        const next = ORDER_TRANSITIONS[o.status as OrderStatus];
        const balance = o.total - o.amountPaid;
        return (
          <>
            <PageHeader title={`${t('orders.number')} #${o.number}`} description={date(o.placedAt, true)}
              actions={<>
                <StatusBadge ns="orders.statuses" value={o.status} />
                <StatusBadge ns="orders.paymentStatuses" value={o.paymentStatus} />
                <Button variant="outline" size="sm" onClick={() => setInvoice(true)}><FileText />{t('orders.invoice')}</Button>
                {can('returns:write') && ['SHIPPED', 'DELIVERED'].includes(o.status) && <Button asChild variant="outline" size="sm"><Link href={`/returns/new?orderId=${o.id}`}><Undo2 />{t('orders.createReturn')}</Link></Button>}
              </>} />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <THead><TR><TH>{t('common.name')}</TH><TH>{t('orders.unitPrice')}</TH><TH>{t('orders.quantity')}</TH><TH>{t('orders.vat')}</TH><TH>{t('common.total')}</TH></TR></THead>
                      <TBody>
                        {o.items.map((i: any) => (
                          <TR key={i.id}>
                            <TD><Link href={`/products/${i.variant.productId}`} className="font-medium hover:text-gold-700">{i.productTitle}</Link><div className="text-xs text-muted-foreground">{i.sku} · {i.size} · {i.color}{i.length ? ` · ${i.length}″` : ''}{i.returnedQty ? ` · ↩ ${i.returnedQty}` : ''}</div></TD>
                            <TD className="num">{money(i.unitPrice)}</TD><TD className="num">{i.quantity}</TD><TD className="num">{money(i.vatTotal)}</TD><TD className="num">{money(i.total)}</TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                    <div className="ms-auto max-w-sm space-y-1 p-5 text-sm">
                      <Line k={t('orders.subtotal')} v={money(o.subtotal)} />
                      {o.discountTotal > 0 && <Line k={t('orders.discount')} v={money(o.discountTotal)} />}
                      <Line k={t('orders.shipping')} v={money(o.shippingTotal)} />
                      <Line k={`${t('orders.vat')} (${o.vatRateBps / 100}%)`} v={money(o.vatTotal)} />
                      <Line k={t('orders.total')} v={money(o.total)} bold />
                      <Line k={t('orders.paid')} v={money(o.amountPaid)} />
                      {o.amountRefunded > 0 && <Line k={t('orders.refunded')} v={money(o.amountRefunded)} />}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>{t('orders.timeline')}</CardTitle></CardHeader>
                  <CardContent>
                    <ol className="space-y-3 border-s ps-4">
                      {o.events.map((e: any) => (
                        <li key={e.id} className="relative text-sm">
                          <span className="absolute -start-[21px] top-1.5 size-2.5 rounded-full bg-gold" />
                          <div className="font-medium">{e.type.startsWith('STATUS_') ? t(`orders.statuses.${e.type.slice(7)}`) : e.type.replaceAll('_', ' ').toLowerCase()}</div>
                          <div className="text-xs text-muted-foreground">{date(e.createdAt, true)}{e.message ? ` — ${e.message}` : ''}</div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                {can('orders:write') && (
                  <Card>
                    <CardContent className="space-y-2 pt-5">
                      {next.length > 0 && <p className="text-xs text-muted-foreground">{t('orders.changeStatus')}</p>}
                      <div className="flex flex-wrap gap-2">
                        {next.map((s) => <Button key={s} size="sm" variant={s === 'CANCELLED' ? 'outline' : 'default'} onClick={() => setStatusDlg({ status: s, note: '', trackingNumber: o.trackingNumber ?? '', carrier: o.carrier ?? '' })}>{t(`orders.statuses.${s}`)}</Button>)}
                      </div>
                      {o.status !== 'CANCELLED' && balance > 0 && <Button variant="gold" size="sm" className="w-full" onClick={() => setPay({ amount: String(balance / 100), method: o.paymentMethod ?? 'MADA', reference: '' })}><Wallet />{t('orders.recordPayment')}</Button>}
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader><CardTitle>{t('orders.customer')}</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {o.customer ? <Link href={`/customers/${o.customer.id}`} className="font-medium text-gold-700 hover:underline">{o.customer.fullName}</Link> : <p>{t('orders.walkIn')}</p>}
                    <p className="num">{o.shippingPhone ?? o.customer?.phone ?? ''}</p>
                    <p>{[o.shippingCity, o.shippingDistrict, o.shippingAddress].filter(Boolean).join('، ')}</p>
                    <p className="text-xs text-muted-foreground">{t(`orders.channels.${o.channel}`)}{o.paymentMethod ? ` · ${t(`orders.methods.${o.paymentMethod}`)}` : ''}</p>
                    {o.trackingNumber && <p className="text-xs">{t('orders.tracking')}: <span className="num">{o.trackingNumber}</span> {o.carrier}</p>}
                    {o.giftMessage && <p className="rounded bg-gold-100 p-2 text-xs">🎁 {o.giftMessage}</p>}
                    {o.notes && <p className="text-xs text-muted-foreground">{o.notes}</p>}
                  </CardContent>
                </Card>
                {o.payments.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>{t('orders.payment')}</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {o.payments.map((p: any) => (
                        <div key={p.id} className="flex justify-between"><span>{p.kind === 'REFUND' ? '↩ ' : ''}{t(`orders.methods.${p.method}`, p.method)} <span className="text-xs text-muted-foreground">{date(p.createdAt)}</span></span><span className={`num ${p.kind === 'REFUND' ? 'text-red-700' : ''}`}>{money(p.amount)}</span></div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {o.returns.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>{t('nav.returns')}</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {o.returns.map((r: any) => <Link key={r.id} href={`/returns/${r.id}`} className="flex justify-between hover:text-gold-700"><span>{r.number} · {t(`returns.types.${r.type}`)}</span><StatusBadge ns="returns.statuses" value={r.status} /></Link>)}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <Dialog open={Boolean(statusDlg)} onOpenChange={(v) => !v && setStatusDlg(null)}>
              {statusDlg && (
                <DialogContent title={`${t('orders.changeStatus')}: ${t(`orders.statuses.${statusDlg.status}`)}`}>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); status.mutate({ status: statusDlg.status, note: statusDlg.note || null, trackingNumber: statusDlg.trackingNumber || null, carrier: statusDlg.carrier || null }); }}>
                    {statusDlg.status === 'SHIPPED' && (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label={t('orders.carrier')}><Input value={statusDlg.carrier} onChange={(e) => setStatusDlg({ ...statusDlg, carrier: e.target.value })} placeholder="SMSA / Aramex / SPL" /></Field>
                        <Field label={t('orders.tracking')}><Input dir="ltr" value={statusDlg.trackingNumber} onChange={(e) => setStatusDlg({ ...statusDlg, trackingNumber: e.target.value })} /></Field>
                      </div>
                    )}
                    <Field label={t('common.notes')}><Input value={statusDlg.note} onChange={(e) => setStatusDlg({ ...statusDlg, note: e.target.value })} /></Field>
                    <Button type="submit" variant={statusDlg.status === 'CANCELLED' ? 'destructive' : 'default'} loading={status.isPending}>{t('common.save')}</Button>
                  </form>
                </DialogContent>
              )}
            </Dialog>
            <Dialog open={Boolean(pay)} onOpenChange={(v) => !v && setPay(null)}>
              {pay && (
                <DialogContent title={t('orders.recordPayment')} description={t('orders.manualPaymentNote')}>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); payment.mutate({ amount: toHalalas(pay.amount), method: pay.method, reference: pay.reference || null }); }}>
                    <Field label={`${t('orders.amount')} (${t('common.sar')})`} error={payment.errors.amount}><Input type="number" step="0.01" min={0.01} required value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
                    <Field label={t('orders.paymentMethod')}><Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{t(`orders.methods.${m}`)}</option>)}</Select></Field>
                    <Field label={t('orders.reference')}><Input dir="ltr" value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
                    <Button type="submit" loading={payment.isPending}>{t('common.save')}</Button>
                  </form>
                </DialogContent>
              )}
            </Dialog>
            <Dialog open={invoice} onOpenChange={setInvoice}>
              {invoice && <DialogContent wide title={t('orders.invoice')}><Invoice orderId={o.id} /></DialogContent>}
            </Dialog>
          </>
        );
      }}
    </QueryState>
  );
}
function Line({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? 'border-t pt-1 font-semibold' : ''}`}><span className="text-muted-foreground">{k}</span><span className="num">{v}</span></div>;
}
