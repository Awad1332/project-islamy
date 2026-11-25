'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useI18n } from '@/i18n';
import { PageHeader } from '@/components/page';
import { QueryState } from '@/components/states';
import { ProductForm } from '@/components/products/product-form';
import { StatusBadge } from '@/components/status';

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, locale } = useI18n();
  const q = useQuery({ queryKey: ['product', id], queryFn: () => api(`/products/${id}`) });
  return (
    <QueryState q={q}>
      {(p) => (
        <>
          <PageHeader title={locale === 'en' && p.titleEn ? p.titleEn : p.titleAr} actions={<StatusBadge ns="products.statuses" value={p.status} />} />
          <ProductForm key={p.updatedAt} product={p} />
        </>
      )}
    </QueryState>
  );
}
