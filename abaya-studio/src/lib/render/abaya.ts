/**
 * Parametric abaya illustration renderer.
 *
 * Produces a self-contained SVG string from resolved design visuals. It is the
 * always-available live preview, the option-card artwork, and the fallback
 * "illustrative" visualization when no image model is configured.
 *
 * All dynamic values are numbers or validated hex colors — never raw user text.
 */
import { edgeTone, innerTone, isDark, mix, safeHex } from "./color";

export type Texture = "matte" | "soft" | "satin" | "linen" | "sheer";
export type RenderView = "front" | "back";
export type Crop = "full" | "upper" | "neck" | "torso" | "waist" | "hem" | "sleeve";

export interface RenderInput {
  cut: string;
  lengthCm: number;
  sleeve: string;
  neckline: string;
  closure: string;
  texture: Texture;
  colorHex: string;
  sheen: number;
  embroidery: string;
  threadHex?: string;
  extras: string[];
}

export interface RenderOptions {
  view?: RenderView;
  mode?: "studio" | "photo" | "bare";
  crop?: Crop;
  /** Unique prefix for gradient/pattern ids when several SVGs share a page. */
  idPrefix?: string;
  title?: string;
}

const CX = 200;
const SHOULDER_Y = 180;
const WAIST_Y = 330;
const HIP_Y = 450;
const CUFF_Y = 478;
const FLOOR_Y = 796;
const SKIN = "#d6b08f";

interface CutShape {
  waist: number;
  hip: number;
  hem: number;
  wavy: boolean;
}

const CUTS: Record<string, CutShape> = {
  straight: { waist: 60, hip: 70, hem: 84, wavy: false },
  aline: { waist: 60, hip: 82, hem: 128, wavy: false },
  wide: { waist: 74, hip: 98, hem: 142, wavy: false },
  cloche: { waist: 62, hip: 100, hem: 172, wavy: true },
  bisht: { waist: 82, hip: 110, hem: 150, wavy: false },
  custom: { waist: 64, hip: 92, hem: 136, wavy: false },
};

const CROPS: Record<Crop, string> = {
  full: "0 36 400 776",
  upper: "40 120 320 400",
  neck: "128 118 144 144",
  torso: "90 160 220 380",
  waist: "70 250 260 230",
  hem: "0 560 400 250",
  sleeve: "40 160 170 360",
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export function hemY(lengthCm: number): number {
  const cm = Math.max(120, Math.min(160, lengthCm || 145));
  return 712 + (cm - 130) * 3.9;
}

/** Points along a quadratic bezier, for placing motifs on curved hems. */
function quadPoints(p0: [number, number], c: [number, number], p1: [number, number], n: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p1[0];
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p1[1];
    out.push([r1(x), r1(y)]);
  }
  return out;
}

function hemPath(left: number, right: number, y: number, wavy: boolean): string {
  if (!wavy) return `Q ${CX} ${r1(y + 14)} ${left} ${r1(y)}`; // drawn right → left
  const waves = 6;
  const w = (right - left) / waves;
  let d = "";
  for (let i = 0; i < waves; i++) {
    const x0 = right - i * w;
    const x1 = x0 - w;
    const dip = i % 2 === 0 ? 12 : -2;
    d += ` Q ${r1((x0 + x1) / 2)} ${r1(y + dip + 6)} ${r1(x1)} ${r1(y + (i % 2 === 0 ? 2 : 0))}`;
  }
  return d;
}

/** Full silhouette path for body (handles hem direction properly). */
function silhouette(shape: CutShape, hy: number): string {
  const L = (dx: number) => r1(CX - dx);
  const R = (dx: number) => r1(CX + dx);
  const right = [
    `M ${R(24)} 168`,
    `C ${R(40)} 172 ${R(58)} 176 ${R(66)} ${SHOULDER_Y + 4}`,
    `C ${R(72)} 210 ${R(shape.waist + 2)} 250 ${R(shape.waist)} ${WAIST_Y}`,
    `C ${R(shape.waist + 4)} 380 ${R(shape.hip)} ${HIP_Y - 30} ${R(shape.hip)} ${HIP_Y}`,
    `C ${R(shape.hip + (shape.hem - shape.hip) * 0.4)} ${HIP_Y + 120} ${R(shape.hem - 6)} ${r1(hy - 80)} ${R(shape.hem)} ${r1(hy)}`,
  ];
  const hem = hemPath(L(shape.hem), R(shape.hem), hy, shape.wavy);
  const upLeft = [
    `C ${L(shape.hem - 6)} ${r1(hy - 80)} ${L(shape.hip + (shape.hem - shape.hip) * 0.4)} ${HIP_Y + 120} ${L(shape.hip)} ${HIP_Y}`,
    `C ${L(shape.hip)} ${HIP_Y - 30} ${L(shape.waist + 4)} 380 ${L(shape.waist)} ${WAIST_Y}`,
    `C ${L(shape.waist + 2)} 250 ${L(72)} 210 ${L(66)} ${SHOULDER_Y + 4}`,
    `C ${L(58)} 176 ${L(40)} 172 ${L(24)} 168`,
  ];
  return [...right, hem, ...upLeft, `Q ${CX} 176 ${R(24)} 168`, "Z"].join(" ");
}

