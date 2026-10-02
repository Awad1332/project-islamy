/**
 * Image generation providers. The provider only receives a prompt compiled
 * from a validated configuration — it never decides specifications.
 */
import type { DesignConfig } from "../engine/types";
import type { BuiltPrompt } from "../engine/prompt";
import { randomId } from "../ids";
import { putFile } from "../storage";

export interface GenerateRequest {
  storeId: string;
  config: DesignConfig;
  built: BuiltPrompt;
}

export interface GeneratedImage {
  url: string;
  provider: string;
  /** true when this is a rendered illustration rather than a model photo. */
  illustrative: boolean;
}

export interface ImageProvider {
  id: string;
  generate(req: GenerateRequest): Promise<GeneratedImage>;
}

function encodeConfig(config: DesignConfig): string {
  return Buffer.from(JSON.stringify(config)).toString("base64url");
}

/** Always available: renders the parametric studio illustration. */
export const illustrationProvider: ImageProvider = {
  id: "studio-illustration",
  async generate({ storeId, config, built }) {
    // Small delay so the generating state is perceivable but brief.
    await new Promise((r) => setTimeout(r, 900));
    const q = new URLSearchParams({ store: storeId, c: encodeConfig(config), view: built.view, mode: "photo" });
    return { url: `/api/render?${q}`, provider: this.id, illustrative: true };
  },
};

/** OpenAI Images API (gpt-image-1 by default). Enabled with OPENAI_API_KEY. */
export const openAIProvider: ImageProvider = {
  id: "openai",
  async generate({ built }) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
        prompt: `${built.prompt}\nAvoid: ${built.negativePrompt}.`,
        size: "1024x1536",
        n: 1,
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) throw new Error(`image API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
    const item = json.data?.[0];
    let bytes: Uint8Array;
    if (item?.b64_json) bytes = Buffer.from(item.b64_json, "base64");
    else if (item?.url) bytes = new Uint8Array(await (await fetch(item.url)).arrayBuffer());
    else throw new Error("image API returned no image");
    const url = await putFile(`${randomId("img_")}.png`, bytes);
    return { url, provider: this.id, illustrative: false };
  },
};

export function activeProvider(): ImageProvider {
  const choice = process.env.AI_IMAGE_PROVIDER ?? (process.env.OPENAI_API_KEY ? "openai" : "illustration");
  return choice === "openai" ? openAIProvider : illustrationProvider;
}
