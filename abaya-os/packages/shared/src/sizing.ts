import type { FitPreference, MeasurementKey } from './enums';

export interface Range { min: number; max: number }
export interface SizeRow { label: string; ranges: Partial<Record<MeasurementKey, Range>> }
export interface LengthRow { label: string; heightMin: number; heightMax: number }
export interface SizeChartDef {
  /** Weights per measurement the merchant uses; missing keys are ignored. */
  weights: Partial<Record<MeasurementKey, number>>;
  rows: SizeRow[]; // ordered smallest → largest
  lengthRows: LengthRow[]; // abaya length (e.g. 52, 54 … 62 inch) by customer height (cm)
  /** Extra cm of height to add when customer wears heels (merchant-defined). */
  heelAllowanceCm?: number;
}
export type Measurements = Partial<Record<MeasurementKey, number>>;

export interface MeasurementReason {
  key: MeasurementKey;
  value: number;
  status: 'within' | 'below' | 'above';
  range: Range;
}
export interface Recommendation {
  size: string | null;
  length: string | null;
  confidence: number; // 0..1
  reasons: MeasurementReason[];
  alternative: string | null;
  notes: string[];
}

function distance(value: number, r: Range): number {
  if (value >= r.min && value <= r.max) return 0;
  const width = Math.max(1, r.max - r.min);
  return value < r.min ? (r.min - value) / width : (value - r.max) / width;
}

export function recommendSize(
  chart: SizeChartDef,
  m: Measurements,
  fit: FitPreference = 'REGULAR',
  wearsHeels = false,
): Recommendation {
  const notes: string[] = [];
  const keys = (Object.keys(chart.weights) as MeasurementKey[]).filter(
    (k) => typeof m[k] === 'number' && (chart.weights[k] ?? 0) > 0,
  );

  let size: string | null = null;
  let alternative: string | null = null;
  let reasons: MeasurementReason[] = [];
  let confidence = 0;

  if (chart.rows.length && keys.length) {
    const scored = chart.rows.map((row, idx) => {
      let score = 0;
      let considered = 0;
      for (const k of keys) {
        const r = row.ranges[k];
        if (!r) continue;
        considered += chart.weights[k]!;
        score += distance(m[k]!, r) * chart.weights[k]!;
      }
      return { row, idx, score: considered ? score / considered : Number.POSITIVE_INFINITY };
    });
    const ranked = [...scored].sort((a, b) => a.score - b.score || a.idx - b.idx);
    let best = ranked[0];
    if (Number.isFinite(best.score)) {
      // Fit preference: bump one size when the customer sits in the outer 30% of a range.
      const pos = keys
        .map((k) => {
          const r = best.row.ranges[k];
          if (!r || r.max === r.min) return null;
          return (m[k]! - r.min) / (r.max - r.min);
        })
        .filter((x): x is number => x !== null);
      const avgPos = pos.length ? pos.reduce((a, b) => a + b, 0) / pos.length : 0.5;
      if (fit === 'LOOSE' && avgPos >= 0.7 && best.idx < chart.rows.length - 1) {
        notes.push('fit_loose_size_up');
        best = scored[best.idx + 1];
      } else if (fit === 'SNUG' && avgPos <= 0.3 && best.idx > 0) {
        notes.push('fit_snug_size_down');
        best = scored[best.idx - 1];
      }
      size = best.row.label;
      reasons = keys
        .filter((k) => best.row.ranges[k])
        .map((k) => {
          const r = best.row.ranges[k]!;
          const v = m[k]!;
          return { key: k, value: v, range: r, status: v < r.min ? 'below' : v > r.max ? 'above' : 'within' };
        });
      const within = reasons.filter((r) => r.status === 'within').length;
      const weighted = Object.values(chart.weights).filter((w) => (w ?? 0) > 0).length;
      const coverage = weighted ? keys.length / weighted : 0;
      confidence = reasons.length ? Number(((within / reasons.length) * (0.6 + 0.4 * coverage)).toFixed(2)) : 0;
      const alt = ranked.find((r) => r.row.label !== size && Number.isFinite(r.score));
      alternative = alt && alt.score - ranked[0].score < 0.15 ? alt.row.label : null;
      if (reasons.some((r) => r.status !== 'within')) notes.push('outside_chart_range');
    }
  } else {
    notes.push('insufficient_measurements');
  }

  let length: string | null = null;
  if (typeof m.height === 'number' && chart.lengthRows.length) {
    const h = m.height + (wearsHeels ? chart.heelAllowanceCm ?? 0 : 0);
    const exact = chart.lengthRows.find((r) => h >= r.heightMin && h <= r.heightMax);
    if (exact) length = exact.label;
    else {
      const nearest = [...chart.lengthRows].sort(
        (a, b) => Math.min(Math.abs(h - a.heightMin), Math.abs(h - a.heightMax)) -
          Math.min(Math.abs(h - b.heightMin), Math.abs(h - b.heightMax)),
      )[0];
      length = nearest.label;
      notes.push('length_nearest_match');
      confidence = Number((confidence * 0.85).toFixed(2));
    }
  } else if (chart.lengthRows.length) {
    notes.push('height_missing_for_length');
  }

  return { size, length, confidence, reasons, alternative, notes };
}
