import { Studio } from "@/components/studio/Studio";
import { ToastProvider } from "@/components/ui";
import { loadCatalog } from "@/lib/services/catalog";
import { getRepo } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "صممي عبايتك" };

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ design?: string; store?: string }> }) {
  const sp = await searchParams;
  const initialDesign = sp.design ? await (await getRepo()).getDesignByCode(sp.design) : null;
  const catalog = await loadCatalog(initialDesign?.storeId ?? sp.store);
  return (
    <ToastProvider>
      <Studio catalog={catalog} initialDesign={initialDesign} />
    </ToastProvider>
  );
}
