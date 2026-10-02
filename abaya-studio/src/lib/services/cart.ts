import { cookies } from "next/headers";
import { randomId } from "../ids";
import type { Cart } from "../models";
import { getRepo } from "../store";
import { NotFoundError, ValidationError } from "./catalog";

export const CART_COOKIE = "as_cart";

export async function readCart(storeId: string): Promise<Cart> {
  const jar = await cookies();
  const id = jar.get(CART_COOKIE)?.value;
  const repo = await getRepo();
  const existing = id ? await repo.getCart(id) : null;
  if (existing && existing.storeId === storeId) return existing;
  return { id: randomId("c_"), storeId, items: [], updatedAt: new Date().toISOString() };
}

async function persist(cart: Cart) {
  const repo = await getRepo();
  cart.updatedAt = new Date().toISOString();
  await repo.saveCart(cart);
  const jar = await cookies();
  jar.set(CART_COOKIE, cart.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" });
}

export async function addToCart(storeId: string, designCode: string, size: string, quantity = 1): Promise<Cart> {
  const repo = await getRepo();
  const design = await repo.getDesignByCode(designCode);
  if (!design || design.storeId !== storeId) throw new NotFoundError("التصميم غير موجود");
  const catalog = await repo.getCatalog(storeId);
  if (!catalog?.sizeChart.some((r) => r.size === size)) throw new ValidationError("اختاري مقاسًا صحيحًا");
  const qty = Math.max(1, Math.min(10, Math.floor(quantity)));
  const cart = await readCart(storeId);
  const line = cart.items.find((i) => i.designCode === designCode && i.size === size);
  if (line) line.quantity = Math.min(10, line.quantity + qty);
  else cart.items.push({ id: randomId("ci_"), designCode, size, quantity: qty, unitPrice: design.price.total, addedAt: new Date().toISOString() });
  await persist(cart);
  if (design.status !== "ordered") {
    await repo.updateDesign(designCode, { status: "in_cart", cartAddedAt: design.cartAddedAt ?? new Date().toISOString() });
  }
  return cart;
}

export async function removeFromCart(storeId: string, itemId: string): Promise<Cart> {
  const cart = await readCart(storeId);
  cart.items = cart.items.filter((i) => i.id !== itemId);
  await persist(cart);
  return cart;
}

export async function checkout(storeId: string) {
  const cart = await readCart(storeId);
  if (cart.items.length === 0) throw new ValidationError("السلة فارغة");
  const repo = await getRepo();
  const now = new Date().toISOString();
  const order = await repo.createOrder({
    id: randomId("o_"),
    number: `${Date.now().toString().slice(-6)}`,
    storeId,
    cartId: cart.id,
    items: cart.items,
    total: cart.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    createdAt: now,
  });
  for (const i of cart.items) await repo.updateDesign(i.designCode, { status: "ordered", orderedAt: now });
  cart.items = [];
  await persist(cart);
  return order;
}
