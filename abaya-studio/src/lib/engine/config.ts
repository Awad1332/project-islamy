/**
 * Configuration Engine.
 *
 * Owns every rule about which options exist, which are available, and which
 * can be combined. The UI, pricing, AI prompt and cart all consume its output.
 */
import {
  GROUP_META,
  GROUP_ORDER,
  SINGLE_GROUPS,
  type DesignConfig,
  type DesignOption,
  type OptionGroup,
  type SingleGroup,
  type StoreCatalog,
} from "./types";

export type OptionStatus = "available" | "unavailable" | "incompatible";

export interface OptionState {
  option: DesignOption;
  status: OptionStatus;
  selected: boolean;
  /** Human message when status !== available. */
  reason?: string;
  /** Earlier selections that block this option. */
  blockedBy: DesignOption[];
  /** Later selections that would be replaced if this option is picked. */
  willReplace: DesignOption[];
}

export interface ConfigIssue {
  group: OptionGroup;
  optionId?: string;
  message: string;
}

export interface Adjustment {
  group: OptionGroup;
  from?: DesignOption;
  to?: DesignOption;
  message: string;
}

const groupIndex = (g: OptionGroup) => GROUP_ORDER.indexOf(g);

export function optionById(catalog: StoreCatalog, id: string): DesignOption | undefined {
  return catalog.options.find((o) => o.id === id);
}

export function optionFor(catalog: StoreCatalog, group: OptionGroup, code: string): DesignOption | undefined {
  return catalog.options.find((o) => o.group === group && o.code === code);
}

