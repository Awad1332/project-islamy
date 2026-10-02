"use client";

import { useState } from "react";
import { Button } from "../ui";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("owner@demo.sa");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const post = async (url: string, body: object) => {
    setBusy(true);
    setError(null);
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(json.error ?? "حدث خطأ");
    return res.ok ? json : null;
  };

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (stage === "email") {
          const r = await post("/api/auth/otp", { email });
          if (r) {
            setStage("code");
            setDevCode(r.devCode ?? null);
          }
        } else {
          const r = await post("/api/auth/verify", { email, code });
          if (r) window.location.href = next;
        }
      }}
    >
      {stage === "email" ? (
        <label className="block text-sm">
          <span className="mb-1 block text-muted">البريد الإلكتروني</span>
          <input type="email" required dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-line-2 bg-paper px-3 outline-none focus:border-ink" autoComplete="email" />
        </label>
      ) : (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">رمز الدخول المرسل إلى <span dir="ltr">{email}</span></span>
            <input inputMode="numeric" autoComplete="one-time-code" required maxLength={6} dir="ltr" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="num h-14 w-full rounded-xl border border-line-2 bg-paper text-center text-2xl tracking-[0.5em] outline-none focus:border-ink" autoFocus />
          </label>
          {devCode && (
            <p className="rounded-xl bg-gold-soft p-3 text-xs text-ink-2">
              وضع التجربة: الرمز هو <span className="num font-semibold" dir="ltr">{devCode}</span> (يُرسل بالبريد في الإنتاج).
            </p>
          )}
          <button type="button" className="text-xs text-muted underline underline-offset-4" onClick={() => { setStage("email"); setCode(""); }}>تغيير البريد</button>
        </>
      )}
      {error && <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger" role="alert">{error}</p>}
      <Button type="submit" className="w-full" loading={busy} disabled={stage === "code" && code.length !== 6}>
        {stage === "email" ? "أرسلي رمز الدخول" : "دخول"}
      </Button>
    </form>
  );
}
