import Link from "next/link";
import { services } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowIcon } from "@/components/ui/Icons";

export function ServicesOverview() {
  return (
    <section aria-labelledby="services-overview-title" className="bg-alt section-y">
      <div className="container-x">
        <SectionHeading
          id="services-overview-title"
          eyebrow={services.eyebrow}
          title={services.title}
          subtitle={services.subtitle}
        />
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.items.map((s, i) => (
            <Reveal as="li" key={s.id} delay={(i % 3) * 70} className={i === 0 ? "sm:col-span-2 lg:col-span-1" : undefined}>
              <Link
                href={`/services/#service-${s.id}`}
                className="group flex h-full flex-col rounded-[1.75rem] border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card"
              >
                <span className="text-sm font-semibold text-primary">{s.label}</span>
                <h3 className="mt-3 text-xl leading-snug font-bold text-ink">{s.title}</h3>
                <p className="mt-3 flex-1 leading-7 text-muted">{s.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-primary">
                  تفاصيل الخدمة
                  <ArrowIcon className="size-4 transition-transform group-hover:-translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
          <Reveal as="li" delay={140}>
            <Link
              href="/contact/"
              className="group flex h-full flex-col justify-between rounded-[1.75rem] bg-gradient-to-br from-primary to-deep p-7 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-float"
            >
              <span>
                <span className="text-sm font-semibold text-white/75">غير متأكد من البداية؟</span>
                <span className="mt-3 block text-xl leading-snug font-bold">ابدأ بمراجعة مجانية وسأقترح عليك الخدمة الأنسب</span>
              </span>
              <span className="mt-6 inline-flex items-center gap-2 font-semibold">
                احجز المراجعة
                <ArrowIcon className="size-4 transition-transform group-hover:-translate-x-1" />
              </span>
            </Link>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