export function groupOptions(catalog: StoreCatalog, group: OptionGroup): DesignOption[] {
  return catalog.options.filter((o) => o.group === group).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** All currently selected options, in group order. Unknown codes are skipped. */
export function selectedOptions(catalog: StoreCatalog, config: DesignConfig): DesignOption[] {
  const out: DesignOption[] = [];
  for (const g of SINGLE_GROUPS) {
    const o = optionFor(catalog, g, config[g]);
    if (o) out.push(o);
  }
  for (const code of config.extras) {
    const o = optionFor(catalog, "extra", code);
    if (o) out.push(o);
  }
  return out;
}

/** Whitelist check: does `a` restrict b's group and exclude b? */
function whitelistBlocks(a: DesignOption, b: DesignOption): boolean {
  const restricted = a.compatibleWith.filter((id) => id.startsWith(`${b.group}.`));
  return restricted.length > 0 && !restricted.includes(b.id);
}

/** Symmetric compatibility between two options. */
export function areCompatible(a: DesignOption, b: DesignOption): boolean {
  if (a.id === b.id) return true;
  if (a.incompatibleWith.includes(b.id) || b.incompatibleWith.includes(a.id)) return false;
  if (whitelistBlocks(a, b) || whitelistBlocks(b, a)) return false;
  return true;
}

export function incompatibilityMessage(target: DesignOption, blocker: DesignOption): string {
  const t = GROUP_META[target.group];
  const b = GROUP_META[blocker.group];
  return `${t.self} غير ${t.feminine ? "متوفرة" : "متوفر"} مع ${b.self} (${blocker.name}).`;
}

/** Selections that "compete" with target: everything except the same single group. */
function competitors(catalog: StoreCatalog, config: DesignConfig, target: DesignOption): DesignOption[] {
  return selectedOptions(catalog, config).filter((o) =>
    target.group === "extra" ? o.id !== target.id : o.group !== target.group,
  );
}

/**
 * Evaluate a single option against the current configuration.
 * Conflicts with *earlier* steps block the option; conflicts with *later*
 * steps are allowed and reported as `willReplace`.
 */
export function evaluateOption(catalog: StoreCatalog, config: DesignConfig, option: DesignOption): OptionState {
  const selected =
    option.group === "extra" ? config.extras.includes(option.code) : config[option.group as SingleGroup] === option.code;

  if (!option.available) {
    return { option, status: "unavailable", selected, reason: "غير متوفر حاليًا", blockedBy: [], willReplace: [] };
  }

  const conflicts = competitors(catalog, config, option).filter((o) => !areCompatible(option, o));
  const blockedBy = conflicts.filter((o) => groupIndex(o.group) <= groupIndex(option.group));
  const willReplace = conflicts.filter((o) => groupIndex(o.group) > groupIndex(option.group));

  if (blockedBy.length > 0) {
    return {
      option,
      status: "incompatible",
      selected,
      reason: incompatibilityMessage(option, blockedBy[0]),
      blockedBy,
      willReplace,
    };
  }
  return { option, status: "available", selected, blockedBy: [], willReplace };
}

export function evaluateGroup(catalog: StoreCatalog, config: DesignConfig, group: OptionGroup): OptionState[] {
  return groupOptions(catalog, group).map((o) => evaluateOption(catalog, config, o));
}

/** Options in `group` that can be picked right now without blocking. */
export function compatibleOptions(catalog: StoreCatalog, config: DesignConfig, group: OptionGroup): DesignOption[] {
  return evaluateGroup(catalog, config, group)
    .filter((s) => s.status === "available")
    .map((s) => s.option);
}

/**
 * Re-resolve a config so it is fully valid. Groups are processed in priority
 * order; each keeps its selection if it is available and compatible with every
 * group processed before it, otherwise it falls back to the first valid option.
 */
export function normalize(
  catalog: StoreCatalog,
  config: DesignConfig,
  priority: OptionGroup[] = GROUP_ORDER,
): { config: DesignConfig; adjustments: Adjustment[] } {
  const order = [...priority, ...GROUP_ORDER.filter((g) => !priority.includes(g))];
  const kept: DesignOption[] = [];
  const next: DesignConfig = { ...config, extras: [...config.extras] };
  const adjustments: Adjustment[] = [];
  const fits = (o: DesignOption) => o.available && kept.every((k) => areCompatible(o, k));

  for (const g of order) {
    if (g === "extra") {
      const extras: string[] = [];
      for (const code of config.extras) {
        const o = optionFor(catalog, "extra", code);
        if (o && fits(o)) {
          extras.push(code);
          kept.push(o);
        } else if (o) {
          const blocker = kept.find((k) => !areCompatible(o, k));
          adjustments.push({
            group: g,
            from: o,
            message: blocker ? `أزلنا ${o.name} لأنها غير متوافقة مع ${GROUP_META[blocker.group].label}: ${blocker.name}.` : `أزلنا ${o.name} لأنها غير متوفرة حاليًا.`,
          });
        }
      }
      next.extras = extras;
      continue;
    }

    const current = optionFor(catalog, g, config[g]);
    if (current && fits(current)) {
      kept.push(current);
      continue;
    }
    const replacement = groupOptions(catalog, g).find(fits);
    if (replacement) {
      next[g] = replacement.code;
      kept.push(replacement);
      if (current) {
        const blocker = kept.find((k) => k.id !== replacement.id && !areCompatible(current, k));
        adjustments.push({
          group: g,
          from: current,
          to: replacement,
          message: blocker
            ? `غيّرنا ${GROUP_META[g].label} إلى «${replacement.name}» لأن «${current.name}» غير متوافق مع ${blocker.name}.`
            : `غيّرنا ${GROUP_META[g].label} إلى «${replacement.name}» لأن «${current.name}» غير متوفر حاليًا.`,
        });
      }
    }
  }
  return { config: next, adjustments };
}

export type SelectResult =
  | { ok: true; config: DesignConfig; adjustments: Adjustment[] }
  | { ok: false; reason: string; state: OptionState };

/** Apply a customer selection through the engine. */
export function select(catalog: StoreCatalog, config: DesignConfig, group: OptionGroup, code: string): SelectResult {
  const option = optionFor(catalog, group, code);
  if (!option) {
    return {
      ok: false,
      reason: "هذا الخيار غير موجود.",
      state: { option: { id: "", group, code } as DesignOption, status: "unavailable", selected: false, blockedBy: [], willReplace: [] },
    };
  }

  // Toggling an extra off never conflicts.
  if (group === "extra" && config.extras.includes(code)) {
    return { ok: true, config: { ...config, extras: config.extras.filter((c) => c !== code) }, adjustments: [] };
  }

  const state = evaluateOption(catalog, config, option);
  if (state.status !== "available") return { ok: false, reason: state.reason ?? "غير متاح", state };

  const draft: DesignConfig =
    group === "extra" ? { ...config, extras: [...config.extras, code] } : { ...config, [group]: code };
  const { config: next, adjustments } = normalize(catalog, draft, [group]);
  return { ok: true, config: next, adjustments };
}

export function defaultConfig(catalog: StoreCatalog): DesignConfig {
  const seed = Object.fromEntries(SINGLE_GROUPS.map((g) => [g, ""])) as Record<SingleGroup, string>;
  // Prefer sensible studio defaults when present.
  const prefer: Partial<Record<SingleGroup, string>> = {
    length: "145",
    embroidery: "none",
    color: "black",
    closure: "open",
  };
  for (const g of SINGLE_GROUPS) {
    const p = prefer[g];
    seed[g] = p && optionFor(catalog, g, p) ? p : (groupOptions(catalog, g)[0]?.code ?? "");
  }
  return normalize(catalog, { ...seed, extras: [] }).config;
}

/** Strict server-side validation. A valid config can be priced and produced. */
export function validateConfig(catalog: StoreCatalog, config: DesignConfig): { valid: boolean; issues: ConfigIssue[] } {
  const issues: ConfigIssue[] = [];
  for (const g of SINGLE_GROUPS) {
    const o = optionFor(catalog, g, config[g]);
    if (!o) issues.push({ group: g, message: `اختاري ${GROUP_META[g].label}.` });
    else if (!o.available) issues.push({ group: g, optionId: o.id, message: `${o.name} غير متوفر حاليًا.` });
  }
  const seen = new Set<string>();
  for (const code of config.extras) {
    const o = optionFor(catalog, "extra", code);
    if (!o) issues.push({ group: "extra", message: `إضافة غير معروفة: ${code}` });
    else if (!o.available) issues.push({ group: "extra", optionId: o.id, message: `${o.name} غير متوفرة حاليًا.` });
    if (seen.has(code)) issues.push({ group: "extra", message: `إضافة مكررة: ${code}` });
    seen.add(code);
  }
  const sel = selectedOptions(catalog, config);
  for (let i = 0; i < sel.length; i++) {
    for (let j = i + 1; j < sel.length; j++) {
      if (!areCompatible(sel[i], sel[j])) {
        issues.push({ group: sel[j].group, optionId: sel[j].id, message: incompatibilityMessage(sel[j], sel[i]) });
      }
    }
  }
  return { valid: issues.length === 0, issues };
}

/** Deterministic production SKU for a configuration. */
export function buildSku(catalog: StoreCatalog, config: DesignConfig): string {
  const parts = selectedOptions(catalog, config).map((o) => o.sku.split("-").slice(1).join(""));
  return ["ABY", ...parts].join("-");
}

/** Coerce untrusted input into a DesignConfig shape (does not validate rules). */
export function parseConfig(input: unknown): DesignConfig | null {
  if (!input || typeof input !== "object") return null;
  const r = input as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 64) : null);
  const out: Partial<DesignConfig> = {};
  for (const g of SINGLE_GROUPS) {
    const v = g === "length" && typeof r[g] === "number" ? String(r[g]) : str(r[g]);
    if (v === null) return null;
    out[g] = v;
  }
  const extras = Array.isArray(r.extras) ? r.extras : [];
  out.extras = extras.filter((x): x is string => typeof x === "string").slice(0, 20);
  return out as DesignConfig;
}
