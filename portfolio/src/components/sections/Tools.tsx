import { tools } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

export function Tools() {
  return (
    <section id="tools" aria-labelledby="tools-title" className="relative bg-alt section-y">
      <div className="container-x">
        <SectionHeading id="tools-title" eyebrow={tools.eyebrow} title={tools.title} subtitle={tools.subtitle} />

        <div className="mt-14 grid gap-5 lg:mt-16 lg:grid-cols-2">
          {tools.categories.map((cat, ci) => (
            <Reveal key={cat.title} delay={(ci % 2) * 100} className="rounded-[2rem] border border-line bg-white p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink">{cat.title}</h3>
                <span className="rounded-full bg-lilac px-3 py-1 text-xs font-semibold text-primary tabular-nums">
                  {cat.items.length} {cat.items.length > 1 ? "أدوات" : "أداة"}
                </span>
              </div>
              <ul className="grid gap-3">
                {cat.items.map((t) => (
                  <li
                    key={t.latin}
                    className="group flex items-start gap-4 rounded-2xl bg-alt/70 p-4 ring-1 ring-transparent transition-all duration-300 hover:bg-white hover:shadow-soft hover:ring-line"
                  >
                    <span
                      aria-hidden
                      dir="ltr"
                      className="grid size-14 shrink-0 place-items-center rounded-2xl text-base font-bold text-white shadow-soft transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3"
                      style={{ background: `linear-gradient(145deg, ${t.color}, color-mix(in srgb, ${t.color} 70%, #000))` }}
                    >
                      {t.mono}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h4 className="text-base font-bold text-ink">{t.name}</h4>
                        <span dir="ltr" className="text-sm text-muted">
                          {t.latin}
                        </span>
                        <span className="ms-auto rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-deep ring-1 ring-line">
                          {t.level}
                        </span>
                      </div>
                      <p className="mt-1.5 leading-7 text-muted">{t.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
