import { handler, json, readJson, requireMerchant } from "@/lib/http";
import { loadCatalog, ValidationError } from "@/lib/services/catalog";
import { catalogSettingsSchema } from "@/lib/services/merchant-schemas";
import { getRepo } from "@/lib/store";

export const GET = handler(async () => {
  const m = await requireMerchant();
  return json(await loadCatalog(m.storeId));
});

export const PATCH = handler(async (req: Request) => {
  const m = await requireMerchant();
  const parsed = catalogSettingsSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new ValidationError("بيانات غير صالحة", parsed.error.flatten());
  const catalog = await loadCatalog(m.storeId);
  const next = { ...catalog, ...parsed.data };
  await (await getRepo()).saveCatalog(next);
  return json(next);
});
