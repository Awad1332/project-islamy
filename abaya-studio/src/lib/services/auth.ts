import { cookies } from "next/headers";
import { DEFAULT_STORE, getRepo } from "../store";
import { hashOtp, SESSION_COOKIE, verifySession, type SessionPayload } from "../session";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function normalizeEmail(e: unknown): string | null {
  if (typeof e !== "string") return null;
  const v = e.trim().toLowerCase();
  return EMAIL.test(v) ? v : null;
}

/** Whether new merchant emails may sign in (demo / onboarding). */
function openSignup() {
  return process.env.MERCHANT_SIGNUP === "open" || (process.env.NODE_ENV !== "production" && process.env.MERCHANT_SIGNUP !== "closed");
}

async function sendOtpEmail(email: string, code: string) {
  // Integrate an email provider (SES, Resend, Postmark…) here.
  console.info(`[auth] OTP for ${email}: ${code}`);
}

export async function requestOtp(email: string): Promise<{ ok: boolean; devCode?: string; error?: string }> {
  const repo = await getRepo();
  let merchant = await repo.getMerchant(email);
  if (!merchant) {
    if (!openSignup()) return { ok: true }; // do not reveal which emails exist
    merchant = { email, storeId: DEFAULT_STORE, name: email.split("@")[0] };
    await repo.saveMerchant(merchant);
  }
  const existing = await repo.getOtp(email);
  if (existing && existing.expiresAt - OTP_TTL_MS + 30_000 > Date.now()) {
    return { ok: false, error: "انتظري قليلًا قبل طلب رمز جديد." };
  }
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  await repo.putOtp({ email, codeHash: await hashOtp(email, code), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  await sendOtpEmail(email, code);
  const echo = process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "1";
  return { ok: true, devCode: echo ? code : undefined };
}

export async function verifyOtp(email: string, code: string): Promise<{ ok: true; storeId: string } | { ok: false; error: string }> {
  const repo = await getRepo();
  const rec = await repo.getOtp(email);
  if (!rec || rec.expiresAt < Date.now()) return { ok: false, error: "انتهت صلاحية الرمز، اطلبي رمزًا جديدًا." };
  if (rec.attempts >= MAX_ATTEMPTS) return { ok: false, error: "محاولات كثيرة، اطلبي رمزًا جديدًا." };
  const hash = await hashOtp(email, code.trim());
  if (hash !== rec.codeHash) {
    await repo.putOtp({ ...rec, attempts: rec.attempts + 1 });
    return { ok: false, error: "الرمز غير صحيح." };
  }
  await repo.deleteOtp(email);
  const merchant = await repo.getMerchant(email);
  if (!merchant) return { ok: false, error: "الحساب غير موجود." };
  return { ok: true, storeId: merchant.storeId };
}

export async function currentMerchant(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}
