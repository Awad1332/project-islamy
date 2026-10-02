import { buildSku, optionFor, selectedOptions } from "../engine/config";
import { priceConfig } from "../engine/pricing";
import { GROUP_META, type DesignConfig, type StoreCatalog } from "../engine/types";
import { randomId } from "../ids";
import type { ProductTemplate, SavedDesign } from "../models";
import { getRepo } from "../store";
import { createDesign } from "./designs";
import { NotFoundError } from "./catalog";

export function productName(catalog: StoreCatalog, config: DesignConfig): string {
  const n = (g: Parameters<typeof optionFor>[1], c: string) => optionFor(catalog, g, c)?.name ?? c;
  const parts = [`عباية ${n("cut", config.cut)}`, n("color", config.color)];
  if (config.embroidery !== "none") parts.push(n("embroidery", config.embroidery));
  return parts.join(" · ");
}

function renderUrl(storeId: string, config: DesignConfig, view: "front" | "back") {
  const q = new URLSearchParams({ store: storeId, c: Buffer.from(JSON.stringify(config)).toString("base64url"), view, mode: "photo" });
  return `/api/render?${q}`;
}

export function buildProductTemplate(catalog: StoreCatalog, design: SavedDesign): ProductTemplate {
  const config = design.config;
  const price = priceConfig(catalog, config);
  const comps = selectedOptions(catalog, config);
  const now = new Date().toISOString();
  const images = design.images.length
    ? design.images.map((i) => i.url)
    : [renderUrl(catalog.storeId, config, "front"), renderUrl(catalog.storeId, config, "back")];
  return {
    id: randomId("p_"),
    storeId: catalog.storeId,
    sourceDesignCode: design.code,
    name: productName(catalog, config),
    description: comps
      .filter((o) => o.group !== "length")
      .map((o) => `${GROUP_META[o.group].label}: ${o.name}`)
      .join(" — "),
    images,
    price: price.total,
    sku: buildSku(catalog, config),
    sizes: catalog.sizeChart.map((r) => r.size),
    components: comps.map((o) => ({ group: o.group, optionId: o.id, name: o.name, sku: o.sku, price: o.price })),
    config,
    leadTimeDays: price.leadTimeDays,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

export async function convertDesignToProduct(catalog: StoreCatalog, code: string): Promise<ProductTemplate> {
  const repo = await getRepo();
  const design = await repo.getDesignByCode(code);
  if (!design || design.storeId !== catalog.storeId) throw new NotFoundError("التصميم غير موجود");
  const product = buildProductTemplate(catalog, design);
  await repo.saveProduct(product);
  return product;
}

export async function convertConfigToProduct(catalog: StoreCatalog, config: DesignConfig): Promise<ProductTemplate> {
  const design = await createDesign(catalog, config, { status: "draft" });
  return convertDesignToProduct(catalog, design.code);
}
