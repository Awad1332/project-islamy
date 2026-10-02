import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/Nav";
import { ToastProvider } from "@/components/ui";
import { currentMerchant } from "@/lib/services/auth";
import { loadCatalog } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const m = await currentMerchant();
  if (!m) redirect("/dashboard/login");
  const catalog = await loadCatalog(m.storeId);
  return (
    <ToastProvider>
      <div className="min-h-dvh bg-paper lg:flex">
        <DashboardNav storeName={catalog.storeName} email={m.email} />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
