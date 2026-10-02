/**
 * Deterministic demo data so the merchant dashboard has realistic signal.
 */
import { createDemoCatalog } from "../engine/catalog";
import { buildSku, defaultConfig, normalize } from "../engine/config";
import { priceConfig } from "../engine/pricing";
import { sizeFromLength } from "../engine/size";
import type { DesignConfig, StoreCatalog } from "../engine/types";
import type { SavedDesign } from "../models";
import type { Repository } from "./repository";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Weights = Record<string, number>;

function pick(rand: () => number, w: Weights): string {
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (const [k, v] of Object.entries(w)) {
    r -= v;
    if (r <= 0) return k;
  }
  return Object.keys(w)[0];
}

const W = {
  cut: { wide: 38, aline: 22, straight: 16, cloche: 12, bisht: 9, custom: 3 },
  length: { "130": 5, "135": 12, "140": 26, "145": 42, "150": 15 },
  sleeve: { flare: 31, regular: 22, wide: 20, embroidered: 12, straight: 9, statement: 6 },
  neckline: { round: 40, v: 28, collarless: 14, square: 10, collar: 8 },
  closure: { open: 46, snaps: 18, buttons: 16, zipper: 12, belt: 8 },
  fabric: { crepe: 44, nida: 30, linen: 9, silk: 10, chiffon: 7 },
  color: { black: 67, matte_black: 10, beige: 8, brown: 6, grey: 4, navy: 4, olive: 1 },
  embroidery: { none: 42, gold: 31, tone: 14, silver: 9, pearl: 4 },
};

/** Designs created in the last `days`, trending upward. */
export function generateDemoDesigns(catalog: StoreCatalog, count: number, days: number, now = Date.now()): SavedDesign[] {
  const rand = mulberry32(42);
  const base = defaultConfig(catalog);
  const out: SavedDesign[] = [];
  for (let i = 0; i < count; i++) {
    // Skew toward recent days (growth) and shift tastes slightly over time.
    // Moderate growth: part of the demand skews toward recent days.
    const r0 = rand();
    const age = Math.floor(days * (rand() < 0.35 ? 1 - Math.sqrt(r0) : r0));
    const recent = age < 30;
    const createdAt = new Date(now - age * 86_400_000 - Math.floor(rand() * 86_400_000));
    const raw: DesignConfig = {
      ...base,
      cut: pick(rand, W.cut),
      length: pick(rand, W.length),
      sleeve: pick(rand, recent ? { ...W.sleeve, flare: 38 } : W.sleeve),
      neckline: pick(rand, W.neckline),
      closure: pick(rand, W.closure),
      fabric: pick(rand, recent ? { ...W.fabric, nida: 36 } : W.fabric),
      color: pick(rand, recent ? W.color : { ...W.color, beige: 4, black: 70 }),
      embroidery: pick(rand, recent ? { ...W.embroidery, gold: 36 } : W.embroidery),
      extras: (["belt", "pockets", "cuffs", "sleeve_detail", "hem_trim"] as const).filter(
        (_, j) => rand() < [0.28, 0.22, 0.1, 0.08, 0.12][j],
      ),
    };
    const { config } = normalize(catalog, raw);
    const price = priceConfig(catalog, config);
    const r = rand();
    const ordered = r < 0.112;
    const inCart = ordered || r < 0.254;
    const iso = createdAt.toISOString();
    const later = (h: number) => new Date(createdAt.getTime() + h * 3_600_000).toISOString();
    const lengthCm = Number(config.length);
    const row = sizeFromLength(catalog, lengthCm);
    out.push({
      id: `seed_${i}`,
      code: `AB${(9000 - i).toString().padStart(5, "0")}`,
      storeId: catalog.storeId,
      config,
      sku: buildSku(catalog, config),
      price,
      size: { size: row.size, confidence: "medium", summary: "" },
      images: [],
      status: ordered ? "ordered" : inCart ? "in_cart" : rand() < 0.4 ? "saved" : "draft",
      createdAt: iso,
      updatedAt: iso,
      cartAddedAt: inCart ? later(0.5) : undefined,
      orderedAt: ordered ? later(2) : undefined,
    });
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function seedDemo(repo: Repository, storeId = "demo") {
  const catalog = createDemoCatalog(storeId);
  await repo.saveCatalog(catalog);
  await repo.saveMerchant({ email: "owner@demo.sa", storeId, name: "مالكة المتجر" });
  for (const d of generateDemoDesigns(catalog, 2190, 60)) await repo.createDesign(d);
}
