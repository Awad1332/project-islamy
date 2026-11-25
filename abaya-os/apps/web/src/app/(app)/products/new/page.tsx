'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useI18n } from '@/i18n';
import { useUiMode } from '@/lib/mode';
import { PageHeader } from '@/components/page';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/products/product-form';
import { QuickProduct } from '@/components/products/quick-product';

function NewProduct() {
  const { t } = useI18n();
  const { pro } = useUiMode();
  const params = useSearchParams();
  const advanced = params.get('advanced') === '1' || (pro && params.get('quick') !== '1');
  return (
    <>
      <PageHeader title={t('quick.title')} description={advanced ? undefined : t('quick.sub')}
        actions={<Button asChild variant="outline" size="sm"><Link href={advanced ? '/products/new?quick=1' : '/products/new?advanced=1'}>{advanced ? t('quick.simpleEditor') : t('quick.advanced')}</Link></Button>} />
      {advanced ? <ProductForm /> : <QuickProduct />}
    </>
  );
}
export default function Page() {
  return <Suspense><NewProduct /></Suspense>;
}
