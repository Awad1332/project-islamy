'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { api, type Paged } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/i18n';
import { PageHeader, Pagination } from '@/components/page';
import { EmptyState, QueryState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { CustomerDialog } from '@/components/customers/customer-dialog';

export default function CustomersPage() {
  const { t, money, num, date } = useI18n();
  const { can } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (new URLSearchParams(window.location.search).get('new') === '1') setOpen(true); }, []);
  const list = useQuery({ queryKey: ['customers', q, tag, page], queryFn: () => api<Paged<any>>('/customers', { query: { q, tag, page } }) });
  const tags = useQuery({ queryKey: ['customer-tags'], queryFn: () => api<{ tag: string; count: number }[]>('/customers/tags') });
  return (
    <>
      <PageHeader title={t('customers.title')} actions={can('customers:write') && <Button onClick={() => setOpen(true)}><Plus />{t('customers.new')}</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder={t('common.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select className="w-44" value={tag} onChange={(e) => { setTag(e.target.value); setPage(1); }}>
          <option value="">{t('customers.tags')}: {t('common.all')}</option>
          {tags.data?.map((x) => <option key={x.tag} value={x.tag}>{x.tag} ({x.count})</option>)}
        </Select>
      </div>
      <QueryState q={list} isEmpty={(d) => d.items.length === 0} empty={<EmptyState icon={Users} title={t('customers.empty')} action={can('customers:write') && <Button variant="gold" onClick={() => setOpen(true)}><Plus />{t('customers.new')}</Button>} />}>
        {(d) => (
          <Card>
            <Table>
              <THead><TR><TH>{t('customers.fullName')}</TH><TH>{t('customers.phone')}</TH><TH>{t('customers.city')}</TH><TH>{t('customers.orders')}</TH><TH>{t('customers.spent')}</TH><TH>{t('customers.lastOrder')}</TH></TR></THead>
              <TBody>
                {d.items.map((c) => (
                  <TR key={c.id}>
                    <TD><Link href={`/customers/${c.id}`} className="font-medium hover:text-gold-700">{c.fullName}</Link> <span className="ms-1">{c.tags.slice(0, 3).map((x: string) => <Badge key={x} variant={x === 'vip' ? 'gold' : 'secondary'} className="ms-1">{x}</Badge>)}</span></TD>
                    <TD dir="ltr" className="text-xs">{c.phone ?? '—'}</TD>
                    <TD>{c.city ?? '—'}</TD>
                    <TD className="num">{num(c.ordersCount)}</TD>
                    <TD className="num">{money(c.totalSpent)}</TD>
                    <TD className="text-xs">{c.lastOrderAt ? date(c.lastOrderAt) : '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="p-4"><Pagination page={d.page} pageCount={d.pageCount} total={d.total} onPage={setPage} /></div>
          </Card>
        )}
      </QueryState>
      {open && <CustomerDialog open={open} onOpenChange={setOpen} onSaved={(c) => router.push(`/customers/${c.id}`)} />}
    </>
  );
}
