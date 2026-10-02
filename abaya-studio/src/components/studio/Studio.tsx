"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultConfig, groupOptions, normalize, optionFor, select } from "@/lib/engine/config";
import { formatSAR, priceConfig } from "@/lib/engine/pricing";
import type { SizeInput } from "@/lib/engine/size";
import { GROUP_META, type DesignConfig, type OptionGroup, type StoreCatalog } from "@/lib/engine/types";
import type { DesignImage, SavedDesign } from "@/lib/models";
import type { RenderView } from "@/lib/render/abaya";
import { renderInputFromConfig } from "@/lib/render/resolve";
import { AbayaArt } from "./Art";
import { LengthHelper } from "./LengthHelper";
import { OptionGrid } from "./OptionGrid";
import { GeneratingOverlay, Preview } from "./Preview";
import { PriceBar, PriceLines } from "./Price";
import { SizeAssistant } from "./SizeAssistant";
import { STEPS } from "./steps";
import { Badge, Button, cx, Icon, Logo, Sheet, useToast } from "../ui";

type Phase = "welcome" | "design" | "review" | "result";

const DRAFT_KEY = "abaya-studio:draft";

function loadDraft(): { config: DesignConfig; step: number } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveDraft(v: { config: DesignConfig; step: number } | null) {
  try {
    if (v) localStorage.setItem(DRAFT_KEY, JSON.stringify(v));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage unavailable */
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? "تعذر إتمام الطلب");
  return body as T;
}

interface VizResult {
  images: DesignImage[];
  prompt: string;
  provider: string;
  disclaimer: string;
}

