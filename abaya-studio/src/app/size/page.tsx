import { ToastProvider } from "@/components/ui";
import { SizePage } from "@/components/SizePage";
import { loadCatalog } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "ساعديني أختار مقاسي" };

export default async function Page({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const catalog = await loadCatalog((await searchParams).store);
  return (
    <ToastProvider>
      <SizePage catalog={catalog} />
    </ToastProvider>
  );
}
