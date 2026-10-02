import { NextResponse } from "next/server";
import { NotFoundError, ValidationError } from "../services/catalog";
import { currentMerchant } from "../services/auth";

export const json = <T,>(data: T, init?: number | ResponseInit) =>
  NextResponse.json(data, typeof init === "number" ? { status: init } : init);

export function errorResponse(err: unknown) {
  if (err instanceof ValidationError) return json({ error: err.message, details: err.details }, 422);
  if (err instanceof NotFoundError) return json({ error: err.message }, 404);
  if (err instanceof UnauthorizedError) return json({ error: "يلزم تسجيل الدخول" }, 401);
  console.error(err);
  return json({ error: "حدث خطأ غير متوقع" }, 500);
}

export class UnauthorizedError extends Error {}

/** Wrap a route handler with uniform error handling. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    throw new ValidationError("طلب غير صالح");
  }
}

export async function requireMerchant() {
  const m = await currentMerchant();
  if (!m) throw new UnauthorizedError();
  return m;
}

/** Tiny in-memory fixed-window rate limiter (per process). */
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  b.n++;
  return b.n <= limit;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
