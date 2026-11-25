'use client';
import { useI18n } from '@/i18n';
import { PageHeader } from '@/components/page';
import { ProductForm } from '@/components/products/product-form';

export default function NewProduct() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t('products.new')} />
      <ProductForm />
    </>
  );
}
