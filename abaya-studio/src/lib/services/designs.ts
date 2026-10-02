import { buildSku, normalize, parseConfig, validateConfig } from "../engine/config";
import { priceConfig } from "../engine/pricing";
import { recommendSize, sizeFromLength, CONFIDENCE_LABEL, type SizeInput } from "../engine/size";
import { optionFor } from "../engine/config";
import type { StoreCatalog, DesignConfig } from "../engine/types";
import { randomId } from "../ids";
import type { DesignImage, SavedDesign } from "../models";
import { getRepo } from "../store";
import { ValidationError } from "./catalog";

export function requireValidConfig(catalog: StoreCatalog, input: unknown): DesignConfig {
  const parsed = parseConfig(input);
  if (!parsed) throw new ValidationError("بيانات التصميم غير مكتملة");
  const { valid, issues } = validateConfig(catalog, parsed);
  if (!valid) throw new ValidationError(issues[0]?.message ?? "التصميم غير صالح", issues);
  return parsed;
}

export function sizeFor(catalog: StoreCatalog, config: DesignConfig, input?: SizeInput | null) {
  const cut = optionFor(catalog, "cut", config.cut);
  if (input && Number.isFinite(input.heightCm) && input.heightCm > 100 && input.heightCm < 230) {
    const rec = recommendSize(catalog, { ...input, cut: config.cut, cutName: cut?.name });
    return { size: rec.size, confidence: CONFIDENCE_LABEL[rec.confidence], summary: rec.summary, input };
  }
  const lengthCm = optionFor(catalog, "length", config.length)?.visual?.cm ?? Number(config.length);
  const row = sizeFromLength(catalog, lengthCm);
  return {
    size: row.size,
    confidence: CONFIDENCE_LABEL.medium,
    summary: `بناءً على الطول الذي اخترتِه (${lengthCm} سم)${cut ? ` وقصة «${cut.name}»` : ""}، نقترح مقاس ${row.size}. أجيبي عن أسئلة مساعد المقاس لدقة أعلى.`,
  };
}

export async function createDesign(
  catalog: StoreCatalog,
  rawConfig: unknown,
  opts: { size?: SizeInput | null; images?: DesignImage[]; prompt?: string; status?: SavedDesign["status"] } = {},
): Promise<SavedDesign> {
  const config = requireValidConfig(catalog, rawConfig);
  const repo = await getRepo();
  const now = new Date().toISOString();
  const status = opts.status ?? "saved";
  return repo.createDesign({
    id: randomId("d_"),
    code: `AB${await repo.nextDesignNumber()}`,
    storeId: catalog.storeId,
    config,
    sku: buildSku(catalog, config),
    price: priceConfig(catalog, config),
    size: sizeFor(catalog, config, opts.size),
    images: (opts.images ?? []).filter((i) => typeof i?.url === "string" && i.url.startsWith("/")).slice(0, 4),
    prompt: opts.prompt,
    status,
    createdAt: now,
    updatedAt: now,
    savedAt: status === "saved" ? now : undefined,
  });
}

/** Re-price + re-validate an existing design against the *current* catalog. */
export function refreshDesign(catalog: StoreCatalog, design: SavedDesign) {
  const { config, adjustments } = normalize(catalog, design.config);
  return { config, adjustments, price: priceConfig(catalog, config), sku: buildSku(catalog, config) };
}
