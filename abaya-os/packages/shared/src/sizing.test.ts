import { describe, expect, it } from 'vitest';
import { recommendSize, type SizeChartDef } from './sizing';

const chart: SizeChartDef = {
  weights: { bust: 3, shoulder: 2, hips: 2, height: 0 },
  rows: [
    { label: 'S', ranges: { bust: { min: 80, max: 88 }, shoulder: { min: 36, max: 38 }, hips: { min: 88, max: 96 } } },
    { label: 'M', ranges: { bust: { min: 89, max: 96 }, shoulder: { min: 38.5, max: 40 }, hips: { min: 97, max: 104 } } },
    { label: 'L', ranges: { bust: { min: 97, max: 104 }, shoulder: { min: 40.5, max: 42 }, hips: { min: 105, max: 112 } } },
  ],
  lengthRows: [
    { label: '52', heightMin: 145, heightMax: 152 },
    { label: '54', heightMin: 153, heightMax: 158 },
    { label: '56', heightMin: 159, heightMax: 164 },
    { label: '58', heightMin: 165, heightMax: 170 },
  ],
  heelAllowanceCm: 5,
};

describe('recommendSize', () => {
  it('picks the size whose ranges contain all measurements', () => {
    const r = recommendSize(chart, { bust: 92, shoulder: 39, hips: 100, height: 160 });
    expect(r.size).toBe('M');
    expect(r.length).toBe('56');
    expect(r.confidence).toBeGreaterThan(0.9);
    expect(r.reasons.every((x) => x.status === 'within')).toBe(true);
  });
  it('sizes up for loose fit near the top of the range', () => {
    const r = recommendSize(chart, { bust: 95.5, shoulder: 39.8, hips: 103 }, 'LOOSE');
    expect(r.size).toBe('L');
    expect(r.notes).toContain('fit_loose_size_up');
  });
  it('sizes down for snug fit near the bottom of the range', () => {
    const r = recommendSize(chart, { bust: 89, shoulder: 38.5, hips: 97 }, 'SNUG');
    expect(r.size).toBe('S');
  });
  it('adds heel allowance to length', () => {
    expect(recommendSize(chart, { height: 155 }, 'REGULAR', true).length).toBe('56');
  });
  it('reports insufficient measurements and nearest length outside range', () => {
    const r = recommendSize(chart, { height: 180 });
    expect(r.size).toBeNull();
    expect(r.length).toBe('58');
    expect(r.notes).toEqual(expect.arrayContaining(['insufficient_measurements', 'length_nearest_match']));
  });
  it('flags measurements outside of the chart', () => {
    const r = recommendSize(chart, { bust: 120, shoulder: 45, hips: 125 });
    expect(r.size).toBe('L');
    expect(r.notes).toContain('outside_chart_range');
    expect(r.confidence).toBe(0);
  });
});
