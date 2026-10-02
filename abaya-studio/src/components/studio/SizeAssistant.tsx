"use client";

import { useMemo, useState } from "react";
import { CONFIDENCE_LABEL, recommendSize, type FitPreference, type HeelHabit, type SizeInput, type SizeRecommendation } from "@/lib/engine/size";
import { optionFor } from "@/lib/engine/config";
import type { StoreCatalog } from "@/lib/engine/types";
import { Button, Chip, cx, Icon } from "../ui";

/**
 * "ساعديني أختار مقاسي" — one question per screen, rule-based on the
 * merchant's size chart (no AI involved in sizing).
 */
export function SizeAssistant({
  catalog,
  cut,
  initial,
  onDone,
}: {
  catalog: StoreCatalog;
  cut?: string;
  initial?: SizeInput | null;
  onDone?: (input: SizeInput, rec: SizeRecommendation) => void;
}) {
  const sizes = useMemo(() => [...catalog.sizeChart].sort((a, b) => a.lengthCm - b.lengthCm).map((r) => r.size), [catalog]);
  const [step, setStep] = useState(0);
  const [height, setHeight] = useState<number>(initial?.heightCm ?? 160);
  const [usual, setUsual] = useState<string | null>(initial?.usualSize ?? null);
  const [fit, setFit] = useState<FitPreference | null>(initial?.fit ?? null);
  const [heels, setHeels] = useState<HeelHabit | null>(initial?.heels ?? null);
  const [bought, setBought] = useState<boolean | null>(initial ? !!initial.previous : null);
  const [prevSize, setPrevSize] = useState<string>(initial?.previous?.size ?? sizes[Math.floor(sizes.length / 2)]);
  const [prevResult, setPrevResult] = useState<"good" | "short" | "long">(initial?.previous?.result ?? "good");
  const [result, setResult] = useState<SizeRecommendation | null>(null);

  const cutName = cut ? optionFor(catalog, "cut", cut)?.name : undefined;

  const finish = () => {
    const input: SizeInput = {
      heightCm: height,
      usualSize: usual,
      fit: fit ?? "regular",
      heels: heels ?? "never",
      previous: bought ? { size: prevSize, result: prevResult } : null,
      cut,
      cutName,
    };
    const rec = recommendSize(catalog, input);
    setResult(rec);
    onDone?.(input, rec);
  };

  const questions = [
    {
      q: "كم طولك؟",
      ok: height >= 120 && height <= 210,
      body: (
        <div>
          <div className="mb-5 flex items-end justify-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={120}
              max={210}
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="num w-28 border-b-2 border-ink bg-transparent text-center font-display text-5xl outline-none"
              aria-label="الطول بالسنتيمتر"
            />
            <span className="pb-2 text-muted">سم</span>
          </div>
          <input type="range" min={140} max={185} value={Math.min(185, Math.max(140, height))} onChange={(e) => setHeight(Number(e.target.value))} className="w-full accent-[var(--color-ink)]" aria-label="الطول" />
        </div>
      ),
    },
    {
      q: "ما مقاسك المعتاد؟",
      ok: true,
      body: (
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((s) => (
            <Chip key={s} active={usual === s} onClick={() => setUsual(s)}>{s}</Chip>
          ))}
          <Chip active={usual === null} onClick={() => setUsual(null)}>لا أعرف</Chip>
        </div>
      ),
    },
    {
      q: "هل تحبين العباية واسعة؟",
      ok: fit !== null,
      body: (
        <div className="grid gap-2">
          <Chip active={fit === "loose"} onClick={() => setFit("loose")}>نعم، أحبها واسعة ومريحة</Chip>
          <Chip active={fit === "regular"} onClick={() => setFit("regular")}>متوسطة</Chip>
          <Chip active={fit === "fitted"} onClick={() => setFit("fitted")}>أفضّلها محددة</Chip>
        </div>
      ),
    },
    {
      q: "هل تلبسين كعب؟",
      ok: heels !== null,
      body: (
        <div className="grid grid-cols-3 gap-2">
          <Chip active={heels === "always"} onClick={() => setHeels("always")}>غالبًا</Chip>
          <Chip active={heels === "sometimes"} onClick={() => setHeels("sometimes")}>أحيانًا</Chip>
          <Chip active={heels === "never"} onClick={() => setHeels("never")}>لا</Chip>
        </div>
      ),
    },
    {
      q: "هل سبق واشتريتِ من هذا المتجر؟",
      ok: bought !== null,
      body: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Chip active={bought === true} onClick={() => setBought(true)}>نعم</Chip>
            <Chip active={bought === false} onClick={() => setBought(false)}>لا</Chip>
          </div>
          {bought && (
            <div className="animate-fade-in space-y-3 rounded-2xl bg-sand p-4">
              <label className="block text-sm text-muted">المقاس الذي اشتريتِه</label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <Chip key={s} active={prevSize === s} onClick={() => setPrevSize(s)}>{s}</Chip>
                ))}
              </div>
              <label className="block text-sm text-muted">كيف كان؟</label>
              <div className="grid grid-cols-3 gap-2">
                <Chip active={prevResult === "good"} onClick={() => setPrevResult("good")}>مناسب</Chip>
                <Chip active={prevResult === "short"} onClick={() => setPrevResult("short")}>قصير</Chip>
                <Chip active={prevResult === "long"} onClick={() => setPrevResult("long")}>طويل</Chip>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  if (result) {
    const tone = result.confidence === "high" ? "text-ok" : result.confidence === "medium" ? "text-gold" : "text-danger";
    return (
      <div className="animate-fade-in text-center">
        <p className="text-sm text-muted">مقاسك المقترح</p>
        <p className="num my-2 font-display text-7xl font-semibold">{result.size}</p>
        <p className="text-sm">
          درجة الملاءمة: <span className={cx("font-semibold", tone)}>{CONFIDENCE_LABEL[result.confidence]}</span>
        </p>
        <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-ink transition-all duration-700" style={{ width: `${Math.round(result.score * 100)}%` }} />
        </div>
        <div className="mt-6 space-y-2 rounded-2xl bg-white p-4 text-start text-sm ring-1 ring-line">
          <p className="font-medium">{result.summary}</p>
          <ul className="space-y-1.5 text-muted">
            {result.reasons.map((r) => (
              <li key={r} className="flex gap-2"><Icon name="check" className="mt-0.5 size-4 shrink-0 text-ok" />{r}</li>
            ))}
            {result.tips.map((r) => (
              <li key={r} className="flex gap-2"><Icon name="info" className="mt-0.5 size-4 shrink-0 text-gold" />{r}</li>
            ))}
          </ul>
          <p className="pt-1 text-xs text-muted">طول العباية المرجعي لهذا المقاس: {result.row.lengthCm} سم.</p>
        </div>
        <button className="mt-4 text-sm text-muted underline underline-offset-4" onClick={() => { setResult(null); setStep(0); }}>
          أعيدي الإجابة
        </button>
      </div>
    );
  }

  const cur = questions[step];
  return (
    <div>
      <div className="mb-6 flex gap-1.5" aria-hidden>
        {questions.map((_, i) => (
          <span key={i} className={cx("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-ink" : "bg-line")} />
        ))}
      </div>
      <p className="mb-1 text-xs text-muted">سؤال {step + 1} من {questions.length}</p>
      <h3 className="mb-6 font-display text-2xl font-semibold">{cur.q}</h3>
      <div key={step} className="animate-fade-in min-h-40">{cur.body}</div>
      <div className="mt-8 flex gap-2">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)} aria-label="السابق">
            <Icon name="arrowPrev" />
          </Button>
        )}
        <Button className="flex-1" disabled={!cur.ok} onClick={() => (step < questions.length - 1 ? setStep(step + 1) : finish())}>
          {step < questions.length - 1 ? "التالي" : "اعرفي مقاسك"}
        </Button>
      </div>
    </div>
  );
}
