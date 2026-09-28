import { services } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { CheckIcon } from "@/components/ui/Icons";
import { ServiceVisualFor } from "@/components/visuals/ServiceVisuals";
import { cn } from "@/lib/cn";

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="relative overflow-hidden bg-alt section-y">
      <div
        aria-hidden
        className="absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />
      <div className="container-x">
        <SectionHeading id="services-title" eyebrow={services.eyebrow} title={services.title} subtitle={services.subtitle} />

        {/* Quick index */}
        <Reveal className="mt-10">
          <nav aria-label="فهرس الخدمات" className="no-scrollbar -mx-4 overflow-x-auto px-4">
            <ul className="mx-auto flex w-max gap-2 rounded-full bg-white p-1.5 shadow-soft ring-1 ring-line">
              {services.items.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#service-${s.id}`}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-ink/75 transition hover:bg-lilac hover:text-primary"
                  >
                    <span className="text-xs font-bold text-primary tabular-nums">{s.number}</span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>

        <div className="mt-16 space-y-24 sm:mt-20 lg:space-y-36">
          {services.items.map((s, i) => {
            const flip = i % 2 === 1;
            return (
              <article
                key={s.id}
                id={`service-${s.id}`}
                aria-labelledby={`service-${s.id}-title`}
                className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24"
              >
                <Reveal className={cn(flip && "lg:order-2")}>
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-2xl bg-white text-lg font-bold text-primary tabular-nums shadow-soft ring-1 ring-line">
                      {s.number}
                    </span>
                    <span className="text-sm font-semibold text-primary">{s.label}</span>
                  </div>
                  <h3
                    id={`service-${s.id}-title`}
                    className="mt-6 text-3xl leading-[1.3] font-bold text-ink sm:text-[2.35rem] sm:leading-[1.25]"
                  >
                    {s.title}
                  </h3>
                  <p className="mt-5 text-lg leading-8 text-muted">{s.description}</p>
                  <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                          <CheckIcon className="size-3.5" />
                        </span>
                        <span className="leading-7 font-medium text-ink">{p}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal delay={120} className={cn(flip && "lg:order-1")}>
                  <ServiceVisualFor kind={s.visual} />
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
