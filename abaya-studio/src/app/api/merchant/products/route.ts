import { handler, json, readJson, requireMerchant } from "@/lib/http";
import { loadCatalog } from "@/lib/services/catalog";
import { requireValidConfig } from "@/lib/services/designs";
import { convertConfigToProduct, convertDesignToProduct } from "@/lib/services/products";
import { getRepo } from "@/lib/store";

export const GET = handler(async () => {
  const m = await requireMerchant();
  return json(await (await getRepo()).listProducts(m.storeId));
});

/** "حوّل إلى منتج": from a saved design code, or from a Trend Lab combination. */
export const POST = handler(async (req: Request) => {
  const m = await requireMerchant();
  const body = await readJson(req);
  const catalog = await loadCatalog(m.storeId);
  const product =
    typeof body.designCode === "string"
      ? await convertDesignToProduct(catalog, body.designCode)
      : await convertConfigToProduct(catalog, requireValidConfig(catalog, body.config));
  return json(product, 201);
});
