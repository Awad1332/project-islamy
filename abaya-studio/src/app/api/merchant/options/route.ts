import { handler, json, readJson, requireMerchant } from "@/lib/http";
import { loadCatalog, ValidationError } from "@/lib/services/catalog";
import { optionCreateSchema } from "@/lib/services/merchant-schemas";
import { getRepo } from "@/lib/store";
import type { DesignOption, OptionGroup } from "@/lib/engine/types";

export const POST = handler(async (req: Request) => {
  const m = await requireMerchant();
  const parsed = optionCreateSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new ValidationError("بيانات غير صالحة", parsed.error.flatten());
  const d = parsed.data;
  const catalog = await loadCatalog(m.storeId);
  const id = `${d.group}.${d.code}`;
  if (catalog.options.some((o) => o.id === id)) throw new ValidationError("يوجد خيار بنفس الرمز");
  const siblings = catalog.options.filter((o) => o.group === d.group);
  const option: DesignOption = {
    id,
    group: d.group as OptionGroup,
    code: d.code,
    name: d.name,
    nameEn: d.nameEn ?? d.code,
    description: d.description ?? "",
    price: d.price ?? 0,
    available: d.available ?? true,
    sku: d.sku ?? `${d.group.slice(0, 3).toUpperCase()}-${d.code.slice(0, 6).toUpperCase()}`,
    leadTimeDays: d.leadTimeDays ?? 0,
    image: d.image || undefined,
    prompt: d.prompt,
    visual: d.visual,
    incompatibleWith: d.incompatibleWith ?? [],
    compatibleWith: d.compatibleWith ?? [],
    sortOrder: d.sortOrder ?? siblings.length,
  };
  catalog.options.push(option);
  await (await getRepo()).saveCatalog(catalog);
  return json(option, 201);
});
