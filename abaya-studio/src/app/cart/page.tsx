import { CartView } from "@/components/CartView";
import { ToastProvider } from "@/components/ui";
import { readCart } from "@/lib/services/cart";
import { loadCatalog } from "@/lib/services/catalog";
import { getRepo, DEFAULT_STORE } from "@/lib/store";
import { optionFor } from "@/lib/engine/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "السلة" };

export default async function CartPage() {
  const [cart, catalog, repo] = await Promise.all([readCart(DEFAULT_STORE), loadCatalog(DEFAULT_STORE), getRepo()]);
  const items = await Promise.all(
    cart.items.map(async (i) => {
      const d = await repo.getDesignByCode(i.designCode);
      const title = d ? `عباية ${optionFor(catalog, "cut", d.config.cut)?.name ?? ""} · ${optionFor(catalog, "color", d.config.color)?.name ?? ""}` : i.designCode;
      return { ...i, title, image: d?.images.find((x) => x.view === "front")?.url ?? `/api/render?design=${i.designCode}&mode=photo` };
    }),
  );
  return (
    <ToastProvider>
      <CartView items={items} />
    </ToastProvider>
  );
}
