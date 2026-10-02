import { describe, expect, it } from "vitest";
import { createDemoCatalog } from "./catalog";
import { areCompatible, buildSku, defaultConfig, evaluateOption, normalize, optionById, parseConfig, select, validateConfig } from "./config";
import { priceConfig } from "./pricing";
import { buildPrompt } from "./prompt";
import { recommendLength, recommendSize } from "./size";
import { distribution, kpis, topCombinations } from "./analytics";
import { generateDemoDesigns } from "../store/seed";

const cat = createDemoCatalog();
const base = defaultConfig(cat);

describe("configuration engine", () => {
  it("default config is valid", () => {
    expect(validateConfig(cat, base).valid).toBe(true);
    expect(base.length).toBe("145");
    expect(base.embroidery).toBe("none");
  });

  it("blocks an embroidery incompatible with an earlier cut", () => {
    const r = select(cat, base, "cut", "cloche");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const s = select(cat, r.config, "embroidery", "pearl");
    expect(s.ok).toBe(false);
    if (s.ok) return;
    expect(s.reason).toBe("هذا التطريز غير متوفر مع هذه القصة (كلوش).");
  });

  it("changing an earlier step replaces conflicting later selections", () => {
    const withPearl = select(cat, base, "embroidery", "pearl");
    expect(withPearl.ok).toBe(true);
    if (!withPearl.ok) return;
    const r = select(cat, withPearl.config, "cut", "cloche");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.config.embroidery).toBe("none");
    expect(r.adjustments[0].group).toBe("embroidery");
    expect(validateConfig(cat, r.config).valid).toBe(true);
  });

  it("whitelists: bisht only allows open or snap closures", () => {
    const withButtons = { ...base, closure: "buttons" };
    const r = select(cat, withButtons, "cut", "bisht");
    expect(r.ok && r.config.closure).toBe("open");
    if (!r.ok) return;
    const z = evaluateOption(cat, r.config, optionById(cat, "closure.zipper")!);
    expect(z.status).toBe("incompatible");
  });

  it("is symmetric", () => {
    const a = optionById(cat, "closure.belt")!;
    const b = optionById(cat, "extra.belt")!;
    expect(areCompatible(a, b)).toBe(false);
    expect(areCompatible(b, a)).toBe(false);
  });

  it("unavailable options cannot be selected", () => {
    const r = select(cat, base, "color", "burgundy");
    expect(r.ok).toBe(false);
  });

  it("toggles extras", () => {
    const on = select(cat, base, "extra", "belt");
    expect(on.ok && on.config.extras).toEqual(["belt"]);
    if (!on.ok) return;
    const off = select(cat, on.config, "extra", "belt");
    expect(off.ok && off.config.extras).toEqual([]);
  });

  it("validation catches tampered configs", () => {
    const bad = { ...base, cut: "cloche", embroidery: "pearl" };
    const v = validateConfig(cat, bad);
    expect(v.valid).toBe(false);
    // Earlier steps win: cut is kept, the incompatible embroidery is dropped.
    const fixed = normalize(cat, bad);
    expect(fixed.config.cut).toBe("cloche");
    expect(fixed.config.embroidery).toBe("none");
  });

  it("parses untrusted input", () => {
    expect(parseConfig(null)).toBeNull();
    expect(parseConfig({ ...base, length: 145 })?.length).toBe("145");
    expect(parseConfig({ ...base, cut: 3 })).toBeNull();
  });

  it("builds a deterministic SKU", () => {
    expect(buildSku(cat, base)).toMatch(/^ABY-/);
    expect(buildSku(cat, base)).toBe(buildSku(cat, { ...base }));
  });
});

describe("pricing engine", () => {
  it("matches the spec example: 249 + 80 + 35 = 364", () => {
    const cfg = { ...base, cut: "wide", embroidery: "gold", extras: ["belt"] };
    const p = priceConfig(cat, cfg);
    expect(p.base).toBe(249);
    expect(p.total).toBe(364);
    expect(p.lines.map((l) => l.amount)).toEqual([80, 35]);
  });

  it("adds special sleeve: 404", () => {
    const cfg = { ...base, cut: "wide", embroidery: "gold", extras: ["belt", "sleeve_detail"] };
    expect(priceConfig(cat, cfg).total).toBe(404);
  });
});

describe("prompt builder", () => {
  it("encodes every spec field", () => {
    const cfg = { ...base, cut: "wide", sleeve: "flare", neckline: "v", embroidery: "gold" };
    const { prompt, spec } = buildPrompt(cat, cfg);
    expect(spec.lengthCm).toBe(145);
    expect(prompt).toContain("black loose wide-cut flowing abaya");
    expect(prompt).toContain("145 cm length");
    expect(prompt).toContain("flared bell sleeves");
    expect(prompt).toContain("V neckline");
    expect(prompt).toContain("gold thread embroidery");
    expect(prompt).toContain("matte crepe");
  });
});

describe("size engine", () => {
  it("recommends 56 for 165cm, wide cut, no heels", () => {
    const r = recommendSize(cat, { heightCm: 165, cut: "wide", cutName: "واسعة", heels: "never", fit: "loose" });
    expect(r.size).toBe("56");
    expect(r.summary).toContain("نقترح مقاس 56");
  });

  it("high confidence when usual size and history agree", () => {
    const r = recommendSize(cat, { heightCm: 163, usualSize: "56", previous: { size: "56", result: "good" } });
    expect(r.size).toBe("56");
    expect(r.confidence).toBe("high");
  });

  it("history overrides formula when previous was short", () => {
    const r = recommendSize(cat, { heightCm: 163, previous: { size: "56", result: "short" } });
    expect(r.size).toBe("58");
  });

  it("low confidence when far outside chart", () => {
    const r = recommendSize(cat, { heightCm: 190, usualSize: "52" });
    expect(r.confidence).toBe("low");
  });

  it("length helper", () => {
    const r = recommendLength(cat, [130, 135, 140, 145, 150], { heightCm: 165, heels: "always" });
    expect(r.lengthCm).toBe(145);
  });
});

describe("analytics", () => {
  const designs = generateDemoDesigns(cat, 800, 60, Date.parse("2026-10-01T00:00:00Z"));
  const facts = designs.map((d) => ({ config: d.config, total: d.price.total, createdAt: d.createdAt, cartAddedAt: d.cartAddedAt, orderedAt: d.orderedAt }));
  it("all seeded designs are valid", () => {
    for (const d of designs) expect(validateConfig(cat, d.config).valid).toBe(true);
  });
  it("computes kpis and distributions", () => {
    const k = kpis(facts);
    expect(k.designs).toBe(800);
    expect(k.addedToCart).toBeGreaterThan(k.ordered);
    const colors = distribution(cat, facts, "color");
    expect(colors[0].code).toBe("black");
    expect(topCombinations(cat, facts, 1)[0].parts).toHaveLength(5);
  });
});
