"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { journey } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { MiniScreen } from "@/components/visuals/MiniScreen";
import { Sphere, Torus } from "@/components/visuals/Shapes";
import { cn } from "@/lib/cn";

const AUTO_MS = 4500;

export function Journey() {
  const steps = journey.steps;
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Only auto-advance while on screen, and never for reduced-motion users.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % steps.length), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [active, auto, visible, steps.length]);

  const select = (i: number, focus = false) => {
    setAuto(false);
    setActive(i);
    if (focus) tabRefs.current[i]?.focus();
  };

  // RTL: ArrowLeft moves forward, ArrowRight moves back.
  const onKey = (e: KeyboardEvent) => {
    const n = steps.length;
    const map: Record<string, number> = {
      ArrowLeft: (active + 1) % n,
      ArrowDown: (active + 1) % n,
      ArrowRight: (active - 1 + n) % n,
      ArrowUp: (active - 1 + n) % n,
      Home: 0,
      End: n - 1,
    };
    if (e.key in map) {
      e.preventDefault();
      select(map[e.key], true);
    }
  };

  const progress = (active / (steps.length - 1)) * 100;

  return (
    <section
      id="journey"
      aria-labelledby="journey-title"
      className="relative isolate overflow-hidden bg-deeper section-y text-white"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#5b34d6_0%,transparent_60%)] opacity-70" />
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_70%)] opacity-40" />
        <Sphere className="absolute top-24 -right-10 size-40 opacity-60" tone="deep" />
        <Torus className="absolute bottom-10 -left-10 size-44 opacity-40" tone="deep" />
      </div>

      <div className="container-x" ref={rootRef}>
        <SectionHeading
          id="journey-title"
          tone="dark"
          eyebrow={journey.eyebrow}
          title={journey.title}
          subtitle={journey.subtitle}
        />

        <Reveal className="mt-14 lg:mt-16">
          {/* Journey visual */}
          <div className="relative rounded-[2rem] bg-white/[0.04] p-4 ring-1 ring-white/10 sm:p-8 lg:p-10">
            <div className="relative">
              {/* connecting line */}
              <div aria-hidden className="absolute inset-x-[10%] top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-[#b9a2ff] to-primary transition-[width] duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <ol className="relative grid grid-cols-5 items-center gap-2 sm:gap-5 lg:gap-8" aria-hidden>
                {steps.map((s, i) => (
                  <li key={s.number} className="flex flex-col items-center">
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => select(i)}
                      className={cn(
                        "w-full transition-all duration-500",
                        i === active ? "-translate-y-2 scale-[1.06] opacity-100" : "scale-95 opacity-45 hover:opacity-75",
                      )}
                    >
                      <MiniScreen kind={s.screen} active={i === active} />
                    </button>
                    <span
                      className={cn(
                        "mt-3 grid size-7 place-items-center rounded-full text-xs font-bold tabular-nums transition-colors sm:mt-4 sm:size-9 sm:text-sm",
                        i <= active ? "bg-primary text-white" : "bg-white/10 text-white/60",
                      )}
                    >
                      {s.number}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>

        {/* Steps (tabs) */}
        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-12">
          <div role="tablist" aria-label="مراحل رحلة العميل" aria-orientation="vertical" className="grid gap-2" onKeyDown={onKey}>
            {steps.map((s, i) => (
              <button
                key={s.number}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`journey-tab-${i}`}
                aria-selected={i === active}
                aria-controls="journey-panel"
                tabIndex={i === active ? 0 : -1}
                onClick={() => select(i)}
                className={cn(
                  "group relative flex items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 text-start transition-all duration-300",
                  i === active ? "bg-white text-ink shadow-float" : "text-white/75 hover:bg-white/[0.06] hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums transition-colors",
                    i === active ? "text-primary" : "text-white/45",
                  )}
                >
                  {s.number}
                </span>
                <span className="text-lg font-semibold">{s.title}</span>
                {i === active && auto && visible && (
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-lilac">
                    <span
                      key={active}
                      className="block h-full origin-right bg-primary motion-reduce:hidden"
                      style={{ animation: `journey-progress ${AUTO_MS}ms linear forwards` }}
                    />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div
            id="journey-panel"
            role="tabpanel"
            aria-labelledby={`journey-tab-${active}`}
            aria-live="polite"
            className="rounded-[1.75rem] bg-white/[0.06] p-7 ring-1 ring-white/10 sm:p-9"
          >
            <p className="text-sm font-semibold text-[#c7b5ff]">الخطوة {steps[active].number}</p>
            <h3 className="mt-3 text-2xl font-bold sm:text-3xl">{steps[active].title}</h3>
            <p className="mt-4 text-lg leading-8 text-white/75">{steps[active].text}</p>
            <div className="mt-8 flex gap-1.5" aria-hidden>
              {steps.map((s, i) => (
                <span
                  key={s.number}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors duration-500",
                    i <= active ? "bg-primary" : "bg-white/15",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes journey-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
    </section>
  );
}
