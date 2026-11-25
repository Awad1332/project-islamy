'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ShoppingBag } from 'lucide-react';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@abaya/shared';
import { api, type Paged } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { PageHeader, Pagination } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatusBadge } from '@/components/status';

export default function OrdersPage() {
  const { t, money, date, num } = useI18n();
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ['orders', q, status, paymentStatus, page], queryFn: () => api<Paged<any>>('/orders', { query: { q, status, paymentStatus, page } }) });
  return (
    <>
      <PageHeader title={t('orders.title')} actions={can('orders:write') && <Button asChild><Link href="/orders/new"><Plus />{t('orders.new')}</Link></Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder={t('common.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select className="w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t('common.status')}: {t('common.all')}</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{t(`orders.statuses.${s}`)}</option>)}
        </Select>
        <Select className="w-44" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}>
          <option value="">{t('orders.payment')}: {t('common.all')}</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{t(`orders.paymentStatuses.${s}`)}</option>)}
        </Select>
      </div>
      <QueryState q={list} isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState icon={ShoppingBag} title={t('orders.empty')} description={t('orders.emptySub')} action={can('orders:write') && <Button asChild variant="gold"><Link href="/orders/new"><Plus />{t('orders.new')}</Link></Button>} />}>
        {(d) => (
          <Card>
            <Table>
              <THead><TR><TH>{t('orders.number')}</TH><TH>{t('common.date')}</TH><TH>{t('orders.customer')}</TH><TH>{t('orders.channel')}</TH><TH>{t('orders.items')}</TH><TH>{t('common.total')}</TH><TH>{t('orders.payment')}</TH><TH>{t('common.status')}</TH></TR></THead>
              <TBody>
                {d.items.map((o) => (
                  <TR key={o.id}>
                    <TD><Link href={`/orders/${o.id}`} className="num font-medium text-gold-700 hover:underline">#{o.number}</Link></TD>
                    <TD className="text-xs">{date(o.placedAt, true)}</TD>
                    <TD>{o.customer?.fullName ?? o.shippingName ?? '—'}</TD>
                    <TD className="text-xs">{t(`orders.channels.${o.channel}`)}</TD>
                    <TD className="num">{num(o._count.items)}</TD>
                    <TD className="num font-medium">{money(o.total)}</TD>
                    <TD><StatusBadge ns="orders.paymentStatuses" value={o.paymentStatus} /></TD>
                    <TD><StatusBadge ns="orders.statuses" value={o.status} /></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="p-4"><Pagination page={d.page} pageCount={d.pageCount} total={d.total} onPage={setPage} /></div>
          </Card>
        )}
      </QueryState>
    </>
  );
}
