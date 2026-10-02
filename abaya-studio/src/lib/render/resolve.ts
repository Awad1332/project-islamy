import { optionFor } from "../engine/config";
import type { DesignConfig, OptionGroup, StoreCatalog } from "../engine/types";
import type { RenderInput, Texture } from "./abaya";

/** Map a configuration to renderer inputs (honoring merchant `renderAs` hints). */
export function renderInputFromConfig(catalog: StoreCatalog, config: DesignConfig): RenderInput {
  const shape = (g: OptionGroup, code: string) => {
    const o = optionFor(catalog, g, code);
    return o?.visual?.renderAs ?? code;
  };
  const color = optionFor(catalog, "color", config.color)?.visual;
  const fabric = optionFor(catalog, "fabric", config.fabric)?.visual;
  const emb = optionFor(catalog, "embroidery", config.embroidery);
  const length = optionFor(catalog, "length", config.length)?.visual?.cm ?? Number(config.length);
  return {
    cut: shape("cut", config.cut),
    lengthCm: Number.isFinite(length) ? length : 145,
    sleeve: shape("sleeve", config.sleeve),
    neckline: shape("neckline", config.neckline),
    closure: shape("closure", config.closure),
    texture: (fabric?.texture ?? fabric?.renderAs ?? "matte") as Texture,
    colorHex: color?.hex ?? "#141414",
    sheen: color?.sheen ?? 0.4,
    embroidery: emb?.visual?.renderAs ?? config.embroidery,
    threadHex: emb?.visual?.thread,
    extras: config.extras.map((c) => shape("extra", c)),
  };
}
