import { handler, json, readJson } from "@/lib/http";
import { loadCatalog } from "@/lib/services/catalog";
import { createDesign } from "@/lib/services/designs";
import type { SizeInput } from "@/lib/engine/size";
import type { DesignImage } from "@/lib/models";

export const POST = handler(async (req: Request) => {
  const body = await readJson(req);
  const catalog = await loadCatalog(body.store as string);
  const design = await createDesign(catalog, body.config, {
    size: (body.size as SizeInput) ?? null,
    images: Array.isArray(body.images) ? (body.images as DesignImage[]) : [],
    prompt: typeof body.prompt === "string" ? body.prompt.slice(0, 2000) : undefined,
    status: body.status === "draft" ? "draft" : "saved",
  });
  return json(design, 201);
});
