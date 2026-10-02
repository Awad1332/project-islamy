/**
 * Core domain types for Abaya Studio.
 *
 * The Configuration Engine is the single source of truth for what the
 * customer actually ordered. AI only ever *visualizes* a validated config.
 */

export type OptionGroup =
  | "cut"
  | "length"
  | "sleeve"
  | "neckline"
  | "closure"
  | "fabric"
  | "color"
  | "embroidery"
  | "extra";

/** Order matters: it defines step order and conflict priority. */
export const GROUP_ORDER: OptionGroup[] = [
  "cut",
  "length",
  "sleeve",
  "neckline",
  "closure",
  "fabric",
  "color",
  "embroidery",
  "extra",
];

/** Groups where exactly one option must be selected. */
export const SINGLE_GROUPS = GROUP_ORDER.filter((g) => g !== "extra") as Exclude<
  OptionGroup,
  "extra"
>[];

export type SingleGroup = (typeof SINGLE_GROUPS)[number];

/** Rendering hints consumed by the SVG preview renderer. */
export interface OptionVisual {
  /** color: fill hex */
  hex?: string;
  /** color: 0..1 sheen multiplier (matte black ≈ 0.2) */
  sheen?: number;
  /** fabric: texture kind */
  texture?: "matte" | "soft" | "satin" | "linen" | "sheer";
  /** embroidery: thread hex */
  thread?: string;
  /** length: centimeters */
  cm?: number;
  /**
   * Shape the preview renderer should use for merchant-created options,
   * e.g. a new cut "kimono" can render as "wide".
   */
  renderAs?: string;
}

export interface DesignOption {
  /** Globally unique within a catalog: `${group}.${code}` */
  id: string;
  group: OptionGroup;
  code: string;
  name: string;
  /** English name used by the AI prompt builder. */
  nameEn: string;
  description: string;
  /** Add-on price in SAR (0 = included in base). */
  price: number;
  available: boolean;
  sku: string;
  /** Extra production days this option adds. */
  leadTimeDays: number;
  /** Optional merchant photo; when absent the studio renders a visual. */
  image?: string;
  visual?: OptionVisual;
  /** English prompt fragment. Falls back to nameEn. */
  prompt?: string;
  /** Explicit blacklist (option ids). Checked symmetrically. */
  incompatibleWith: string[];
  /**
   * Optional whitelist (option ids). For every group mentioned here, only the
   * listed options of that group may be combined with this option.
   */
  compatibleWith: string[];
  sortOrder: number;
}

export interface SizeChartRow {
  size: string;
  /** Reference garment length in cm. */
  lengthCm: number;
  /** Reference bust width in cm (informational). */
  bustCm: number;
  minHeight: number;
  maxHeight: number;
}

export interface SizeRules {
  /** Ideal abaya length ≈ body height × ratio. */
  heightToLengthRatio: number;
  /** Added cm when the customer always wears heels (half for "sometimes"). */
  heelAddCm: number;
  /** Per-cut length adjustment in cm (e.g. wide cuts drape lower). */
  cutLengthAdjust: Record<string, number>;
}

export interface StoreCatalog {
  storeId: string;
  storeName: string;
  currency: "SAR";
  basePrice: number;
  baseLeadTimeDays: number;
  options: DesignOption[];
  sizeChart: SizeChartRow[];
  sizeRules: SizeRules;
  updatedAt: string;
}

/** What the customer chose. Values are option codes. */
export interface DesignConfig {
  cut: string;
  length: string;
  sleeve: string;
  neckline: string;
  closure: string;
  fabric: string;
  color: string;
  embroidery: string;
  extras: string[];
}

export interface GroupMeta {
  label: string;
  /** Demonstrative noun used in messages, e.g. "هذه القصة". */
  self: string;
  feminine: boolean;
}

export const GROUP_META: Record<OptionGroup, GroupMeta> = {
  cut: { label: "القصة", self: "هذه القصة", feminine: true },
  length: { label: "الطول", self: "هذا الطول", feminine: false },
  sleeve: { label: "الأكمام", self: "هذه الأكمام", feminine: true },
  neckline: { label: "الرقبة", self: "هذه الرقبة", feminine: true },
  closure: { label: "الإغلاق", self: "هذا الإغلاق", feminine: false },
  fabric: { label: "الخامة", self: "هذه الخامة", feminine: true },
  color: { label: "اللون", self: "هذا اللون", feminine: false },
  embroidery: { label: "التطريز", self: "هذا التطريز", feminine: false },
  extra: { label: "الإضافة", self: "هذه الإضافة", feminine: true },
};
