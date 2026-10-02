import { handler, json, readJson, requireMerchant } from "@/lib/http";
import { loadCatalog, NotFoundError, ValidationError } from "@/lib/services/catalog";
import { optionPatchSchema } from "@/lib/services/merchant-schemas";
import { getRepo } from "@/lib/store";
import { SINGLE_GROUPS, type SingleGroup } from "@/lib/engine/types";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const m = await requireMerchant();
  const { id } = await ctx.params;
  const parsed = optionPatchSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new ValidationError("بيانات غير صالحة", parsed.error.flatten());
  const catalog = await loadCatalog(m.storeId);
  const option = catalog.options.find((o) => o.id === id);
  if (!option) throw new NotFoundError("الخيار غير موجود");
  const patch = parsed.data;
  const known = new Set(catalog.options.map((o) => o.id));
  for (const ref of [...(patch.incompatibleWith ?? []), ...(patch.compatibleWith ?? [])]) {
    if (!known.has(ref) || ref === id) throw new ValidationError(`مرجع غير صالح: ${ref}`);
  }
  Object.assign(option, { ...patch, image: patch.image === "" ? undefined : (patch.image ?? option.image) });
  // A single-select group must keep at least one available option.
  if (SINGLE_GROUPS.includes(option.group as SingleGroup) && !catalog.options.some((o) => o.group === option.group && o.available)) {
    throw new ValidationError("يجب إبقاء خيار واحد متوفر على الأقل في هذه المجموعة");
  }
  await (await getRepo()).saveCatalog(catalog);
  return json(option);
});

export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const m = await requireMerchant();
  const { id } = await ctx.params;
  const catalog = await loadCatalog(m.storeId);
  const option = catalog.options.find((o) => o.id === id);
  if (!option) throw new NotFoundError("الخيار غير موجود");
  const rest = catalog.options.filter((o) => o.id !== id);
  if (option.group !== "extra" && !rest.some((o) => o.group === option.group)) {
    throw new ValidationError("لا يمكن حذف آخر خيار في المجموعة");
  }
  for (const o of rest) {
    o.incompatibleWith = o.incompatibleWith.filter((x) => x !== id);
    o.compatibleWith = o.compatibleWith.filter((x) => x !== id);
  }
  await (await getRepo()).saveCatalog({ ...catalog, options: rest });
  return json({ ok: true });
});
