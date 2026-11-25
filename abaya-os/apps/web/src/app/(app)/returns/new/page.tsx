'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RETURN_REASONS } from '@abaya/shared';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { useAction } from '@/lib/hooks';
import { PageHeader } from '@/components/page';
import { QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { VariantPicker } from '@/components/orders/variant-picker';

function NewReturn() {
  const { t } = useI18n();
  const router = useRouter();
  const orderId = useSearchParams().get('orderId') ?? '';
  const order = useQuery({ queryKey: ['order', orderId], queryFn: () => api(`/orders/${orderId}`), enabled: Boolean(orderId) });
  const [type, setType] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [reason, setReason] = useState('SIZE_TOO_SMALL');
  const [note, setNote] = useState('');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [ex, setEx] = useState<Record<string, any>>({});
  const create = useAction(() => api('/returns', {
    body: {
      orderId, type, reason, reasonNote: note || null,
      items: Object.entries(qty).filter(([, n]) => n > 0).map(([orderItemId, quantity]) => ({ orderItemId, quantity, exchangeVariantId: type === 'EXCHANGE' ? ex[orderItemId]?.id ?? null : null })),
    },
  }), { invalidate: [['returns'], ['order', orderId]], success: t('common.created'), onSuccess: (r: any) => router.replace(`/returns/${r.id}`) });

  if (!orderId) return <p className="text-sm text-muted-foreground">{t('returns.selectOrder')}</p>;
  return (
    <>
      <PageHeader title={t('returns.new')} />
      <QueryState q={order}>
        {(o) => (
          <Card>
            <CardContent className="space-y-5 pt-5">
              <p className="text-sm">{t('returns.order')} <span className="num font-medium">#{o.number}</span> — {o.customer?.fullName ?? ''}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('returns.type')}><Select value={type} onChange={(e) => setType(e.target.value as any)}><option value="RETURN">{t('returns.types.RETURN')}</option><option value="EXCHANGE">{t('returns.types.EXCHANGE')}</option></Select></Field>
                <Field label={t('returns.reason')}><Select value={reason} onChange={(e) => setReason(e.target.value)}>{RETURN_REASONS.map((r) => <option key={r} value={r}>{t(`returns.reasons.${r}`)}</option>)}</Select></Field>
              </div>
              <Field label={t('returns.reasonNote')}><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              <Table>
                <THead><TR><TH>{t('common.name')}</TH><TH>{t('orders.quantity')}</TH>{type === 'EXCHANGE' && <TH>{t('returns.exchangeFor')}</TH>}</TR></THead>
                <TBody>
                  {o.items.map((i: any) => {
                    const max = i.quantity - i.returnedQty;
                    return (
                      <TR key={i.id}>
                        <TD><div className="font-medium">{i.productTitle}</div><div className="text-xs text-muted-foreground">{i.sku} · {i.size} · {i.color}{i.length ? ` · ${i.length}″` : ''}</div></TD>
                        <TD><Input type="number" className="h-8 w-20" min={0} max={max} disabled={max === 0} value={qty[i.id] ?? 0} onChange={(e) => setQty({ ...qty, [i.id]: Math.min(max, Math.max(0, Number(e.target.value))) })} /> <span className="text-xs text-muted-foreground">/ {max}</span></TD>
                        {type === 'EXCHANGE' && <TD className="min-w-[260px]">{ex[i.id] ? <div className="flex items-center justify-between gap-2 text-xs"><span>{ex[i.id].sku} · {ex[i.id].size} · {ex[i.id].color}</span><Button variant="ghost" size="sm" onClick={() => setEx({ ...ex, [i.id]: null })}>×</Button></div> : <VariantPicker onPick={(v) => setEx({ ...ex, [i.id]: v })} />}</TD>}
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
              <Button onClick={() => create.mutate(undefined)} loading={create.isPending} disabled={!Object.values(qty).some((n) => n > 0)}>{t('common.create')}</Button>
            </CardContent>
          </Card>
        )}
      </QueryState>
    </>
  );
}
export default function Page() {
  return <Suspense><NewReturn /></Suspense>;
}
