import { z } from "zod";
import { handler, json, readJson, requireMerchant } from "@/lib/http";
import { NotFoundError, ValidationError } from "@/lib/services/catalog";
import { getRepo } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000),
    price: z.number().int().min(0).max(100000),
    sku: z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9-]+$/),
    sizes: z.array(z.string().max(10)).max(30),
    status: z.enum(["draft", "published"]),
  })
  .partial();

async function own(id: string) {
  const m = await requireMerchant();
  const repo = await getRepo();
  const p = await repo.getProduct(id);
  if (!p || p.storeId !== m.storeId) throw new NotFoundError("المنتج غير موجود");
  return { repo, p };
}

export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { repo, p } = await own(id);
  const parsed = patchSchema.safeParse(await readJson(req));
  if (!parsed.success) throw new ValidationError("بيانات غير صالحة", parsed.error.flatten());
  const next = { ...p, ...parsed.data, updatedAt: new Date().toISOString() };
  await repo.saveProduct(next);
  return json(next);
});

export const DELETE = handler(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { repo } = await own(id);
  await repo.deleteProduct(id);
  return json({ ok: true });
});
