'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Undo2 } from 'lucide-react';
import { RETURN_STATUSES } from '@abaya/shared';
import { api, type Paged } from '@/lib/api';
import { useI18n } from '@/i18n';
import { PageHeader, Pagination } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Input, Select } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { StatusBadge } from '@/components/status';

export default function ReturnsPage() {
  const { t, date } = useI18n();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ['returns', q, status, page], queryFn: () => api<Paged<any>>('/returns', { query: { q, status, page } }) });
  return (
    <>
      <PageHeader title={t('returns.title')} description={t('returns.selectOrder')} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder={t('common.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select className="w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t('common.all')}</option>
          {RETURN_STATUSES.map((s) => <option key={s} value={s}>{t(`returns.statuses.${s}`)}</option>)}
        </Select>
      </div>
      <QueryState q={list} isEmpty={(d) => d.items.length === 0} empty={<EmptyState icon={Undo2} title={t('returns.empty')} />}>
        {(d) => (
          <Card>
            <Table>
              <THead><TR><TH>#</TH><TH>{t('common.date')}</TH><TH>{t('returns.order')}</TH><TH>{t('orders.customer')}</TH><TH>{t('returns.type')}</TH><TH>{t('returns.reason')}</TH><TH>{t('common.status')}</TH></TR></THead>
              <TBody>
                {d.items.map((r) => (
                  <TR key={r.id}>
                    <TD><Link href={`/returns/${r.id}`} className="font-medium text-gold-700 hover:underline">{r.number}</Link></TD>
                    <TD className="text-xs">{date(r.createdAt)}</TD>
                    <TD className="num">#{r.order.number}</TD>
                    <TD>{r.order.customer?.fullName ?? '—'}</TD>
                    <TD>{t(`returns.types.${r.type}`)}</TD>
                    <TD className="text-xs">{t(`returns.reasons.${r.reason}`)}</TD>
                    <TD><StatusBadge ns="returns.statuses" value={r.status} /></TD>
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
