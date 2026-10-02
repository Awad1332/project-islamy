import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProductsManager } from "@/components/dashboard/ProductsManager";
import { currentMerchant } from "@/lib/services/auth";
import { getRepo } from "@/lib/store";

export default async function Products() {
  const m = (await currentMerchant())!;
  const products = await (await getRepo()).listProducts(m.storeId);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="قوالب المنتجات" sub="منتجات جاهزة أُنشئت من تصميمات العميلات أو من Trend Lab." />
      <ProductsManager initial={products} />
    </div>
  );
}
