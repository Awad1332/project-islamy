import { dailySeries, distribution, inWindow, kpis, movers, topCombinations, comboConversion, type DesignFact } from "../engine/analytics";
import type { OptionGroup, StoreCatalog } from "../engine/types";
import { getRepo } from "../store";

export async function loadFacts(storeId: string): Promise<DesignFact[]> {
  const designs = await (await getRepo()).allDesigns(storeId);
  return designs.map((d) => ({ config: d.config, total: d.price.total, createdAt: d.createdAt, cartAddedAt: d.cartAddedAt, orderedAt: d.orderedAt }));
}

export async function overview(catalog: StoreCatalog, days = 30) {
  const facts = await loadFacts(catalog.storeId);
  const cur = inWindow(facts, days);
  const prev = inWindow(facts, days, Date.now(), days);
  return {
    current: kpis(cur),
    previous: kpis(prev),
    series: dailySeries(cur, days),
    top: topCombinations(catalog, cur, 1)[0] ?? null,
  };
}

export const INSIGHT_GROUPS: { group: OptionGroup; title: string }[] = [
  { group: "cut", title: "أكثر القصات اختيارًا" },
  { group: "length", title: "أكثر الأطوال" },
  { group: "color", title: "أكثر الألوان" },
  { group: "fabric", title: "أكثر الخامات" },
  { group: "sleeve", title: "أكثر الأكمام" },
  { group: "embroidery", title: "التطريز" },
  { group: "extra", title: "أكثر الإضافات" },
  { group: "neckline", title: "الرقبة" },
  { group: "closure", title: "الإغلاق" },
];

export async function insights(catalog: StoreCatalog, days = 30) {
  const facts = inWindow(await loadFacts(catalog.storeId), days);
  return {
    n: facts.length,
    groups: INSIGHT_GROUPS.map((g) => ({ ...g, shares: distribution(catalog, facts, g.group) })),
  };
}

export async function trendLab(catalog: StoreCatalog, days = 30) {
  const all = await loadFacts(catalog.storeId);
  const cur = inWindow(all, days);
  const prev = inWindow(all, days, Date.now(), days);
  const combos = topCombinations(catalog, cur, 3).map((c) => ({ ...c, conversion: comboConversion(cur, c.key) }));
  return { n: cur.length, overall: kpis(cur), combos, movers: movers(catalog, cur, prev, 6) };
}