interface SleeveGeom {
  path: string;
  cuffLeft: [number, number];
  cuffRight: [number, number];
  cuffCenter: [number, number];
  upperBand: [number, number, number, number];
}

/** Left-hand sleeve (viewer's left). Mirror for the right one. */
function sleeveGeom(kind: string, bodyWide: boolean): SleeveGeom {
  const sx = CX - 64; // shoulder outer
  const top = SHOULDER_Y + 2;
  const armpitX = CX - (bodyWide ? 70 : 58);
  const cuffCx = CX - (bodyWide ? 98 : 86);
  let half = 20;
  let flareStart = 0.6;
  let cy = CUFF_Y;
  switch (kind) {
    case "wide":
      half = 34;
      flareStart = 0.3;
      break;
    case "flare":
      half = 54;
      flareStart = 0.55;
      cy = CUFF_Y + 8;
      break;
    case "straight":
      half = 15;
      break;
    case "statement":
      half = 26;
      break;
    case "embroidered":
    case "regular":
    default:
      half = 21;
  }
  const outX = cuffCx - half;
  const inX = cuffCx + half;
  const midY = top + (cy - top) * flareStart;
  const outMidX = sx - 10 + (cuffCx - (sx - 10)) * flareStart * 0.15;
  const path = [
    `M ${sx} ${top}`,
    `C ${sx - 12} ${top + 18} ${r1(outMidX - 4)} ${r1(midY - 40)} ${r1(Math.min(cuffCx - 20, outX + (half - 20) * 0.4))} ${r1(midY)}`,
    `C ${r1(Math.min(cuffCx - 22, outX + 4))} ${r1(midY + 30)} ${r1(outX + 4)} ${r1(cy - 30)} ${r1(outX)} ${r1(cy)}`,
    `Q ${r1(cuffCx)} ${r1(cy + (half > 40 ? 12 : 6))} ${r1(inX)} ${r1(cy)}`,
    `C ${r1(inX - 4)} ${r1(cy - 40)} ${r1(cuffCx + 18)} ${r1(midY + 20)} ${r1(cuffCx + 20)} ${r1(midY)}`,
    `C ${r1(cuffCx + 24)} ${r1(midY - 50)} ${armpitX} 270 ${armpitX + 4} 236`,
    `C ${armpitX + 6} 214 ${sx + 10} ${top + 6} ${sx} ${top}`,
    "Z",
  ].join(" ");
  const bandY = top + (cy - top) * 0.36;
  return {
    path,
    cuffLeft: [r1(outX), r1(cy)],
    cuffRight: [r1(inX), r1(cy)],
    cuffCenter: [r1(cuffCx), r1(cy)],
    upperBand: [r1(cuffCx - 26), r1(bandY), r1(cuffCx + 22), r1(bandY + 4)],
  };
}

const mirror = (inner: string) => `<g transform="translate(400 0) scale(-1 1)">${inner}</g>`;

/** Dotted embroidery stroke along a path. */
function embroideryStroke(d: string, thread: string, kind: string, scale = 1): string {
  if (kind === "pearl") {
    return `<path d="${d}" fill="none" stroke="${thread}" stroke-width="${4.6 * scale}" stroke-linecap="round" stroke-dasharray="0.1 ${7 * scale}"/>`;
  }
  return (
    `<path d="${d}" fill="none" stroke="${thread}" stroke-width="${0.9 * scale}" opacity="0.9"/>` +
    `<path d="${d}" fill="none" stroke="${thread}" stroke-width="${3.2 * scale}" stroke-linecap="round" stroke-dasharray="0.1 ${5.5 * scale}" transform="translate(0 ${4 * scale})"/>` +
    `<path d="${d}" fill="none" stroke="${thread}" stroke-width="${1.6 * scale}" stroke-dasharray="${5 * scale} ${3 * scale}" opacity="0.7" transform="translate(0 ${8 * scale})"/>`
  );
}

