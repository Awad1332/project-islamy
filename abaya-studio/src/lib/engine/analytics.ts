/**
 * Preference analytics + Trend Lab, computed from saved designs.
 * Pure functions so they can move to SQL/warehouse later unchanged.
 */
import { optionFor } from "./config";
import { GROUP_META, SINGLE_GROUPS, type DesignConfig, type OptionGroup, type StoreCatalog } from "./types";

export interface DesignFact {
  config: DesignConfig;
  total: number;
  createdAt: string;
  cartAddedAt?: string;
  orderedAt?: string;
}

export interface Share {
  code: string;
  name: string;
  count: number;
  pct: number;
}

export interface Kpis {
  designs: number;
  addedToCart: number;
  ordered: number;
  avgValue: number;
  cartRate: number;
  orderRate: number;
}

const DAY = 86_400_000;

export function inWindow<T extends { createdAt: string }>(facts: T[], days: number, now = Date.now(), offsetDays = 0): T[] {
  const end = now - offsetDays * DAY;
  const start = end - days * DAY;
  return facts.filter((f) => {
    const t = Date.parse(f.createdAt);
    return t > start && t <= end;
  });
}

export function kpis(facts: DesignFact[]): Kpis {
  const designs = facts.length;
  const addedToCart = facts.filter((f) => f.cartAddedAt || f.orderedAt).length;
  const ordered = facts.filter((f) => f.orderedAt).length;
  const avgValue = designs ? Math.round(facts.reduce((s, f) => s + f.total, 0) / designs) : 0;
  return {
    designs,
    addedToCart,
    ordered,
    avgValue,
    cartRate: designs ? addedToCart / designs : 0,
    orderRate: designs ? ordered / designs : 0,
  };
}

export function distribution(catalog: StoreCatalog, facts: DesignFact[], group: OptionGroup): Share[] {
  const counts = new Map<string, number>();
  for (const f of facts) {
    const codes = group === "extra" ? f.config.extras : [f.config[group as Exclude<OptionGroup, "extra">]];
    for (const c of codes) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const n = facts.length || 1;
  return [...counts.entries()]
    .map(([code, count]) => ({ code, name: optionFor(catalog, group, code)?.name ?? code, count, pct: count / n }))
    .sort((a, b) => b.count - a.count);
}

export interface Combination {
  key: string;
  parts: { group: OptionGroup; label: string; name: string }[];
  count: number;
  pct: number;
  config: DesignConfig;
}

const COMBO_GROUPS: OptionGroup[] = ["cut", "length", "color", "sleeve", "embroidery"];

export function topCombinations(catalog: StoreCatalog, facts: DesignFact[], limit = 3): Combination[] {
  const map = new Map<string, { count: number; config: DesignConfig }>();
  for (const f of facts) {
    const key = COMBO_GROUPS.map((g) => f.config[g as Exclude<OptionGroup, "extra">]).join("|");
    const cur = map.get(key);
    map.set(key, { count: (cur?.count ?? 0) + 1, config: cur?.config ?? f.config });
  }
  const n = facts.length || 1;
  return [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([key, { count, config }]) => ({
      key,
      count,
      pct: count / n,
      config,
      parts: COMBO_GROUPS.map((g) => {
        const code = config[g as Exclude<OptionGroup, "extra">];
        return { group: g, label: GROUP_META[g].label, name: optionFor(catalog, g, code)?.name ?? code };
      }),
    }));
}

export interface Mover {
  group: OptionGroup;
  code: string;
  name: string;
  current: number;
  previous: number;
  delta: number;
}

/** Options whose share changed most between two windows (in percentage points). */
export function movers(catalog: StoreCatalog, current: DesignFact[], previous: DesignFact[], limit = 5): Mover[] {
  const out: Mover[] = [];
  for (const g of [...SINGLE_GROUPS, "extra" as const]) {
    if (g === "length") continue;
    const cur = distribution(catalog, current, g);
    const prev = new Map(distribution(catalog, previous, g).map((s) => [s.code, s.pct]));
    for (const s of cur) {
      const p = prev.get(s.code) ?? 0;
      if (s.count < 10) continue;
      out.push({ group: g, code: s.code, name: s.name, current: s.pct, previous: p, delta: s.pct - p });
    }
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, limit);
}

export function dailySeries(facts: DesignFact[], days: number, now = Date.now()): { day: string; designs: number; orders: number }[] {
  const out: { day: string; designs: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const end = now - i * DAY;
    const start = end - DAY;
    const bucket = facts.filter((f) => {
      const t = Date.parse(f.createdAt);
      return t > start && t <= end;
    });
    out.push({
      day: new Date(end).toISOString().slice(0, 10),
      designs: bucket.length,
      orders: bucket.filter((f) => f.orderedAt).length,
    });
  }
  return out;
}

/** Conversion of a given combination vs. the overall average, to qualify an opportunity. */
export function comboConversion(facts: DesignFact[], key: string): { cartRate: number; orderRate: number; n: number } {
  const subset = facts.filter((f) => COMBO_GROUPS.map((g) => f.config[g as Exclude<OptionGroup, "extra">]).join("|") === key);
  const k = kpis(subset);
  return { cartRate: k.cartRate, orderRate: k.orderRate, n: subset.length };
}
