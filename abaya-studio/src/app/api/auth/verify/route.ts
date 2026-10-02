import { cookies } from "next/headers";
import { clientIp, handler, json, rateLimit, readJson } from "@/lib/http";
import { normalizeEmail, verifyOtp } from "@/lib/services/auth";
import { SESSION_COOKIE, SESSION_TTL_S, signSession } from "@/lib/session";

export const POST = handler(async (req: Request) => {
  if (!rateLimit(`verify:${clientIp(req)}`, 20, 10 * 60_000)) return json({ error: "محاولات كثيرة، حاولي لاحقًا." }, 429);
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  if (!email || typeof body.code !== "string") return json({ error: "بيانات ناقصة" }, 422);
  const r = await verifyOtp(email, body.code);
  if (!r.ok) return json({ error: r.error }, 401);
  const token = await signSession({ email, storeId: r.storeId });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_S,
  });
  return json({ ok: true });
});
