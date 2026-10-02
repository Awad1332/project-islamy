/**
 * Pricing Engine: base price + option add-ons. Always computed server-side for
 * anything that is saved or added to cart; the client mirrors it for instant
 * feedback.
 */
import { selectedOptions } from "./config";
import { GROUP_META, type DesignConfig, type OptionGroup, type StoreCatalog } from "./types";

export interface PriceLine {
  optionId: string;
  group: OptionGroup;
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  currency: "SAR";
  base: number;
  lines: PriceLine[];
  addons: number;
  total: number;
  leadTimeDays: number;
}

export function priceConfig(catalog: StoreCatalog, config: DesignConfig): PriceBreakdown {
  const selected = selectedOptions(catalog, config);
  const lines: PriceLine[] = selected
    .filter((o) => o.price !== 0)
    .map((o) => ({
      optionId: o.id,
      group: o.group,
      label: o.group === "embroidery" || o.group === "extra" ? o.name : `${GROUP_META[o.group].label}: ${o.name}`,
      amount: o.price,
    }));
  const addons = lines.reduce((s, l) => s + l.amount, 0);
  const leadTimeDays = catalog.baseLeadTimeDays + selected.reduce((m, o) => Math.max(m, o.leadTimeDays), 0);
  return { currency: "SAR", base: catalog.basePrice, lines, addons, total: catalog.basePrice + addons, leadTimeDays };
}

const fmt = new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 0 });

export function formatSAR(amount: number): string {
  return `${fmt.format(amount)} ريال`;
}

export function formatSigned(amount: number): string {
  return `${amount >= 0 ? "+" : "−"}${fmt.format(Math.abs(amount))}`;
}
