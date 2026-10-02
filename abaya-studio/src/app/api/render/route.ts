import { parseConfig, normalize } from "@/lib/engine/config";
import { renderAbayaSvg, type Crop } from "@/lib/render/abaya";
import { renderInputFromConfig } from "@/lib/render/resolve";
import { loadCatalog } from "@/lib/services/catalog";
import { getRepo } from "@/lib/store";

const CROPS: Crop[] = ["full", "upper", "neck", "torso", "waist", "hem", "sleeve"];

/** Server-rendered SVG of a configuration (or saved design via ?design=CODE). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  try {
    let storeId = q.get("store");
    let raw: unknown = null;
    const code = q.get("design");
    if (code) {
      const d = await (await getRepo()).getDesignByCode(code);
      if (!d) return new Response("not found", { status: 404 });
      raw = d.config;
      storeId = d.storeId;
    } else {
      raw = JSON.parse(Buffer.from(q.get("c") ?? "", "base64url").toString("utf8"));
    }
    const catalog = await loadCatalog(storeId);
    const parsed = parseConfig(raw);
    if (!parsed) return new Response("bad config", { status: 400 });
    const { config } = normalize(catalog, parsed);
    const crop = CROPS.find((c) => c === q.get("crop")) ?? "full";
    const svg = renderAbayaSvg(renderInputFromConfig(catalog, config), {
      view: q.get("view") === "back" ? "back" : "front",
      mode: q.get("mode") === "photo" ? "photo" : "studio",
      crop,
      idPrefix: "r",
    });
    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=86400, immutable",
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  } catch {
    return new Response("bad request", { status: 400 });
  }
}
