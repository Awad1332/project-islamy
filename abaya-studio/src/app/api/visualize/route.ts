import { clientIp, handler, json, rateLimit, readJson } from "@/lib/http";
import { loadCatalog } from "@/lib/services/catalog";
import { visualize } from "@/lib/services/visualize";

export const maxDuration = 120;

export const POST = handler(async (req: Request) => {
  if (!rateLimit(`viz:${clientIp(req)}`, 12, 60_000)) {
    return json({ error: "طلبات كثيرة، حاولي بعد دقيقة." }, 429);
  }
  const body = await readJson(req);
  const catalog = await loadCatalog(body.store as string);
  const views = body.views === "front" ? (["front"] as const) : (["front", "back"] as const);
  return json(await visualize(catalog, body.config, [...views]));
});
