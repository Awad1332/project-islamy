'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Paged } from '@/lib/api';
import { useI18n } from '@/i18n';
import { PageHeader, Pagination } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Card } from '@/components/ui/card';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';

export default function AuditPage() {
  const { t, date } = useI18n();
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['audit', page], queryFn: () => api<Paged<any>>('/audit-log', { query: { page, pageSize: 30 } }) });
  return (
    <>
      <PageHeader title={t('audit.title')} />
      <QueryState q={q} isEmpty={(d) => d.items.length === 0} empty={<EmptyState title={t('marketing.empty')} />}>
        {(d) => (
          <Card>
            <Table>
              <THead><TR><TH>{t('common.date')}</TH><TH>{t('audit.user')}</TH><TH>{t('audit.action')}</TH><TH>{t('audit.entity')}</TH></TR></THead>
              <TBody>{d.items.map((a) => <TR key={a.id}><TD className="text-xs">{date(a.createdAt, true)}</TD><TD>{a.userName ?? '—'}</TD><TD dir="ltr" className="text-xs font-medium">{a.action}</TD><TD dir="ltr" className="text-xs text-muted-foreground">{a.entityType}{a.metadata ? ` ${JSON.stringify(a.metadata).slice(0, 80)}` : ''}</TD></TR>)}</TBody>
            </Table>
            <div className="p-4"><Pagination page={d.page} pageCount={d.pageCount} total={d.total} onPage={setPage} /></div>
          </Card>
        )}
      </QueryState>
    </>
  );
}
