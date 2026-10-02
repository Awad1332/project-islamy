import { activeProvider, illustrationProvider } from "../ai/providers";
import { buildPrompt, type View } from "../engine/prompt";
import type { StoreCatalog } from "../engine/types";
import type { DesignImage } from "../models";
import { requireValidConfig } from "./designs";

export const VISUAL_DISCLAIMER = "الصورة تصور بصري تقريبي، وقد تختلف الخامة والمقاسات الفعلية قليلًا عن العرض.";

export async function visualize(catalog: StoreCatalog, rawConfig: unknown, views: View[] = ["front", "back"]) {
  const config = requireValidConfig(catalog, rawConfig);
  const provider = activeProvider();
  const prompts = views.map((v) => buildPrompt(catalog, config, v));
  const images: DesignImage[] = await Promise.all(
    prompts.map(async (built) => {
      try {
        const img = await provider.generate({ storeId: catalog.storeId, config, built });
        return { view: built.view, ...img };
      } catch (err) {
        // Never leave the customer without a visual: fall back to the illustration.
        console.error(`[visualize] ${provider.id} failed:`, err);
        const img = await illustrationProvider.generate({ storeId: catalog.storeId, config, built });
        return { view: built.view, ...img };
      }
    }),
  );
  return {
    config,
    images,
    prompt: prompts[0].prompt,
    spec: prompts[0].spec,
    provider: provider.id,
    disclaimer: VISUAL_DISCLAIMER,
  };
}
