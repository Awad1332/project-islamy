import { handler, json, readJson } from "@/lib/http";
import { addToCart, readCart, removeFromCart } from "@/lib/services/cart";
import { DEFAULT_STORE } from "@/lib/store";

export const GET = handler(async () => json(await readCart(DEFAULT_STORE)));

export const POST = handler(async (req: Request) => {
  const body = await readJson(req);
  const cart = await addToCart(DEFAULT_STORE, String(body.designCode ?? ""), String(body.size ?? ""), Number(body.quantity ?? 1));
  return json(cart);
});

export const DELETE = handler(async (req: Request) => {
  const id = new URL(req.url).searchParams.get("item") ?? "";
  return json(await removeFromCart(DEFAULT_STORE, id));
});
