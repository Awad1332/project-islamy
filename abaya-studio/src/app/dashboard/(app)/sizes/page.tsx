import { PageHeader } from "@/components/dashboard/PageHeader";
import { SizesManager } from "@/components/dashboard/SizesManager";
import { currentMerchant } from "@/lib/services/auth";
import { loadCatalog } from "@/lib/services/catalog";

export default async function Sizes() {
  const m = (await currentMerchant())!;
  const catalog = await loadCatalog(m.storeId);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="جدول المقاسات والقواعد" sub="مساعد المقاس يعتمد على هذه البيانات فقط — لا يحدد الذكاء الاصطناعي المقاس." />
      <SizesManager initial={catalog} />
    </div>
  );
}