function threadFor(input: RenderInput): string | null {
  switch (input.embroidery) {
    case "none":
    case "":
      return null;
    case "tone":
      return isDark(input.colorHex) ? mix(input.colorHex, "#ffffff", 0.3) : mix(input.colorHex, "#000000", 0.3);
    default:
      return safeHex(input.threadHex, "#c9a45c");
  }
}

function defs(p: string, input: RenderInput, hy: number): string {
  const sheen = Math.max(0, Math.min(1, input.sheen));
  const satin = input.texture === "satin" ? 1.8 : input.texture === "matte" ? 0.6 : 1;
  const hi = r1(0.1 * sheen * satin + (isDark(input.colorHex) ? 0.05 : 0));
  const tex =
    input.texture === "linen"
      ? `<pattern id="${p}tex" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1h4M1 0v4" stroke="#fff" stroke-width="0.5" opacity="0.13"/><path d="M0 3h4" stroke="#000" stroke-width="0.5" opacity="0.12"/></pattern>`
      : input.texture === "soft" || input.texture === "matte"
        ? `<pattern id="${p}tex" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.5" fill="#fff" opacity="${input.texture === "matte" ? 0.05 : 0.035}"/></pattern>`
        : `<pattern id="${p}tex" width="3" height="3" patternUnits="userSpaceOnUse"></pattern>`;
  return `<defs>
<linearGradient id="${p}shade" x1="0" x2="1" y1="0" y2="0">
<stop offset="0" stop-color="#000" stop-opacity="0.28"/>
<stop offset="0.28" stop-color="#fff" stop-opacity="${hi}"/>
<stop offset="0.42" stop-color="#fff" stop-opacity="0"/>
<stop offset="0.62" stop-color="#fff" stop-opacity="${r1(hi * 0.8)}"/>
<stop offset="0.74" stop-color="#fff" stop-opacity="0"/>
<stop offset="1" stop-color="#000" stop-opacity="0.32"/>
</linearGradient>
<linearGradient id="${p}vshade" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#fff" stop-opacity="${r1(0.06 + hi * 0.4)}"/>
<stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
<stop offset="1" stop-color="#000" stop-opacity="0.18"/>
</linearGradient>
<linearGradient id="${p}bg" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#f6f2ec"/><stop offset="0.82" stop-color="#ece6dd"/><stop offset="1" stop-color="#e2dbd0"/>
</linearGradient>
<linearGradient id="${p}photobg" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#e9e1d6"/><stop offset="0.8" stop-color="#ddd2c4"/><stop offset="1" stop-color="#cfc2b1"/>
</linearGradient>
<radialGradient id="${p}spot" cx="0.5" cy="0.35" r="0.6">
<stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
<radialGradient id="${p}floor" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="#000" stop-opacity="0.22"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
</radialGradient>
${tex}
<clipPath id="${p}hemclip"><rect x="0" y="0" width="400" height="${r1(hy + 20)}"/></clipPath>
</defs>`;
}

function background(p: string, mode: RenderOptions["mode"]): string {
  if (mode === "bare") return "";
  if (mode === "photo") {
    return (
      `<rect x="-800" y="-200" width="2000" height="1220" fill="url(#${p}photobg)"/>` +
      // Najdi-inspired arch niche
      `<path d="M92 780 V250 Q92 120 200 92 Q308 120 308 250 V780 Z" fill="#f3ede4" opacity="0.75"/>` +
      `<path d="M92 780 V250 Q92 120 200 92 Q308 120 308 250 V780" fill="none" stroke="#c8b8a2" stroke-width="1.2" opacity="0.7"/>` +
      `<rect x="-800" y="0" width="2000" height="820" fill="url(#${p}spot)"/>` +
      `<rect x="-800" y="780" width="2000" height="240" fill="#cbbfae" opacity="0.6"/>`
    );
  }
  return `<rect x="-800" y="-200" width="2000" height="1220" fill="url(#${p}bg)"/>`;
}

