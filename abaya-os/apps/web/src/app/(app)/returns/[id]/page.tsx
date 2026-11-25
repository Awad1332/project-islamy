'use client';
import Link from 'next/link';
import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RETURN_TRANSITIONS, type ReturnStatus } from '@abaya/shared';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatusBadge } from '@/components/status';

export default function ReturnDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, money, date } = useI18n();
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['return', id], queryFn: () => api(`/returns/${id}`) });
  const locations = useQuery({ queryKey: ['locations'], queryFn: () => api<any[]>('/locations') });
  const [dlg, setDlg] = useState<any>(null);
  const act = useAction((b: any) => api(`/returns/${id}/transition`, { body: b }), { invalidate: [['return', id], ['returns'], ['inventory']], onSuccess: () => setDlg(null) });

  return (
    <QueryState q={q}>
      {(r) => {
        const actions = Object.keys(RETURN_TRANSITIONS[r.status as ReturnStatus]);
        return (
          <>
            <PageHeader title={`${t(`returns.types.${r.type}`)} ${r.number}`} description={date(r.createdAt, true)} actions={<StatusBadge ns="returns.statuses" value={r.status} />} />
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardContent className="p-0">
                  <Table>
                    <THead><TR><TH>{t('common.name')}</TH><TH>{t('orders.quantity')}</TH>{r.type === 'EXCHANGE' && <TH>{t('returns.exchangeFor')}</TH>}<TH>{t('common.total')}</TH></TR></THead>
                    <TBody>
                      {r.items.map((i: any) => {
                        const exv = r.exchangeVariants.find((v: any) => v.id === i.exchangeVariantId);
                        return (
                          <TR key={i.id}>
                            <TD><div className="font-medium">{i.orderItem.productTitle}</div><div className="text-xs text-muted-foreground">{i.orderItem.sku} · {i.orderItem.size} · {i.orderItem.color}</div></TD>
                            <TD className="num">{i.quantity}</TD>
                            {r.type === 'EXCHANGE' && <TD className="text-xs">{exv ? `${exv.sku} · ${exv.size} · ${exv.color}${exv.length ? ` · ${exv.length}″` : ''}` : '—'}</TD>}
                            <TD className="num">{money(Math.round((i.orderItem.total / i.orderItem.quantity) * i.quantity))}</TD>
                          </TR>
                        );
                      })}
                    </TBody>
                  </Table>
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>{t('common.details')}</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>{t('returns.order')}: <Link href={`/orders/${r.order.id}`} className="num text-gold-700 hover:underline">#{r.order.number}</Link></p>
                    {r.order.customer && <p>{t('orders.customer')}: <Link href={`/customers/${r.order.customer.id}`} className="text-gold-700 hover:underline">{r.order.customer.fullName}</Link></p>}
                    <p>{t('returns.reason')}: {t(`returns.reasons.${r.reason}`)}</p>
                    {r.reasonNote && <p className="text-muted-foreground">{r.reasonNote}</p>}
                    {r.type === 'RETURN' && <p>{t('returns.refund')}: <span className="num">{money(r.refundAmount)}</span> <span className="text-xs text-muted-foreground">({t('returns.suggested')} {money(r.suggestedRefund)})</span></p>}
                    {r.restocked && <p className="text-emerald-700">✓ {t('returns.restock')}</p>}
                    {r.replacementOrderId && <p>{t('returns.replacement')}: <Link href={`/orders/${r.replacementOrderId}`} className="text-gold-700 hover:underline">{t('common.view')}</Link></p>}
                    {r.resolutionNote && <p className="text-xs text-muted-foreground">{r.resolutionNote}</p>}
                  </CardContent>
                </Card>
                {can('returns:write') && actions.length > 0 && (
                  <Card>
                    <CardContent className="flex flex-wrap gap-2 pt-5">
                      {actions.map((a) => (
                        <Button key={a} size="sm" variant={a === 'REJECT' || a === 'CANCEL' ? 'outline' : 'default'}
                          onClick={() => setDlg({ action: a, restock: true, refundAmount: String(Math.min(r.suggestedRefund, r.order.amountPaid - r.order.amountRefunded) / 100), locationId: '', note: '' })}>
                          {t(`returns.actions.${a}`)}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            <Dialog open={Boolean(dlg)} onOpenChange={(v) => !v && setDlg(null)}>
              {dlg && (
                <DialogContent title={t(`returns.actions.${dlg.action}`)}>
                  <form className="space-y-4" onSubmit={(e) => {
                    e.preventDefault();
                    act.mutate({ action: dlg.action, restock: dlg.restock, locationId: dlg.locationId || null, note: dlg.note || null, ...(dlg.action === 'COMPLETE' && r.type === 'RETURN' ? { refundAmount: toHalalas(dlg.refundAmount) } : {}) });
                  }}>
                    {dlg.action === 'RECEIVE' && (
                      <>
                        <label className="flex items-center gap-2 text-sm"><Switch checked={dlg.restock} onCheckedChange={(v) => setDlg({ ...dlg, restock: v })} />{t('returns.restock')}</label>
                        {dlg.restock && <Field label={t('inventory.location')}><Select value={dlg.locationId} onChange={(e) => setDlg({ ...dlg, locationId: e.target.value })}><option value="">{t('inventory.default')}</option>{locations.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>}
                      </>
                    )}
                    {dlg.action === 'COMPLETE' && r.type === 'RETURN' && (
                      <Field label={`${t('returns.refund')} (${t('common.sar')})`} hint={t('orders.manualPaymentNote')} error={act.errors.refundAmount}>
                        <Input type="number" step="0.01" min={0} value={dlg.refundAmount} onChange={(e) => setDlg({ ...dlg, refundAmount: e.target.value })} />
                      </Field>
                    )}
                    <Field label={t('common.notes')}><Input value={dlg.note} onChange={(e) => setDlg({ ...dlg, note: e.target.value })} /></Field>
                    <Button type="submit" loading={act.isPending}>{t('common.save')}</Button>
                  </form>
                </DialogContent>
              )}
            </Dialog>
          </>
        );
      }}
    </QueryState>
  );
}
