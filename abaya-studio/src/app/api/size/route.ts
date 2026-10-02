import { recommendSize, CONFIDENCE_LABEL, type SizeInput } from "@/lib/engine/size";
import { optionFor } from "@/lib/engine/config";
import { handler, json, readJson } from "@/lib/http";
import { loadCatalog, ValidationError } from "@/lib/services/catalog";

export const POST = handler(async (req: Request) => {
  const body = await readJson(req);
  const catalog = await loadCatalog(body.store as string);
  const input = body.input as SizeInput | undefined;
  const h = Number(input?.heightCm);
  if (!input || !Number.isFinite(h) || h < 120 || h > 210) throw new ValidationError("أدخلي طولًا بين 120 و210 سم");
  const cut = typeof body.cut === "string" ? body.cut : undefined;
  const rec = recommendSize(catalog, { ...input, heightCm: h, cut, cutName: cut ? optionFor(catalog, "cut", cut)?.name : undefined });
  return json({ ...rec, confidenceLabel: CONFIDENCE_LABEL[rec.confidence] });
});
