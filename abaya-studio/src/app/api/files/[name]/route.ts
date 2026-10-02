import { getFile } from "@/lib/storage";

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const bytes = await getFile(name);
  if (!bytes) return new Response("not found", { status: 404 });
  const type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return new Response(bytes as BodyInit, { headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" } });
}
