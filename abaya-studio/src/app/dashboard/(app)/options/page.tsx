import { OptionsManager } from "@/components/dashboard/OptionsManager";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { currentMerchant } from "@/lib/services/auth";
import { loadCatalog } from "@/lib/services/catalog";

export default async function Options() {
  const m = (await currentMerchant())!;
  const catalog = await loadCatalog(m.storeId);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="خيارات التصميم" sub="الأسماء والأسعار والتوفر وقواعد التوافق — تنعكس فورًا على تجربة العميلة." />
      <OptionsManager initial={catalog} />
    </div>
  );
}
