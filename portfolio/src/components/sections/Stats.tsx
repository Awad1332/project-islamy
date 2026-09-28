"use client";

import { useEffect, useState } from "react";
import { stats } from "@/content/site";
import { useInViewOnce } from "@/lib/hooks";
import { Reveal } from "@/components/ui/Reveal";
import { PlaceholderBadge } from "@/components/ui/PlaceholderBadge";

const toArabicDigits = (n: number) => n.toLocaleString("ar-SA-u-nu-arab");

function CountUp({ to, run }: { to: number; run: boolean }) {
  // Server/no-JS render shows the final value; with JS we start from zero.
  const [n, setN] = useState(to);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setN(0);
  }, []);

  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1600;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to]);

  return <>{toArabicDigits(n)}</>;
}

export function Stats() {
  const [ref, inView] = useInViewOnce<HTMLDivElement>({ threshold: 0.35 });

  return (
    <section aria-labelledby="stats-title" className="relative py-16 sm:py-20">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white px-5 py-10 shadow-card sm:px-10 sm:py-14">
          <div
            aria-hidden
            className="absolute -top-24 left-1/2 h-48 w-2/3 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          />
          <Reveal className="relative flex flex-col items-center gap-3 text-center">
            <h2 id="stats-title" className="text-2xl font-bold text-ink sm:text-3xl">
              {stats.title}
            </h2>
            <p className="max-w-xl text-muted">{stats.subtitle}</p>
            <PlaceholderBadge show={stats.isPlaceholder} label="أرقام توضيحية — تُستبدل بالأرقام الفعلية" />
          </Reveal>

          <div ref={ref} className="relative mt-10 grid grid-cols-2 gap-y-10 lg:grid-cols-4">
            {stats.items.map((s, i) => (
              <Reveal
                key={s.label}
                delay={i * 90}
                className="flex flex-col items-center px-3 text-center lg:border-s lg:border-line lg:first:border-s-0"
              >
                <p
                  className="text-5xl leading-none font-bold text-primary tabular-nums sm:text-6xl"
                  aria-label={`${s.value}${s.suffix} ${s.label}`}
                >
                  <span aria-hidden>
                    <CountUp to={s.value} run={inView} />
                    {s.suffix}
                  </span>
                </p>
                <p className="mt-3 text-base font-semibold text-ink sm:text-lg">{s.label}</p>
                <p className="mt-1 text-sm text-muted">{s.hint}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
