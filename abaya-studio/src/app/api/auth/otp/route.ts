import { clientIp, handler, json, rateLimit, readJson } from "@/lib/http";
import { normalizeEmail, requestOtp } from "@/lib/services/auth";

export const POST = handler(async (req: Request) => {
  if (!rateLimit(`otp:${clientIp(req)}`, 8, 10 * 60_000)) return json({ error: "محاولات كثيرة، حاولي لاحقًا." }, 429);
  const body = await readJson(req);
  const email = normalizeEmail(body.email);
  if (!email) return json({ error: "أدخلي بريدًا إلكترونيًا صحيحًا" }, 422);
  const r = await requestOtp(email);
  return r.ok ? json({ ok: true, devCode: r.devCode }) : json({ error: r.error }, 429);
});
