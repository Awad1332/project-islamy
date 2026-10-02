const HEX = /^#[0-9a-f]{6}$/i;

export function safeHex(hex: string | undefined, fallback = "#141414"): string {
  return hex && HEX.test(hex) ? hex.toLowerCase() : fallback;
}

function rgb(hex: string): [number, number, number] {
  const h = safeHex(hex).slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: number[]): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

/** Mix `a` toward `b` by t (0..1). */
export function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const isDark = (hex: string) => luminance(hex) < 0.18;

/** Slightly contrasting tone for seams/edges that still reads as the same fabric. */
export function edgeTone(hex: string): string {
  return isDark(hex) ? mix(hex, "#ffffff", 0.16) : mix(hex, "#000000", 0.22);
}

/** Inner layer / lining tone. */
export function innerTone(hex: string): string {
  return isDark(hex) ? mix(hex, "#ffffff", 0.12) : mix(hex, "#000000", 0.14);
}
