/**
 * AI Prompt Builder.
 *
 * Converts a *validated* configuration into a structured spec and a prompt for
 * the image model. The model never decides specifications — it only renders
 * what the Configuration Engine produced.
 */
import { optionFor } from "./config";
import type { DesignConfig, StoreCatalog } from "./types";

export type View = "front" | "back" | "side";

export interface VisualSpec {
  cut: string;
  lengthCm: number;
  sleeves: string;
  neckline: string;
  closure: string;
  fabric: string;
  color: string;
  embroidery: string;
  extras: string[];
}

export interface BuiltPrompt {
  spec: VisualSpec;
  prompt: string;
  negativePrompt: string;
  view: View;
}

const frag = (catalog: StoreCatalog, group: Parameters<typeof optionFor>[1], code: string) => {
  const o = optionFor(catalog, group, code);
  return o ? (o.prompt ?? o.nameEn) : code;
};

function hemDescription(cm: number): string {
  if (cm <= 132) return "ending just above the ankles";
  if (cm <= 142) return "reaching the ankles";
  return "falling gracefully to the floor";
}

const VIEW_TEXT: Record<View, string> = {
  front: "front view, model facing the camera",
  back: "back view, model facing away from the camera showing the back of the abaya",
  side: "three-quarter side view",
};

export function buildPrompt(catalog: StoreCatalog, config: DesignConfig, view: View = "front"): BuiltPrompt {
  const lengthCm = optionFor(catalog, "length", config.length)?.visual?.cm ?? Number(config.length);
  const spec: VisualSpec = {
    cut: frag(catalog, "cut", config.cut),
    lengthCm,
    sleeves: frag(catalog, "sleeve", config.sleeve),
    neckline: frag(catalog, "neckline", config.neckline),
    closure: frag(catalog, "closure", config.closure),
    fabric: frag(catalog, "fabric", config.fabric),
    color: frag(catalog, "color", config.color),
    embroidery: frag(catalog, "embroidery", config.embroidery),
    extras: config.extras.map((c) => frag(catalog, "extra", c)),
  };

  const details = [
    `${lengthCm} cm length ${hemDescription(lengthCm)}`,
    spec.sleeves,
    spec.neckline,
    spec.closure,
    `made of ${spec.fabric}`,
    spec.embroidery,
    ...spec.extras,
  ];

  const prompt = [
    `Saudi/Gulf female fashion model wearing a premium ${spec.color} ${spec.cut} abaya`,
    details.join(", "),
    `matching ${spec.color} shayla headscarf, modest styling`,
    "elegant luxury Saudi fashion photography, full body, realistic fabric texture",
    "neutral warm studio background, soft diffused lighting",
    VIEW_TEXT[view],
  ].join(". ") + ".";

  const negativePrompt = [
    "revealing clothing",
    "different garment color than specified",
    "patterns or prints not specified",
    "cropped feet",
    "distorted body",
    "extra limbs",
    "text",
    "watermark",
    "logo",
  ].join(", ");

  return { spec, prompt, negativePrompt, view };
}
