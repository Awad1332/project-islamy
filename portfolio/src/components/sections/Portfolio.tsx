"use client";

import { useMemo, useState } from "react";
import { portfolio, projects, type ProjectCategory } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlaceholderBadge } from "@/components/ui/PlaceholderBadge";
import { ArrowIcon } from "@/components/ui/Icons";
import { ProjectCover } from "@/components/portfolio/ProjectVisual";
import { cn } from "@/lib/cn";

type FilterKey = ProjectCategory | "all";

export function Portfolio() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: projects.length };
    projects.forEach((p) => (c[p.category] = (c[p.category] ?? 0) + 1));
    return c;
  }, []);

  const visible = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  return (
    <section id="work" aria-labelledby="work-title" className="section-y">
      <div className="container-x">
        <SectionHeading id="work-title" eyebrow={portfolio.eyebrow} title={portfolio.title} subtitle={portfolio.subtitle} />

        {/* Filters */}
        <Reveal className="mt-10 lg:mt-12">
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
            <div role="group" aria-label="تصفية المشاريع حسب القطاع" className="mx-auto flex w-max gap-2">
              {portfolio.filters.map((f) => {
                const count = counts[f.key] ?? 0;
                const on = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "flex h-11 items-center gap-2 rounded-full px-5 text-[0.95rem] font-medium whitespace-nowrap transition-all duration-300",
                      on
                        ? "bg-ink text-white shadow-soft"
                        : "bg-alt text-ink/75 ring-1 ring-line hover:bg-lilac hover:text-primary",
                    )}
                  >
                    {f.label}
                    <span className={cn("rounded-full px-2 text-xs tabular-nums", on ? "bg-white/15" : "bg-white")}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        <p className="sr-only" aria-live="polite">
          {`يتم عرض ${visible.length} من المشاريع`}
        </p>

        {/* Grid */}
        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:gap-8">
          {visible.map((p, i) => (
            <li key={p.slug} className="animate-[card-in_0.5s_ease-out_both]" style={{ animationDelay: `${(i % 4) * 60}ms` }}>
              <article className="group relative h-full overflow-hidden rounded-[2rem] border border-line bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-card">
                <ProjectCover project={p} />
                {p.isIllustrative && <PlaceholderBadge className="absolute top-4 right-4" label="مشروع توضيحي" />}
                <div className="p-6 sm:p-8">
                  <p className="text-sm font-semibold text-primary">{p.categoryLabel}</p>
                  <h3 className="mt-2 text-2xl font-bold text-ink">{p.name}</h3>
                  <p className="mt-3 leading-7 text-muted">{p.summary}</p>
                  <ul className="mt-5 flex flex-wrap gap-2" aria-label="الخدمات المقدمة">
                    {p.services.map((s) => (
                      <li key={s} className="rounded-full bg-alt px-3 py-1 text-sm text-ink/80 ring-1 ring-line">
                        {s}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`/projects/${p.slug}/`}
                    className="mt-7 inline-flex items-center gap-2 font-semibold text-primary after:absolute after:inset-0 after:content-['']"
                    aria-label={`عرض تفاصيل مشروع ${p.name}`}
                  >
                    عرض المشروع
                    <span className="grid size-8 place-items-center rounded-full bg-lilac transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                      <ArrowIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
                    </span>
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {visible.length === 0 && (
          <p className="mt-10 rounded-2xl bg-alt p-10 text-center text-muted">
            لا توجد مشاريع في هذا القسم حاليًا — ترقّب جديدها قريبًا.
          </p>
        )}
      </div>

      <style>{`@keyframes card-in { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }`}</style>
    </section>
  );
}
