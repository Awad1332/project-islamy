import { home, whatsappLink } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { CheckIcon } from "@/components/ui/Icons";
import { cn } from "@/lib/cn";

export function Packages() {
  const d = home.packages;
  return (
    <section id="packages" aria-labelledby="packages-title" className="scroll-mt-20 bg-alt section-y">
      <div className="container-x">
        <SectionHeading id="packages-title" eyebrow={d.eyebrow} title={d.title} subtitle={d.subtitle} />
        <ul className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
          {d.items.map((p, i) => (
            <Reveal
              as="li"
              key={p.name}
              delay={i * 90}
              className={cn(
                "relative flex flex-col rounded-[2rem] p-7 sm:p-8",
                p.featured
                  ? "bg-gradient-to-b from-deep to-deeper text-white shadow-float lg:-my-4 lg:py-12"
                  : "border border-line bg-white",
              )}
            >
              {p.featured && "badge" in p && (
                <span className="absolute -top-3.5 right-7 rounded-full bg-[#ffd166] px-3.5 py-1 text-sm font-bold text-ink">
                  {p.badge}
                </span>
              )}
              <h3 className="text-2xl font-bold">{p.name}</h3>
              <p className={cn("mt-2", p.featured ? "text-white/75" : "text-muted")}>{p.for}</p>
              <p className={cn("mt-6 border-y py-5", p.featured ? "border-white/15" : "border-line")}>
                <span className="block text-3xl font-bold">{p.price || "حسب نطاق المشروع"}</span>
                <span className={cn("mt-1 block text-sm", p.featured ? "text-white/65" : "text-muted")}>
                  {p.price ? "يبدأ من" : "عرض سعر واضح بعد المراجعة المجانية"}
                </span>
              </p>
              <ul className="mt-6 grid flex-1 gap-3.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 leading-7">
                    <span
                      className={cn(
                        "mt-1 grid size-5 shrink-0 place-items-center rounded-full",
                        p.featured ? "bg-white text-deep" : "bg-lilac text-primary",
                      )}
                    >
                      <CheckIcon className="size-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={whatsappLink(`مرحبًا عوض، أرغب في معرفة تفاصيل باقة «${p.name}».`)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "mt-8 flex h-13 items-center justify-center rounded-full py-3.5 font-semibold transition",
                  p.featured ? "bg-white text-deep hover:bg-lilac" : "bg-primary text-white hover:bg-primary-600",
                )}
              >
                {p.cta}
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