function figureHead(view: RenderView, shayla: string, shaylaEdge: string): string {
  const face =
    view === "front"
      ? `<ellipse cx="${CX}" cy="98" rx="20" ry="25" fill="${SKIN}"/>` +
        `<ellipse cx="${CX}" cy="104" rx="20" ry="18" fill="#000" opacity="0.04"/>`
      : "";
  // Shayla: hood around head + soft drape onto the shoulders.
  const hood =
    `<path d="M ${CX} 58 C 170 58 160 82 162 108 C 163 128 168 146 164 166 C 178 174 222 174 236 166 C 232 146 237 128 238 108 C 240 82 230 58 ${CX} 58 Z" fill="${shayla}"/>` +
    `<path d="M ${CX} 58 C 170 58 160 82 162 108 C 163 128 168 146 164 166" fill="none" stroke="${shaylaEdge}" stroke-width="1" opacity="0.5"/>`;
  const opening =
    view === "front"
      ? `<path d="M ${CX} 72 C 182 72 176 90 177 104 C 178 120 188 128 ${CX} 130 C 212 128 222 120 223 104 C 224 90 218 72 ${CX} 72 Z" fill="${SKIN}"/>` +
        `<path d="M 177 104 C 178 120 188 128 ${CX} 130 C 212 128 222 120 223 104" fill="none" stroke="#000" stroke-opacity="0.06" stroke-width="3"/>`
      : `<path d="M 170 90 C 185 70 215 70 230 90" fill="none" stroke="${shaylaEdge}" stroke-width="1" opacity="0.6"/>`;
  return face + hood + opening;
}

function shoes(hy: number): string {
  if (hy >= FLOOR_Y - 4) return "";
  return (
    `<path d="M 176 ${FLOOR_Y - 14} q -2 -10 8 -12 l 8 0 q 6 4 4 14 z" fill="#1b1a19"/>` +
    `<path d="M 224 ${FLOOR_Y - 14} q 2 -10 -8 -12 l -8 0 q -6 4 -4 14 z" fill="#1b1a19"/>` +
    `<path d="M 187 ${FLOOR_Y - 20} v -60 M 213 ${FLOOR_Y - 20} v -60" stroke="#24211f" stroke-width="12" stroke-linecap="round"/>`
  );
}

