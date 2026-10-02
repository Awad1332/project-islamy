/**
 * Size Engine — rule-based, driven by the merchant's size chart.
 * AI is intentionally not used here.
 */
import type { SizeChartRow, SizeRules, StoreCatalog } from "./types";

export type HeelHabit = "always" | "sometimes" | "never";
export type FitPreference = "loose" | "regular" | "fitted";
export type Confidence = "high" | "medium" | "low";

export interface SizeInput {
  heightCm: number;
  usualSize?: string | null;
  fit?: FitPreference;
  heels?: HeelHabit;
  /** Previous purchase from this store, if any. */
  previous?: { size: string; result: "good" | "short" | "long" } | null;
  cut?: string;
  cutName?: string;
}

export interface SizeRecommendation {
  size: string;
  row: SizeChartRow;
  targetLengthCm: number;
  confidence: Confidence;
  score: number;
  summary: string;
  reasons: string[];
  tips: string[];
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};

function heelCm(rules: SizeRules, heels?: HeelHabit) {
  if (heels === "always") return rules.heelAddCm;
  if (heels === "sometimes") return rules.heelAddCm / 2;
  return 0;
}

function nearestRow(chart: SizeChartRow[], lengthCm: number): number {
  let best = 0;
  chart.forEach((r, i) => {
    if (Math.abs(r.lengthCm - lengthCm) < Math.abs(chart[best].lengthCm - lengthCm)) best = i;
  });
  return best;
}

export function idealLengthCm(rules: SizeRules, heightCm: number, heels?: HeelHabit, cut?: string): number {
  return heightCm * rules.heightToLengthRatio + heelCm(rules, heels) + (cut ? (rules.cutLengthAdjust[cut] ?? 0) : 0);
}

export function recommendSize(catalog: Pick<StoreCatalog, "sizeChart" | "sizeRules">, input: SizeInput): SizeRecommendation {
  const chart = [...catalog.sizeChart].sort((a, b) => a.lengthCm - b.lengthCm);
  if (chart.length === 0) throw new Error("Size chart is empty");
  const rules = catalog.sizeRules;
  const reasons: string[] = [];
  const tips: string[] = [];
  let score = 0.6;

  const target = idealLengthCm(rules, input.heightCm, input.heels, input.cut);
  let idx = nearestRow(chart, target);
  reasons.push(`طولك ${input.heightCm} سم يناسبه طول عباية قريب من ${Math.round(target)} سم.`);
  if (input.heels === "always") reasons.push("أضفنا هامشًا بسيطًا لأنك تلبسين الكعب غالبًا.");
  if (input.cut && rules.cutLengthAdjust[input.cut]) {
    reasons.push(input.cutName ? `راعينا انسدال قصة «${input.cutName}».` : "راعينا انسدال القصة.");
  }

  const prevIdx = input.previous ? chart.findIndex((r) => r.size === input.previous!.size) : -1;
  if (input.previous && prevIdx >= 0) {
    const shift = input.previous.result === "short" ? 1 : input.previous.result === "long" ? -1 : 0;
    const fromHistory = Math.min(chart.length - 1, Math.max(0, prevIdx + shift));
    if (fromHistory !== idx) reasons.push("اعتمدنا على تجربتك السابقة مع المتجر لأنها أدق من الحساب العام.");
    idx = fromHistory;
    score += input.previous.result === "good" ? 0.25 : 0.1;
    if (input.previous.result === "good") reasons.push(`مقاس ${input.previous.size} كان مناسبًا لك سابقًا.`);
  }

  const row = chart[idx];
  if (input.heightCm >= row.minHeight && input.heightCm <= row.maxHeight) score += 0.15;
  if (input.heightCm < chart[0].minHeight || input.heightCm > chart[chart.length - 1].maxHeight) {
    score -= 0.3;
    tips.push("طولك خارج جدول المقاسات المعتاد — ننصح بالتفصيل حسب القياس.");
  }

  const usualIdx = input.usualSize ? chart.findIndex((r) => r.size === input.usualSize) : -1;
  if (usualIdx >= 0) {
    const diff = Math.abs(usualIdx - idx);
    if (diff === 0) {
      score += 0.2;
      reasons.push("يتطابق مع مقاسك المعتاد.");
    } else if (diff === 1) {
      score -= 0.05;
      reasons.push(`مقاسك المعتاد ${input.usualSize} قريب جدًا، لكن طولك يرجّح ${row.size}.`);
    } else {
      score -= 0.3;
      tips.push(`يوجد فرق بين مقاسك المعتاد (${input.usualSize}) والمقترح — راجعي جدول المقاسات.`);
    }
  }

  if (input.fit === "loose" && (input.cut === "straight" || input.cut === "custom")) {
    tips.push("بما أنك تحبين الواسعة، جرّبي القصة الواسعة أو A-Line لراحة أكبر.");
  }
  if (input.fit === "fitted" && (input.cut === "wide" || input.cut === "bisht")) {
    tips.push("القصة المختارة واسعة بطبيعتها؛ يمكن إضافة حزام لتحديد الخصر.");
  }

  score = Math.max(0, Math.min(1, score));
  const confidence: Confidence = score >= 0.8 ? "high" : score >= 0.55 ? "medium" : "low";

  const basis = [`طولك`];
  if (input.fit === "loose" || input.cut === "wide") basis.push(input.cutName ? `وتفضيلك لقصة «${input.cutName}»` : "وتفضيلك للقصة الواسعة");
  else if (input.cutName) basis.push(`وقصة «${input.cutName}»`);
  if (input.previous && prevIdx >= 0) basis.push("وتجربتك السابقة");
  const summary = `بناءً على ${basis.join(" ")}، نقترح مقاس ${row.size}.`;

  return { size: row.size, row, targetLengthCm: Math.round(target), confidence, score, summary, reasons, tips };
}

/** Infer a size from the garment length the customer picked (no body data). */
export function sizeFromLength(catalog: Pick<StoreCatalog, "sizeChart">, lengthCm: number): SizeChartRow {
  const chart = [...catalog.sizeChart].sort((a, b) => a.lengthCm - b.lengthCm);
  return chart[nearestRow(chart, lengthCm)];
}

export type LengthPreference = "shorter" | "standard" | "floor";

/** Step-2 helper: suggest one of the available length options. */
export function recommendLength(
  catalog: Pick<StoreCatalog, "sizeRules">,
  lengthOptions: number[],
  input: { heightCm: number; heels?: HeelHabit; preference?: LengthPreference; cut?: string },
): { lengthCm: number; reason: string } {
  const pref = input.preference === "shorter" ? -4 : input.preference === "floor" ? 3 : 0;
  const target = idealLengthCm(catalog.sizeRules, input.heightCm, input.heels, input.cut) + pref;
  const sorted = [...lengthOptions].sort((a, b) => a - b);
  const best = sorted.reduce((b, l) => (Math.abs(l - target) < Math.abs(b - target) ? l : b), sorted[0]);
  const prefText = input.preference === "shorter" ? "وتفضيلك لطول أقصر قليلًا" : input.preference === "floor" ? "وتفضيلك لطول يلامس الأرض" : "";
  const heelText = input.heels === "always" ? "مع الكعب" : "";
  return {
    lengthCm: best,
    reason: `لطولك ${input.heightCm} سم ${heelText} ${prefText} نقترح ${best} سم.`.replace(/\s+/g, " "),
  };
}
