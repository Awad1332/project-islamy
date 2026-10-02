import { handler, json } from "@/lib/http";
import { loadCatalog } from "@/lib/services/catalog";

export const GET = handler(async (req: Request) => {
  const store = new URL(req.url).searchParams.get("store");
  const catalog = await loadCatalog(store);
  return json(catalog);
});