export function renderAbayaSvg(input: RenderInput, opts: RenderOptions = {}): string {
  const p = (opts.idPrefix ?? "ab") + "-";
  const view = opts.view ?? "front";
  const crop = opts.crop ?? "full";
  const color = safeHex(input.colorHex);
  const edge = edgeTone(color);
  const inner = innerTone(color);
  const thread = threadFor(input);
  const shape = CUTS[input.cut] ?? CUTS.aline;
  const hy = hemY(input.lengthCm);
  const isBisht = input.cut === "bisht";
  const wideBody = shape.waist >= 74;
  const sheer = input.texture === "sheer";
  const shaylaColor = isDark(color) ? color : mix(color, "#000000", 0.08);

  const body = silhouette(shape, hy);
  const sleeve = sleeveGeom(input.sleeve, wideBody);

  const parts: string[] = [];
  parts.push(background(p, opts.mode));

  // Floor shadow
  if (opts.mode !== "bare") {
    parts.push(`<ellipse cx="${CX}" cy="${FLOOR_Y}" rx="${shape.hem + 30}" ry="14" fill="url(#${p}floor)"/>`);
  }

  // Hands behind sleeves, feet behind hem
  const hand = `<ellipse cx="${sleeve.cuffCenter[0]}" cy="${sleeve.cuffCenter[1] + 16}" rx="9" ry="14" fill="${SKIN}"/>`;
  parts.push(hand, mirror(hand));
  parts.push(shoes(hy));

  // Sheer outer layer shows a slightly shorter lining underneath.
  if (sheer) {
    const lining = silhouette({ ...shape, hem: shape.hem * 0.86, wavy: false }, hy - 8);
    parts.push(`<path d="${lining}" fill="${inner}"/>`);
  }

  // Body
  parts.push(`<g opacity="${sheer ? 0.9 : 1}">`);
  parts.push(`<path d="${body}" fill="${color}"/>`);
  parts.push(`<path d="${body}" fill="url(#${p}tex)"/>`);
  parts.push(`<path d="${body}" fill="url(#${p}shade)"/>`);
  parts.push(`<path d="${body}" fill="url(#${p}vshade)"/>`);
  parts.push(`</g>`);

  // Drape folds from waist to hem
  const folds: string[] = [];
  const foldCount = shape.wavy ? 7 : shape.hem > 120 ? 5 : 3;
  for (let i = 1; i <= foldCount; i++) {
    const t = i / (foldCount + 1);
    const topX = CX - shape.hip + 2 * shape.hip * t;
    const botX = CX - shape.hem + 2 * shape.hem * t;
    folds.push(`M ${r1(topX)} ${HIP_Y - 40} Q ${r1((topX + botX) / 2 + (t - 0.5) * 20)} ${r1((HIP_Y + hy) / 2)} ${r1(botX)} ${r1(hy - 4)}`);
  }
  parts.push(
    `<path d="${folds.join(" ")}" fill="none" stroke="${isDark(color) ? "#ffffff" : "#000000"}" stroke-opacity="${isDark(color) ? 0.07 : 0.09}" stroke-width="2"/>`,
  );

  // Bisht: open outer cloak over an inner dress (front only)
  if (isBisht && view === "front") {
    const gapTop = 14;
    const gapBot = 58;
    parts.push(
      `<path d="M ${CX - gapTop} 190 L ${CX - gapBot} ${r1(hy + 6)} Q ${CX} ${r1(hy + 12)} ${CX + gapBot} ${r1(hy + 6)} L ${CX + gapTop} 190 Z" fill="${inner}"/>`,
      `<path d="M ${CX - gapTop} 190 L ${CX - gapBot} ${r1(hy + 6)} M ${CX + gapTop} 190 L ${CX + gapBot} ${r1(hy + 6)}" stroke="${edge}" stroke-width="2.2" fill="none"/>`,
    );
  }

  // Closures (front only)
  const frontLine = `M ${CX} 196 L ${CX} ${r1(hy + 4)}`;
  let edgePaths: string[] = [];
  if (view === "front" && !isBisht) {
    switch (input.closure) {
      case "open": {
        const d = `M ${CX - 4} 196 L ${CX - 20} ${r1(hy + 8)} Q ${CX} ${r1(hy + 12)} ${CX + 20} ${r1(hy + 8)} L ${CX + 4} 196 Z`;
        parts.push(`<path d="${d}" fill="${inner}"/>`);
        edgePaths = [`M ${CX - 4} 196 L ${CX - 20} ${r1(hy + 8)}`, `M ${CX + 4} 196 L ${CX + 20} ${r1(hy + 8)}`];
        parts.push(`<path d="${edgePaths.join(" ")}" stroke="${edge}" stroke-width="1.6" fill="none"/>`);
        break;
      }
      case "buttons": {
        parts.push(`<path d="${frontLine}" stroke="${edge}" stroke-width="1.4"/>`);
        for (let y = 214; y < Math.min(hy - 60, 640); y += 52) {
          parts.push(`<circle cx="${CX + 5}" cy="${y}" r="3.4" fill="${edge}"/><circle cx="${CX + 4}" cy="${y - 1}" r="1.2" fill="#fff" opacity="0.4"/>`);
        }
        edgePaths = [frontLine];
        break;
      }
      case "zipper": {
        parts.push(`<path d="${frontLine}" stroke="${edge}" stroke-width="1.4"/>`);
        parts.push(`<path d="M ${CX} 196 L ${CX} 560" stroke="${edge}" stroke-width="4" stroke-dasharray="1 2" opacity="0.8"/>`);
        parts.push(`<rect x="${CX - 3}" y="198" width="6" height="12" rx="2" fill="${edge}"/>`);
        edgePaths = [frontLine];
        break;
      }
      case "snaps": {
        parts.push(`<path d="M ${CX - 3} 196 L ${CX - 3} ${r1(hy + 4)} M ${CX + 6} 196 L ${CX + 6} ${r1(hy + 4)}" stroke="${edge}" stroke-width="1" opacity="0.85"/>`);
        for (let y = 222; y < Math.min(hy - 60, 600); y += 70) {
          parts.push(`<circle cx="${CX + 1.5}" cy="${y}" r="2" fill="${edge}" opacity="0.9"/>`);
        }
        edgePaths = [frontLine];
        break;
      }
      case "belt": {
        // Wrap: diagonal overlap + tie
        parts.push(`<path d="M ${CX - 18} 192 C ${CX - 4} 250 ${CX + 30} 300 ${CX + shape.waist - 8} ${WAIST_Y + 4} L ${CX + shape.hem * 0.55} ${r1(hy + 6)}" stroke="${edge}" stroke-width="1.6" fill="none"/>`);
        edgePaths = [`M ${CX - 18} 192 C ${CX - 4} 250 ${CX + 30} 300 ${CX + shape.waist - 8} ${WAIST_Y + 4} L ${CX + shape.hem * 0.55} ${r1(hy + 6)}`];
        break;
      }
      default:
        parts.push(`<path d="${frontLine}" stroke="${edge}" stroke-width="1.2"/>`);
        edgePaths = [frontLine];
    }
  } else if (view === "front" && isBisht) {
    edgePaths = [`M ${CX - 14} 190 L ${CX - 58} ${r1(hy + 6)}`, `M ${CX + 14} 190 L ${CX + 58} ${r1(hy + 6)}`];
  } else {
    // Back seam
    parts.push(`<path d="M ${CX} 190 L ${CX} ${r1(hy)}" stroke="${edge}" stroke-width="1" opacity="0.5"/>`);
  }

  // Pockets
  if (input.extras.includes("pockets") && view === "front") {
    const px = shape.hip - 18;
    const pk = `<path d="M ${r1(CX - px)} ${HIP_Y - 6} l -10 46" stroke="${edge}" stroke-width="1.6" stroke-linecap="round"/>`;
    parts.push(pk, mirror(pk));
  }

  // Hem trim (extra) & hem embroidery
  const hemL = CX - shape.hem;
  const hemR = CX + shape.hem;
  if (input.extras.includes("hem_trim")) {
    const trim = isDark(color) ? mix(color, "#ffffff", 0.22) : mix(color, "#000000", 0.28);
    const d = shape.wavy ? `M ${hemL + 4} ${r1(hy - 8)} Q ${CX} ${r1(hy + 6)} ${hemR - 4} ${r1(hy - 8)}` : `M ${hemL + 2} ${r1(hy - 9)} Q ${CX} ${r1(hy + 5)} ${hemR - 2} ${r1(hy - 9)}`;
    parts.push(`<g clip-path="url(#${p}hemclip)"><path d="${d}" stroke="${trim}" stroke-width="9" fill="none" opacity="0.95"/></g>`);
  }
  if (thread) {
    const pts = quadPoints([hemL + 6, hy - 24], [CX, hy - 10], [hemR - 6, hy - 24], 1);
    const d = `M ${pts[0][0]} ${pts[0][1]} Q ${CX} ${r1(hy - 10)} ${pts[1][0]} ${pts[1][1]}`;
    parts.push(`<g clip-path="url(#${p}hemclip)">${embroideryStroke(d, thread, input.embroidery)}</g>`);
    if (view === "front") {
      for (const e of edgePaths) parts.push(embroideryStroke(e, thread, input.embroidery, 0.8));
    } else {
      // Back yoke motif
      parts.push(embroideryStroke(`M ${CX - 46} 214 Q ${CX} 250 ${CX + 46} 214`, thread, input.embroidery));
    }
  }

  // Neckline (front)
  if (view === "front") {
    switch (input.neckline) {
      case "v":
        parts.push(`<path d="M ${CX - 20} 172 L ${CX} 236 L ${CX + 20} 172 Z" fill="${inner}"/><path d="M ${CX - 20} 172 L ${CX} 236 L ${CX + 20} 172" fill="none" stroke="${edge}" stroke-width="1.6"/>`);
        break;
      case "square":
        parts.push(`<path d="M ${CX - 22} 170 L ${CX - 22} 204 L ${CX + 22} 204 L ${CX + 22} 170 Z" fill="${inner}"/><path d="M ${CX - 22} 170 L ${CX - 22} 204 L ${CX + 22} 204 L ${CX + 22} 170" fill="none" stroke="${edge}" stroke-width="1.6"/>`);
        break;
      case "collar":
        parts.push(
          `<path d="M ${CX - 6} 186 L ${CX - 34} 176 L ${CX - 28} 210 Z" fill="${color}" stroke="${edge}" stroke-width="1.4"/>`,
          `<path d="M ${CX + 6} 186 L ${CX + 34} 176 L ${CX + 28} 210 Z" fill="${color}" stroke="${edge}" stroke-width="1.4"/>`,
          `<path d="M ${CX - 6} 186 L ${CX} 200 L ${CX + 6} 186" fill="${inner}" stroke="${edge}" stroke-width="1"/>`,
        );
        break;
      case "collarless":
        parts.push(`<path d="M ${CX - 46} 176 Q ${CX} 196 ${CX + 46} 176" fill="${inner}" stroke="${edge}" stroke-width="1.6"/>`);
        break;
      case "round":
      default:
        parts.push(`<path d="M ${CX - 22} 172 Q ${CX} 208 ${CX + 22} 172 Z" fill="${inner}"/><path d="M ${CX - 22} 172 Q ${CX} 208 ${CX + 22} 172" fill="none" stroke="${edge}" stroke-width="1.6"/>`);
    }
  }

  // Belt (extra) or wrap tie
  const hasBelt = input.extras.includes("belt") || input.closure === "belt";
  if (hasBelt) {
    const w = shape.waist + 2;
    const beltColor = input.closure === "belt" ? color : mix(color, isDark(color) ? "#ffffff" : "#000000", 0.08);
    parts.push(
      `<path d="M ${CX - w} ${WAIST_Y - 6} Q ${CX} ${WAIST_Y + 2} ${CX + w} ${WAIST_Y - 6} L ${CX + w} ${WAIST_Y + 8} Q ${CX} ${WAIST_Y + 16} ${CX - w} ${WAIST_Y + 8} Z" fill="${beltColor}" stroke="${edge}" stroke-width="1.2"/>`,
    );
    if (view === "front") {
      const kx = CX + 18;
      parts.push(
        `<path d="M ${kx} ${WAIST_Y + 4} q -6 40 -14 92 M ${kx} ${WAIST_Y + 4} q 8 36 12 84" stroke="${beltColor}" stroke-width="7" stroke-linecap="round" fill="none"/>`,
        `<path d="M ${kx} ${WAIST_Y + 4} q -6 40 -14 92 M ${kx} ${WAIST_Y + 4} q 8 36 12 84" stroke="${edge}" stroke-width="0.8" fill="none" opacity="0.7"/>`,
        `<ellipse cx="${kx}" cy="${WAIST_Y + 3}" rx="7" ry="6" fill="${beltColor}" stroke="${edge}" stroke-width="1.2"/>`,
      );
    } else {
      parts.push(`<path d="M ${CX - 14} ${WAIST_Y + 2} q 14 -14 28 0 q -14 14 -28 0 z" fill="${beltColor}" stroke="${edge}" stroke-width="1"/>`);
    }
    if (thread && input.embroidery !== "tone") {
      parts.push(`<path d="M ${CX - w + 4} ${WAIST_Y + 1} Q ${CX} ${WAIST_Y + 9} ${CX + w - 4} ${WAIST_Y + 1}" stroke="${thread}" stroke-width="1.2" fill="none" stroke-dasharray="3 3"/>`);
    }
  }

  // Sleeves
  const sleeveParts: string[] = [];
  if (input.sleeve === "statement") {
    // Cape layer behind slim sleeve
    const cape = `<path d="M ${CX - 62} ${SHOULDER_Y} C ${CX - 120} 230 ${CX - 150} 330 ${CX - 146} 420 Q ${CX - 112} 440 ${CX - 78} 420 C ${CX - 80} 330 ${CX - 70} 250 ${CX - 50} 200 Z" fill="${mix(color, isDark(color) ? "#ffffff" : "#000000", 0.05)}" opacity="${sheer ? 0.75 : 0.96}"/>` +
      `<path d="M ${CX - 146} 420 Q ${CX - 112} 440 ${CX - 78} 420" fill="none" stroke="${edge}" stroke-width="1.4"/>`;
    sleeveParts.push(cape);
  }
  sleeveParts.push(
    `<path d="${sleeve.path}" fill="${color}"/>`,
    `<path d="${sleeve.path}" fill="url(#${p}tex)"/>`,
    `<path d="${sleeve.path}" fill="url(#${p}vshade)"/>`,
    `<path d="${sleeve.path}" fill="none" stroke="${edge}" stroke-width="1.2" opacity="0.8"/>`,
  );
  const [cl, cr] = [sleeve.cuffLeft, sleeve.cuffRight];
  const cuffArc = `M ${cl[0] + 2} ${cl[1] - 10} Q ${sleeve.cuffCenter[0]} ${sleeve.cuffCenter[1] - 2} ${cr[0] - 2} ${cr[1] - 10}`;
  if (input.extras.includes("cuffs")) {
    const cuffColor = isDark(color) ? mix(color, "#ffffff", 0.2) : mix(color, "#000000", 0.25);
    sleeveParts.push(`<path d="${cuffArc}" stroke="${cuffColor}" stroke-width="14" fill="none" stroke-linecap="butt"/>`);
  }
  if (input.sleeve === "embroidered") {
    sleeveParts.push(embroideryStroke(cuffArc, thread ?? "#b9975b", "gold", 0.9));
    sleeveParts.push(embroideryStroke(`M ${cl[0] + 6} ${cl[1] - 34} Q ${sleeve.cuffCenter[0]} ${sleeve.cuffCenter[1] - 26} ${cr[0] - 6} ${cr[1] - 34}`, thread ?? "#b9975b", "gold", 0.7));
  } else if (thread) {
    sleeveParts.push(embroideryStroke(cuffArc, thread, input.embroidery, 0.8));
  }
  if (input.extras.includes("sleeve_detail")) {
    const [x1, y1, x2, y2] = sleeve.upperBand;
    const band = thread ?? (isDark(color) ? mix(color, "#ffffff", 0.3) : mix(color, "#000000", 0.3));
    sleeveParts.push(`<path d="M ${x1} ${y1} Q ${r1((x1 + x2) / 2)} ${r1(y1 + 8)} ${x2} ${y2}" stroke="${band}" stroke-width="6" fill="none" opacity="0.9"/>`);
    sleeveParts.push(`<path d="M ${x1} ${y1 + 9} Q ${r1((x1 + x2) / 2)} ${r1(y1 + 17)} ${x2} ${y2 + 9}" stroke="${band}" stroke-width="1.2" fill="none" stroke-dasharray="2 3"/>`);
  }
  const sleeveSvg = sleeveParts.join("");
  parts.push(sleeveSvg, mirror(sleeveSvg));

  // Head & shayla on top
  parts.push(figureHead(view, shaylaColor, edge));

  const title = opts.title ? `<title>${opts.title.replace(/[<>&"]/g, "")}</title>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${CROPS[crop]}" preserveAspectRatio="xMidYMid ${crop === "full" ? "meet" : "slice"}" role="img">${title}${defs(p, input, hy)}${parts.join("")}</svg>`;
}

