import { buildSku, parseConfig, select, validateConfig } from "@/lib/engine/config";
import { priceConfig } from "@/lib/engine/pricing";
import { GROUP_ORDER, type OptionGroup } from "@/lib/engine/types";
import { handler, json, readJson } from "@/lib/http";
import { loadCatalog, ValidationError } from "@/lib/services/catalog";

/**
 * Server-authoritative configuration endpoint (used by integrations such as a
 * Salla/Shopify app). Optionally applies one selection, then validates & prices.
 */
export const POST = handler(async (req: Request) => {
  const body = await readJson(req);
  const catalog = await loadCatalog(body.store as string);
  let config = parseConfig(body.config);
  if (!config) throw new ValidationError("بيانات التصميم غير مكتملة");
  let adjustments: unknown[] = [];
  const sel = body.select as { group?: string; code?: string } | undefined;
  if (sel?.group && sel.code && GROUP_ORDER.includes(sel.group as OptionGroup)) {
    const r = select(catalog, config, sel.group as OptionGroup, String(sel.code));
    if (!r.ok) return json({ ok: false, reason: r.reason }, 409);
    config = r.config;
    adjustments = r.adjustments.map((a) => a.message);
  }
  const validation = validateConfig(catalog, config);
  return json({
    ok: validation.valid,
    config,
    adjustments,
    issues: validation.issues,
    price: priceConfig(catalog, config),
    sku: buildSku(catalog, config),
  });
});
