'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PackageOpen, Plus } from 'lucide-react';
import { PRODUCT_STATUSES } from '@abaya/shared';
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
import { attrLabel } from '@/i18n/attrs';

export default function ProductsPage() {
  const { t, money, num, locale } = useI18n();
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ['products', q, status, page], queryFn: () => api<Paged<any>>('/products', { query: { q, status, page } }) });

  return (
    <>
      <PageHeader title={t('products.title')} actions={can('catalog:write') && <Button asChild><Link href="/products/new"><Plus />{t('products.new')}</Link></Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder={t('common.search')} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <Select className="w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">{t('common.all')}</option>
          {PRODUCT_STATUSES.map((s) => <option key={s} value={s}>{t(`products.statuses.${s}`)}</option>)}
        </Select>
      </div>
      <QueryState q={list} isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState icon={PackageOpen} title={t('products.empty')} description={t('products.emptySub')} action={can('catalog:write') && <Button asChild variant="gold"><Link href="/products/new"><Plus />{t('products.new')}</Link></Button>} />}>
        {(d) => (
          <Card>
            <Table>
              <THead><TR><TH>{t('common.name')}</TH><TH>{t('products.cut')}</TH><TH>{t('products.price')}</TH><TH>{t('products.stock')}</TH><TH>{t('common.status')}</TH></TR></THead>
              <TBody>
                {d.items.map((p) => (
                  <TR key={p.id}>
                    <TD>
                      <Link href={`/products/${p.id}`} className="flex items-center gap-3">
                        <div className="size-12 shrink-0 overflow-hidden rounded-md bg-beige-100">{p.image && <img src={p.image} alt="" className="size-full object-cover" />}</div>
                        <div>
                          <div className="font-medium hover:text-gold-700">{locale === 'en' && p.titleEn ? p.titleEn : p.titleAr}</div>
                          <div className="text-xs text-muted-foreground">{num(p.variantCount)} {t('products.variantCount')}{p.category ? ` · ${locale === 'en' && p.category.nameEn ? p.category.nameEn : p.category.nameAr}` : ''}</div>
                        </div>
                      </Link>
                    </TD>
                    <TD>{attrLabel('cut', p.cut, locale)} · {attrLabel('fabric', p.fabric, locale)}</TD>
                    <TD className="num">{p.minPrice === p.maxPrice ? money(p.minPrice) : `${money(p.minPrice)} – ${money(p.maxPrice)}`}</TD>
                    <TD className="num">{num(p.stock)}</TD>
                    <TD><StatusBadge ns="products.statuses" value={p.status} /></TD>
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
