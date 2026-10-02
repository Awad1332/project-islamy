import { handler, json, readJson } from "@/lib/http";
import { getRepo } from "@/lib/store";
import { loadCatalog, NotFoundError } from "@/lib/services/catalog";
import { requireValidConfig, sizeFor } from "@/lib/services/designs";
import { buildSku } from "@/lib/engine/config";
import { priceConfig } from "@/lib/engine/pricing";
import type { SizeInput } from "@/lib/engine/size";
import type { DesignImage, SavedDesign } from "@/lib/models";

/** Designs in a cart or an order are immutable so prices stay consistent. */
const isLocked = (d: SavedDesign) => d.status === "ordered" || d.status === "in_cart";

type Ctx = { params: Promise<{ code: string }> };

export const GET = handler(async (_req: Request, ctx: Ctx) => {
  const { code } = await ctx.params;
  const design = await (await getRepo()).getDesignByCode(code);
  if (!design) throw new NotFoundError("التصميم غير موجود");
  return json(design);
});

/** Update a design (re-validated & re-priced). Used by "صمميها مرة ثانية" and save. */
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const { code } = await ctx.params;
  const repo = await getRepo();
  const design = await repo.getDesignByCode(code);
  if (!design) throw new NotFoundError("التصميم غير موجود");
  if (isLocked(design)) return json({ error: "لا يمكن تعديل تصميم في السلة أو تم طلبه" }, 409);
  const catalog = await loadCatalog(design.storeId);
  const body = await readJson(req);
  const patch: Partial<SavedDesign> = {};
  if (body.config) {
    const config = requireValidConfig(catalog, body.config);
    Object.assign(patch, { config, price: priceConfig(catalog, config), sku: buildSku(catalog, config) });
  }
  const cfg = patch.config ?? design.config;
  if (body.size !== undefined || patch.config) {
    patch.size = sizeFor(catalog, cfg, (body.size as SizeInput) ?? design.size?.input ?? null);
  }
  if (Array.isArray(body.images)) {
    patch.images = (body.images as DesignImage[]).filter((i) => typeof i?.url === "string" && i.url.startsWith("/")).slice(0, 4);
  }
  if (typeof body.prompt === "string") patch.prompt = body.prompt.slice(0, 2000);
  if (body.status === "saved" && design.status === "draft") Object.assign(patch, { status: "saved", savedAt: new Date().toISOString() });
  return json(await repo.updateDesign(code, patch));
});
