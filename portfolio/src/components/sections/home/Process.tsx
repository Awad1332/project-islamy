import { home } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

export function Process() {
  const d = home.process;
  return (
    <section aria-labelledby="process-title" className="section-y">
      <div className="container-x">
        <SectionHeading id="process-title" eyebrow={d.eyebrow} title={d.title} />
        <div className="relative mt-14">
          <div
            aria-hidden
            className="absolute inset-x-[12%] top-7 hidden h-px bg-gradient-to-l from-primary/10 via-primary/40 to-primary/10 lg:block"
          />
          <ol className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {d.steps.map((st, i) => (
              <Reveal as="li" key={st.title} delay={i * 90} className="relative text-center">
                <span className="relative mx-auto grid size-14 place-items-center rounded-full bg-white text-xl font-bold text-primary tabular-nums shadow-soft ring-1 ring-line">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-xl font-bold text-ink">{st.title}</h3>
                <p className="mx-auto mt-2 max-w-xs leading-7 text-muted">{st.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
