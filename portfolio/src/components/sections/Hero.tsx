import { hero, primaryOffer, whatsappLink } from "@/content/site";
import type { StoreTheme } from "@/content/site";
import { Button } from "@/components/ui/Button";
import { ArrowIcon, CheckIcon, CursorIcon, DevicesIcon, FlowIcon, PaletteIcon } from "@/components/ui/Icons";
import { DesktopMockup, MobileMockup, TabletMockup } from "@/components/visuals/StoreMockup";
import { Sphere, Torus, Capsule } from "@/components/visuals/Shapes";
import { cn } from "@/lib/cn";

const heroTheme: StoreTheme = { primary: "#7047EB", soft: "#F2EDFF", ink: "#19152B", surface: "#FFFFFF" };
const perfumeTheme: StoreTheme = { primary: "#40218C", soft: "#EFE9FF", ink: "#1E1638", surface: "#FFFFFF" };
const beautyTheme: StoreTheme = { primary: "#C0476A", soft: "#FFF0F3", ink: "#2A1520", surface: "#FFFFFF" };

export function Hero() {
  return (
    <section id="home" tabIndex={-1} aria-labelledby="hero-title" className="relative isolate overflow-hidden outline-none">
      {/* Background */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-lilac/70 via-white to-white" />
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_20%,#000_20%,transparent_70%)]" />
        <div className="absolute -top-40 left-[-10%] size-[42rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-20 right-[-15%] size-[30rem] rounded-full bg-[#b9a2ff]/25 blur-[110px]" />
      </div>

      <div className="container-x grid items-center gap-14 pt-10 pb-20 sm:pt-16 lg:grid-cols-[1fr_1.08fr] lg:gap-10 lg:pt-20 lg:pb-32">
        {/* Copy */}
        <div className="relative z-10 text-center lg:text-start">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/90 py-1.5 ps-1.5 pe-4 text-sm font-semibold text-deep shadow-soft ring-1 ring-line">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-white">جديد</span>
            {hero.badge}
          </p>

          <h1
            id="hero-title"
            className="mt-7 text-[2.35rem] leading-[1.25] font-bold tracking-tight text-ink sm:text-5xl sm:leading-[1.2] lg:text-[3.7rem] lg:leading-[1.18] xl:text-[4.1rem]"
          >
            {hero.titleLead} <span className="text-gradient">{hero.titleHighlight}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted sm:text-xl sm:leading-9 lg:mx-0">{hero.paragraph}</p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
            <Button
              href={whatsappLink(primaryOffer.message)}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              icon={<ArrowIcon className="size-5 transition-transform group-hover:-translate-x-1" />}
            >
              {hero.primaryCta.label}
            </Button>
            <Button href={hero.secondaryCta.href} size="lg" variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>

          <p className="mt-4 text-[0.95rem] text-muted">{hero.trust}</p>

          <ul className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-x-4 gap-y-3 text-start lg:mx-0">
            {hero.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-[0.95rem] font-medium text-ink">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-lilac text-primary">
                  <CheckIcon className="size-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual */}
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[1/0.86] w-full max-w-[640px]" aria-hidden>
      {/* soft glow + shapes */}
      <div className="absolute inset-[8%] rounded-full bg-gradient-to-br from-primary/25 to-[#c9b6ff]/10 blur-3xl" />
      <Sphere className="absolute top-[2%] left-[4%] size-[13%] motion-safe:animate-float" />
      <Torus className="absolute right-[-2%] bottom-[16%] size-[14%] motion-safe:animate-float-slow" tone="light" />
      <Capsule className="absolute bottom-[2%] left-[34%] h-[6%] w-[16%] -rotate-12" />

      {/* Desktop (back) */}
      <DesktopMockup
        theme={heroTheme}
        storeName="دار العطور"
        tagline="عطور تحكي حضورك في كل مناسبة"
        products={["perfume", "incense", "perfume", "perfume"]}
        className="absolute top-[8%] right-[0%] w-[86%]"
      />

      {/* Tablet */}
      <TabletMockup
        theme={beautyTheme}
        storeName="ندى"
        products={["serum", "lipstick", "serum"]}
        className="absolute right-[4%] bottom-[-2%] w-[25%] rotate-[3deg]"
      />

      {/* Mobile (front) */}
      <MobileMockup
        theme={perfumeTheme}
        storeName="عود"
        products={["perfume", "incense", "perfume", "incense"]}
        className="absolute bottom-[-4%] left-[6%] w-[23%] motion-safe:animate-float-slow"
      />

      {/* Floating UI cards */}
      <FloatCard
        className="top-[-3%] right-[8%] motion-safe:animate-float"
        icon={<PaletteIcon className="size-4.5" />}
        title="تصميم المتجر"
      >
        <div className="mt-2 flex gap-1">
          {["#7047EB", "#40218C", "#F2EDFF", "#19152B"].map((c) => (
            <span key={c} className="size-4 rounded-md ring-1 ring-black/5" style={{ background: c }} />
          ))}
        </div>
      </FloatCard>

      <FloatCard
        className="top-[34%] left-[-8%] hidden motion-safe:animate-float-slow sm:block"
        icon={<CursorIcon className="size-4.5" />}
        title="تجربة المستخدم"
      >
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-1.5 w-8 rounded-full bg-primary" />
          <span className="h-1.5 w-5 rounded-full bg-primary/40" />
          <span className="h-1.5 w-3 rounded-full bg-primary/20" />
        </div>
      </FloatCard>

      <FloatCard
        className="right-[-4%] bottom-[34%] hidden motion-safe:animate-float sm:block"
        icon={<FlowIcon className="size-4.5" />}
        title="رحلة الشراء"
      >
        <div className="mt-2 flex items-center gap-1 text-[0.65rem] font-medium text-muted">
          <span className="rounded bg-alt px-1.5 py-0.5">تصفّح</span>
          <ArrowIcon className="size-3" />
          <span className="rounded bg-alt px-1.5 py-0.5">سلة</span>
          <ArrowIcon className="size-3" />
          <span className="rounded bg-primary px-1.5 py-0.5 text-white">طلب</span>
        </div>
      </FloatCard>

      <FloatCard
        className="bottom-[10%] left-[32%] motion-safe:animate-float"
        icon={<DevicesIcon className="size-4.5" />}
        title="تصميم متجاوب"
      >
        <p className="mt-1 text-[0.7rem] text-muted">جوال · تابلت · سطح المكتب</p>
      </FloatCard>
    </div>
  );
}

function FloatCard({
  className,
  icon,
  title,
  children,
}: {
  className?: string;
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("glass absolute z-10 rounded-2xl p-2 pe-3 shadow-float ring-1 ring-white/70 sm:p-3 sm:pe-4", className)}>
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-xl bg-lilac text-primary sm:size-8">{icon}</span>
        <span className="text-[0.75rem] font-bold whitespace-nowrap text-ink sm:text-[0.8rem]">{title}</span>
      </div>
      <div className="hidden sm:block">{children}</div>
    </div>
  );
}