/** Draped fabric swatch for fabric & color cards. */
export function renderSwatchSvg(
  input: { colorHex: string; sheen: number; texture: Texture },
  idPrefix = "sw",
): string {
  const p = idPrefix + "-";
  const color = safeHex(input.colorHex);
  const satin = input.texture === "satin" ? 2 : input.texture === "matte" ? 0.5 : 1;
  const hi = r1(Math.min(0.5, 0.14 * input.sheen * satin + (isDark(color) ? 0.06 : 0.02)));
  const tex =
    input.texture === "linen"
      ? `<pattern id="${p}t" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 1h3M1 0v3" stroke="#fff" stroke-width="0.45" opacity="0.16"/><path d="M0 2.5h3" stroke="#000" stroke-width="0.4" opacity="0.14"/></pattern>`
      : `<pattern id="${p}t" width="2.5" height="2.5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.45" fill="#fff" opacity="${input.texture === "sheer" ? 0 : 0.05}"/></pattern>`;
  const folds = [
    "M -10 30 C 40 20 60 70 120 60 S 190 90 220 80",
    "M -10 80 C 30 70 70 120 120 110 S 190 140 220 130",
    "M -10 130 C 40 120 60 170 120 160 S 190 190 220 180",
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><defs>
<linearGradient id="${p}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${hi}"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></linearGradient>
${tex}
<filter id="${p}b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
</defs>
<rect width="200" height="200" fill="${color}"/>
${input.texture === "sheer" ? `<rect width="200" height="200" fill="#fff" opacity="0.12"/><path d="M0 0 L200 200" stroke="#fff" stroke-opacity="0.1" stroke-width="60"/>` : ""}
<rect width="200" height="200" fill="url(#${p}t)"/>
<g filter="url(#${p}b)">${folds.map((d) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${r1(hi * 1.4)}" stroke-width="22"/><path d="${d}" fill="none" stroke="#000" stroke-opacity="0.32" stroke-width="16" transform="translate(0 20)"/>`).join("")}</g>
<rect width="200" height="200" fill="url(#${p}g)"/>
</svg>`;
}
