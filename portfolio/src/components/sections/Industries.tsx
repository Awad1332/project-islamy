import { industries } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ProductArt } from "@/components/visuals/ProductArt";
import { ArrowIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

export function Industries() {
  return (
    <section id="industries" aria-labelledby="industries-title" className="section-y">
      <div className="container-x">
        <SectionHeading
          id="industries-title"
          eyebrow={industries.eyebrow}
          title={industries.title}
          subtitle={industries.subtitle}
        />

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-5">
          {industries.items.map((item, i) => (
            <Reveal as="li" key={item.title} delay={(i % 3) * 80}>
              <a
                href="#work"
                className={cn(
                  "group relative flex h-full min-h-[190px] items-stretch overflow-hidden rounded-[1.75rem] border border-line bg-white transition-all duration-500",
                  "hover:-translate-y-1 hover:border-transparent hover:shadow-card focus-visible:-translate-y-1",
                )}
                style={{ "--i-from": item.from, "--i-to": item.to, "--i-accent": item.accent } as React.CSSProperties}
              >
                <div className="relative z-10 flex flex-1 flex-col justify-between p-6 sm:p-7">
                  <div>
                    <span className="text-sm font-semibold text-[var(--i-accent)] tabular-nums opacity-80">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-ink sm:text-[1.35rem]">{item.title}</h3>
                    <p className="mt-2 max-w-[15rem] leading-7 text-muted">{item.text}</p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--i-accent)] opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 max-lg:opacity-100">
                    استعرض الأعمال
                    <ArrowIcon className="size-4 transition-transform group-hover:-translate-x-1" />
                  </span>
                </div>
                <div className="relative w-[38%] shrink-0">
                  <div className="absolute inset-y-3 right-0 left-3 rounded-[1.4rem] bg-gradient-to-br from-[var(--i-from)] to-[var(--i-to)] transition-all duration-500 group-hover:inset-y-0 group-hover:left-0 group-hover:rounded-none" />
                  <ProductArt
                    kind={item.product}
                    tint={item.accent}
                    className="absolute inset-0 m-auto w-[86%] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
                  />
                </div>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