export function Studio({ catalog, initialDesign }: { catalog: StoreCatalog; initialDesign?: SavedDesign | null }) {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>(initialDesign ? "result" : "welcome");
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<DesignConfig>(() =>
    initialDesign ? normalize(catalog, initialDesign.config).config : defaultConfig(catalog),
  );
  const [view, setView] = useState<RenderView>("front");
  const [generating, setGenerating] = useState(false);
  const [vizError, setVizError] = useState<string | null>(null);
  const [design, setDesign] = useState<SavedDesign | null>(initialDesign ?? null);
  const [viz, setViz] = useState<VizResult | null>(
    initialDesign?.images.length ? { images: initialDesign.images, prompt: initialDesign.prompt ?? "", provider: "", disclaimer: "" } : null,
  );
  const [stale, setStale] = useState(false);
  const [lengthHelp, setLengthHelp] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [whySize, setWhySize] = useState(false);
  const [quickEdit, setQuickEdit] = useState<OptionGroup | null>(null);
  const [cartSize, setCartSize] = useState<string | null>(initialDesign?.size?.size ?? null);
  const [busy, setBusy] = useState<"save" | "cart" | "share" | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [hasDraft, setHasDraft] = useState(false);

  const price = useMemo(() => priceConfig(catalog, config), [catalog, config]);
  const renderInput = useMemo(() => renderInputFromConfig(catalog, config), [catalog, config]);
  const current = STEPS[step];

  useEffect(() => {
    setHasDraft(!initialDesign && !!loadDraft());
    fetch("/api/cart")
      .then((r) => r.json())
      .then((c) => setCartCount(c.items?.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0) ?? 0))
      .catch(() => {});
  }, [initialDesign]);

  useEffect(() => {
    if (phase === "design" || phase === "review") saveDraft({ config, step });
  }, [config, step, phase]);

  // The preview is sticky on every layout, so the step header sits right under it at scroll 0.
  const scrollToOptions = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const choose = useCallback(
    (group: OptionGroup, code: string) => {
      const r = select(catalog, config, group, code);
      if (!r.ok) {
        toast({ message: r.reason, tone: "danger" });
        return;
      }
      setConfig(r.config);
      if (phase === "result") setStale(true);
      for (const a of r.adjustments) toast({ message: a.message, tone: "default" });
    },
    [catalog, config, phase, toast],
  );

  const goStep = (i: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, i)));
    setPhase("design");
    setView("front");
    scrollToOptions();
  };

  const resetDesign = () => {
    setConfig(defaultConfig(catalog));
    setDesign(null);
    setViz(null);
    saveDraft(null);
    setStep(0);
    setPhase("design");
    toast({ message: "بدأنا تصميمًا جديدًا" });
  };

  /* ---------- AI visualization ---------- */
  const visualize = async (cfg = config) => {
    setGenerating(true);
    setVizError(null);
    setPhase("result");
    setView("front");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const result = await api<VizResult & { config: DesignConfig }>("/api/visualize", {
        method: "POST",
        body: JSON.stringify({ store: catalog.storeId, config: cfg }),
      });
      setViz(result);
      setStale(false);
      // Every visualized design is recorded (as a draft) so the merchant sees real demand.
      const payload = { store: catalog.storeId, config: cfg, images: result.images, prompt: result.prompt };
      const saved =
        design && (design.status === "draft" || design.status === "saved")
          ? await api<SavedDesign>(`/api/designs/${design.code}`, { method: "PATCH", body: JSON.stringify(payload) })
          : await api<SavedDesign>("/api/designs", { method: "POST", body: JSON.stringify({ ...payload, status: "draft" }) });
      setDesign(saved);
      setCartSize((s) => s ?? saved.size?.size ?? null);
      saveDraft(null);
    } catch (e) {
      setVizError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  /* ---------- Result actions ---------- */
  const ensureSaved = async (): Promise<SavedDesign | null> => {
    if (!design) return null;
    if (design.status !== "draft") return design;
    const d = await api<SavedDesign>(`/api/designs/${design.code}`, { method: "PATCH", body: JSON.stringify({ status: "saved" }) });
    setDesign(d);
    return d;
  };

  const shareUrl = (code: string) => `${window.location.origin}/d/${code}`;

  const save = async () => {
    setBusy("save");
    try {
      const d = await ensureSaved();
      if (d) {
        toast({
          message: `تم حفظ التصميم #${d.code}`,
          tone: "ok",
          action: { label: "نسخ الرابط", onClick: () => navigator.clipboard?.writeText(shareUrl(d.code)) },
        });
      }
    } catch (e) {
      toast({ message: (e as Error).message, tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy("share");
    try {
      const d = await ensureSaved();
      if (!d) return;
      const url = shareUrl(d.code);
      const data = { title: `Abaya Design #${d.code}`, text: "شوفي العباية اللي صممتها ✨", url };
      if (navigator.share) await navigator.share(data).catch(() => {});
      else {
        await navigator.clipboard?.writeText(`${data.text}\n${url}`);
        toast({ message: "تم نسخ رابط المشاركة", tone: "ok" });
      }
    } catch (e) {
      toast({ message: (e as Error).message, tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  const addToCart = async () => {
    if (!design || !cartSize) return;
    setBusy("cart");
    try {
      const cart = await api<{ items: { quantity: number }[] }>("/api/cart", {
        method: "POST",
        body: JSON.stringify({ designCode: design.code, size: cartSize }),
      });
      setCartCount(cart.items.reduce((s, i) => s + i.quantity, 0));
      setDesign({ ...design, status: "in_cart" });
      toast({ message: "أُضيفت عبايتك إلى السلة", tone: "ok", action: { label: "عرض السلة", onClick: () => (window.location.href = "/cart") } });
    } catch (e) {
      toast({ message: (e as Error).message, tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  const onSizeDone = async (input: SizeInput) => {
    if (!design) return;
    try {
      const d = await api<SavedDesign>(`/api/designs/${design.code}`, { method: "PATCH", body: JSON.stringify({ size: input }) });
      setDesign(d);
      setCartSize(d.size?.size ?? null);
    } catch {
      /* the assistant still shows its result locally */
    }
  };

  const closeQuickEdit = () => {
    setQuickEdit(null);
    if (stale) visualize(config);
  };

  /* ---------- Rendering ---------- */
  const header = (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 lg:h-16 lg:px-6">
        <Logo />
        <div className="flex items-center gap-1">
          <Link href="/size" className="hidden h-9 items-center gap-1.5 rounded-full px-3 text-sm text-ink-2 hover:bg-sand sm:flex">
            <Icon name="ruler" className="size-4" /> ساعديني أختار مقاسي
          </Link>
          <Link href="/cart" className="relative grid size-10 place-items-center rounded-full hover:bg-sand" aria-label={`السلة (${cartCount})`}>
            <Icon name="bag" />
            {cartCount > 0 && <span className="num absolute top-1 end-1 grid size-4 place-items-center rounded-full bg-ink text-[10px] text-paper">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );

  if (phase === "welcome") {
    return (
      <div className="min-h-dvh">
        {header}
        <Welcome
          catalog={catalog}
          hasDraft={hasDraft}
          onStart={() => {
            setPhase("design");
            setStep(0);
          }}
          onResume={() => {
            const d = loadDraft();
            if (d) {
              setConfig(normalize(catalog, d.config).config);
              setStep(Math.min(d.step, STEPS.length - 1));
            }
            setPhase("design");
          }}
        />
      </div>
    );
  }

  const resultImage = viz?.images.find((i) => i.view === view)?.url;
  const illustrative = viz?.images.some((i) => i.illustrative);
  const name = (g: OptionGroup, code: string) => optionFor(catalog, g, code)?.name ?? code;

  return (
    <div className="min-h-dvh">
      {header}
      <div className="mx-auto max-w-[1400px] lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8 lg:px-6">
        {/* Preview column (right in RTL) */}
        <section className="sticky top-14 z-30 lg:top-20 lg:h-[calc(100dvh-6rem)] lg:pt-2">
          <div className="relative overflow-hidden lg:h-full lg:rounded-3xl">
            <Preview
              input={renderInput}
              view={view}
              onViewChange={setView}
              focus={phase === "design" ? current.focus : "full"}
              onReset={phase !== "result" ? resetDesign : undefined}
              imageUrl={phase === "result" && !stale && !generating ? resultImage : undefined}
              overlay={generating ? <GeneratingOverlay /> : null}
              className="h-[42svh] min-h-[280px] lg:h-full"
            />
            {phase === "result" && !generating && viz && !stale && illustrative && (
              <div className="pointer-events-none absolute top-3 start-3">
                <Badge tone="neutral" className="bg-white/85 backdrop-blur">تصور توضيحي</Badge>
              </div>
            )}
            {phase === "result" && stale && !generating && (
              <div className="absolute inset-x-3 top-3 flex justify-center">
                <Button size="sm" variant="primary" onClick={() => visualize(config)}>
                  <Icon name="sparkle" className="size-4" /> حدّثي التصور
                </Button>
              </div>
            )}
          </div>
          <PriceBar price={price} className="border-b border-line lg:hidden" />
        </section>

        {/* Options column */}
        <section className="px-4 pb-36 pt-5 lg:px-0 lg:pb-10 lg:pt-6">
          <div className="mb-5 hidden rounded-2xl border border-line bg-white p-5 lg:block">
            <PriceLines price={price} />
          </div>

          {phase === "design" && (
            <div key={current.key} className="animate-fade-in">
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span className="num">الخطوة {step + 1} من {STEPS.length}</span>
                <button className="underline underline-offset-4 hover:text-ink" onClick={() => setPhase("review")}>
                  تخطي إلى المراجعة
                </button>
              </div>
              <div className="mb-5 flex gap-1" aria-hidden>
                {STEPS.map((s, i) => (
                  <button key={s.key} onClick={() => goStep(i)} className={cx("h-1 flex-1 rounded-full transition-colors duration-500", i <= step ? "bg-ink" : "bg-line")} tabIndex={-1} />
                ))}
              </div>
              <h1 className="font-display text-[26px] font-semibold leading-tight lg:text-3xl">{current.title}</h1>
              {current.hint && <p className="mt-1 text-sm text-muted">{current.hint}</p>}

              <div className="mt-5 space-y-7">
                {current.groups.map((g) => (
                  <div key={g}>
                    {current.groups.length > 1 && (
                      <h2 className="mb-3 text-sm font-medium text-ink-2">
                        {g === "extra" ? "إضافات (يمكنك اختيار أكثر من واحدة)" : GROUP_META[g].label}
                      </h2>
                    )}
                    <OptionGrid catalog={catalog} config={config} group={g} art={g === "embroidery" || g === "extra" ? "figure" : current.art} crop={current.crop} onSelect={choose} />
                    {g === "length" && (
                      <button onClick={() => setLengthHelp(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line-2 py-3.5 text-sm text-ink-2 hover:border-ink hover:text-ink">
                        <Icon name="ruler" className="size-4" /> أحتاج مساعدة في اختيار الطول
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === "review" && (
            <div className="animate-fade-in">
              <h1 className="font-display text-[26px] font-semibold lg:text-3xl">تصميمك جاهز تقريبًا</h1>
              <p className="mt-1 text-sm text-muted">راجعي اختياراتك، ثم شاهدي عبايتك.</p>
              <SummaryList catalog={catalog} config={config} onEdit={(i) => goStep(i)} />
              <div className="mt-6 hidden lg:block">
                <Button variant="gold" size="lg" className="w-full" onClick={() => visualize()}>
                  <Icon name="sparkle" /> شاهدي عبايتك
                </Button>
              </div>
            </div>
          )}

          {phase === "result" && (
            <div className="animate-fade-in">
              {vizError ? (
                <div className="rounded-2xl border border-danger/20 bg-danger-soft p-5 text-center">
                  <Icon name="alert" className="mx-auto mb-2 size-7 text-danger" />
                  <p className="font-medium text-danger">لم نتمكن من تجهيز التصور</p>
                  <p className="mt-1 text-sm text-danger/80">{vizError}</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <Button size="sm" onClick={() => visualize()}>حاولي مرة أخرى</Button>
                    <Button size="sm" variant="secondary" onClick={() => setPhase("review")}>رجوع للتصميم</Button>
                  </div>
                </div>
              ) : generating && !design ? (
                <div className="space-y-3">
                  <div className="h-8 w-48 rounded-lg bg-stone" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="shimmer relative h-11 overflow-hidden rounded-xl bg-stone" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="font-display text-[28px] font-semibold lg:text-[34px]">هذه عبايتك ✨</h1>
                      {design && <p className="num mt-0.5 text-sm text-muted" dir="ltr">Abaya Design #{design.code}</p>}
                    </div>
                    {design?.status === "saved" && <Badge tone="ok"><Icon name="check" className="size-3" /> محفوظ</Badge>}
                    {design?.status === "in_cart" && <Badge tone="dark"><Icon name="bag" className="size-3" /> في السلة</Badge>}
                  </div>

                  {/* Redesign without starting over */}
                  <div className="mt-5">
                    <p className="mb-2 text-sm font-medium">صمميها مرة ثانية</p>
                    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
                      {([["color", "غيري اللون"], ["length", "غيري الطول"], ["sleeve", "غيري الأكمام"], ["embroidery", "غيري التطريز"], ["fabric", "غيري الخامة"]] as const).map(([g, label]) => (
                        <button key={g} onClick={() => setQuickEdit(g)} className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line-2 bg-white px-4 text-sm hover:border-ink">
                          <Icon name="edit" className="size-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <h2 className="mt-7 mb-2 text-sm font-medium text-muted">التفاصيل</h2>
                  <dl className="divide-y divide-line rounded-2xl border border-line bg-white text-[15px]">
                    {([["cut", "القصة"], ["length", "الطول"], ["fabric", "الخامة"], ["sleeve", "الأكمام"], ["neckline", "الرقبة"], ["closure", "الإغلاق"], ["color", "اللون"], ["embroidery", "التطريز"]] as const).map(([g, label]) => (
                      <div key={g} className="flex justify-between px-4 py-3">
                        <dt className="text-muted">{label}</dt>
                        <dd className="font-medium">{name(g, config[g])}</dd>
                      </div>
                    ))}
                    {config.extras.length > 0 && (
                      <div className="flex justify-between px-4 py-3">
                        <dt className="text-muted">الإضافات</dt>
                        <dd className="font-medium">{config.extras.map((c) => name("extra", c)).join("، ")}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-line bg-white p-4">
                      <p className="text-sm text-muted">السعر</p>
                      <p className="num mt-1 font-display text-3xl font-semibold">{formatSAR(price.total)}</p>
                      <p className="mt-1 text-xs text-muted">تجهيز خلال {price.leadTimeDays} أيام</p>
                    </div>
                    <div className="rounded-2xl border border-line bg-white p-4">
                      <p className="text-sm text-muted">المقاس المقترح</p>
                      <p className="num mt-1 font-display text-3xl font-semibold">{design?.size?.size ?? "—"}</p>
                      <button className="mt-1 text-xs text-ink-2 underline underline-offset-4" onClick={() => setWhySize((w) => !w)} aria-expanded={whySize}>
                        لماذا هذا المقاس؟
                      </button>
                    </div>
                  </div>
                  {whySize && design?.size && (
                    <div className="animate-fade-in mt-3 rounded-2xl bg-sand p-4 text-sm">
                      <p>«{design.size.summary}»</p>
                      <p className="mt-1 text-xs text-muted">درجة الملاءمة: {design.size.confidence}</p>
                      <button className="mt-2 font-medium underline underline-offset-4" onClick={() => setSizeOpen(true)}>
                        حسّني الدقة بمساعد المقاس
                      </button>
                    </div>
                  )}

                  <div className="mt-5">
                    <p className="mb-2 text-sm text-muted">المقاس</p>
                    <div className="flex flex-wrap gap-2">
                      {catalog.sizeChart.map((r) => (
                        <button
                          key={r.size}
                          onClick={() => setCartSize(r.size)}
                          aria-pressed={cartSize === r.size}
                          className={cx("num h-11 min-w-14 rounded-xl border px-3 text-[15px] transition-colors", cartSize === r.size ? "border-ink bg-ink text-paper" : "border-line-2 bg-white hover:border-ink")}
                        >
                          {r.size}
                          {r.size === design?.size?.size && <span className="ms-1 text-[10px] opacity-70">مقترح</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 hidden gap-2 lg:grid lg:grid-cols-3">
                    <Button variant="secondary" onClick={() => goStep(0)}><Icon name="edit" className="size-4" /> عدّلي التصميم</Button>
                    <Button variant="secondary" onClick={save} loading={busy === "save"} disabled={!design}><Icon name="heart" className="size-4" /> احفظي التصميم</Button>
                    <Button variant="secondary" onClick={share} loading={busy === "share"} disabled={!design}><Icon name="share" className="size-4" /> شاركي التصميم</Button>
                  </div>
                  <div className="mt-3 hidden lg:block">
                    <Button size="lg" className="w-full" onClick={addToCart} loading={busy === "cart"} disabled={!design || !cartSize || stale || generating}>
                      <Icon name="bag" /> أضيفي للسلة · <span className="num">{formatSAR(price.total)}</span>
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 lg:hidden">
                    <Button size="sm" variant="ghost" onClick={() => goStep(0)}><Icon name="edit" className="size-4" /> عدّلي</Button>
                    <Button size="sm" variant="ghost" onClick={save} loading={busy === "save"} disabled={!design}><Icon name="heart" className="size-4" /> احفظي</Button>
                    <Button size="sm" variant="ghost" onClick={share} loading={busy === "share"} disabled={!design}><Icon name="share" className="size-4" /> شاركي</Button>
                  </div>

                  <p className="mt-6 flex gap-2 text-xs leading-relaxed text-muted">
                    <Icon name="info" className="size-4 shrink-0" />
                    {viz?.disclaimer || "الصورة تصور بصري تقريبي، وقد تختلف الخامة والمقاسات الفعلية قليلًا عن العرض."} المواصفات المعتمدة للتنفيذ هي المذكورة أعلاه.
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Sticky bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {phase === "design" && (
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={() => goStep(step - 1)} aria-label="السابق" className="w-14 px-0">
                <Icon name="arrowPrev" />
              </Button>
            )}
            <Button className="flex-1" onClick={() => (step < STEPS.length - 1 ? goStep(step + 1) : (setPhase("review"), scrollToOptions()))}>
              {step < STEPS.length - 1 ? `التالي: ${STEPS[step + 1].title.replace(/^اختاري /, "")}` : "راجعي التصميم"}
              <Icon name="arrowNext" className="size-4" />
            </Button>
          </div>
        )}
        {phase === "review" && (
          <Button variant="gold" size="lg" className="w-full" onClick={() => visualize()}>
            <Icon name="sparkle" /> شاهدي عبايتك
          </Button>
        )}
        {phase === "result" && (
          <Button size="lg" className="w-full" onClick={addToCart} loading={busy === "cart"} disabled={!design || !cartSize || stale || generating}>
            {generating ? "جاري التجهيز..." : <><Icon name="bag" /> أضيفي للسلة · <span className="num">{formatSAR(price.total)}</span></>}
          </Button>
        )}
      </div>

      {/* Desktop step navigation */}
      {phase === "design" && (
        <div className="mx-auto hidden max-w-[1400px] lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8 lg:px-6">
          <div />
          <div className="sticky bottom-0 -mt-6 flex gap-2 border-t border-line bg-paper/95 py-4 backdrop-blur">
            {step > 0 && <Button variant="secondary" onClick={() => goStep(step - 1)}><Icon name="arrowPrev" className="size-4" /> السابق</Button>}
            <Button className="flex-1" onClick={() => (step < STEPS.length - 1 ? goStep(step + 1) : setPhase("review"))}>
              {step < STEPS.length - 1 ? "التالي" : "راجعي التصميم"} <Icon name="arrowNext" className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Sheet open={lengthHelp} onClose={() => setLengthHelp(false)} title="نساعدك تختارين الطول">
        <LengthHelper
          catalog={catalog}
          cut={config.cut}
          lengths={groupOptions(catalog, "length").filter((o) => o.available).map((o) => o.visual?.cm ?? Number(o.code))}
          onApply={(cm) => {
            const o = groupOptions(catalog, "length").find((x) => (x.visual?.cm ?? Number(x.code)) === cm);
            if (o) choose("length", o.code);
            setLengthHelp(false);
          }}
        />
      </Sheet>

      <Sheet open={sizeOpen} onClose={() => setSizeOpen(false)} title="ساعديني أختار مقاسي">
        <SizeAssistant catalog={catalog} cut={config.cut} initial={design?.size?.input} onDone={onSizeDone} />
      </Sheet>

      <Sheet open={quickEdit !== null} onClose={closeQuickEdit} title={quickEdit ? `غيّري ${GROUP_META[quickEdit].label}` : ""} wide>
        {quickEdit && (
          <>
            <OptionGrid
              catalog={catalog}
              config={config}
              group={quickEdit}
              art={quickEdit === "color" || quickEdit === "fabric" ? "swatch" : quickEdit === "length" ? "length" : "figure"}
              crop={STEPS.find((s) => s.groups.includes(quickEdit))?.crop}
              onSelect={choose}
              columns={3}
            />
            <Button className="mt-5 w-full" onClick={closeQuickEdit}>
              {stale ? <><Icon name="sparkle" className="size-4" /> شاهدي التعديل</> : "تم"}
            </Button>
          </>
        )}
      </Sheet>
    </div>
  );
}

function SummaryList({ catalog, config, onEdit }: { catalog: StoreCatalog; config: DesignConfig; onEdit: (step: number) => void }) {
  const rows = STEPS.flatMap((s, i) =>
    s.groups.map((g) => {
      const value =
        g === "extra"
          ? config.extras.map((c) => optionFor(catalog, "extra", c)?.name ?? c).join("، ") || "بدون"
          : (optionFor(catalog, g, config[g])?.name ?? "—");
      return { g, i, label: g === "extra" ? "الإضافات" : GROUP_META[g].label, value };
    }),
  );
  return (
    <ul className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white">
      {rows.map((r) => (
        <li key={r.g} className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-muted">{r.label}</span>
          <span className="flex items-center gap-3">
            <span className="font-medium">{r.value}</span>
            <button onClick={() => onEdit(r.i)} className="text-xs text-muted underline underline-offset-4 hover:text-ink">تعديل</button>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Rotating showcase so the welcome model "changes" before the customer starts. */
function Welcome({ catalog, onStart, onResume, hasDraft }: { catalog: StoreCatalog; onStart: () => void; onResume: () => void; hasDraft: boolean }) {
  const looks = useMemo(() => {
    const base = defaultConfig(catalog);
    const variants: Partial<DesignConfig>[] = [
      { cut: "wide", sleeve: "flare", embroidery: "gold" },
      { cut: "aline", color: "beige", closure: "belt", sleeve: "wide" },
      { cut: "bisht", color: "brown", embroidery: "gold", sleeve: "wide" },
      { cut: "cloche", color: "navy", sleeve: "regular", extras: ["hem_trim"] },
    ];
    return variants.map((v) => renderInputFromConfig(catalog, normalize(catalog, { ...base, ...v } as DesignConfig).config));
  }, [catalog]);
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % looks.length), 2800);
    return () => clearInterval(t);
  }, [looks.length]);

  return (
    <main className="mx-auto grid max-w-[1200px] items-center gap-6 px-4 pb-10 pt-4 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-2 lg:gap-12 lg:px-6">
      <div className="relative order-1 mx-auto aspect-[400/776] h-[52svh] max-h-[640px] overflow-hidden rounded-[28px] lg:order-none lg:h-[78vh]">
        <AbayaArt key={i} input={looks[i]} mode="photo" idPrefix={`wl${i}`} className="animate-crossfade h-full w-full" title="عباية افتراضية" />
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
          {looks.map((_, k) => (
            <span key={k} className={cx("h-1 rounded-full transition-all duration-500", k === i ? "w-6 bg-ink" : "w-1.5 bg-ink/25")} />
          ))}
        </div>
      </div>
      <div className="order-2 text-center lg:order-none lg:text-start">
        <p className="mb-3 text-xs tracking-[0.2em] text-gold">{catalog.storeName}</p>
        <h1 className="font-display text-[40px] font-semibold leading-[1.15] lg:text-6xl">صممي عبايتك<br />على ذوقك</h1>
        <p className="mt-4 text-lg text-ink-2">اختاري التفاصيل وشوفي كيف بتطلع عليك</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
          <Button size="lg" onClick={onStart} className="sm:min-w-56">
            ابدئي التصميم <Icon name="arrowNext" className="size-4" />
          </Button>
          {hasDraft && (
            <Button size="lg" variant="secondary" onClick={onResume}>أكملي تصميمك السابق</Button>
          )}
        </div>
        <p className="num mt-6 text-sm text-muted">يبدأ من {formatSAR(catalog.basePrice)} · ٨ خطوات بسيطة</p>
      </div>
    </main>
  );
}
