import { home } from "@/content/site";
import type { StoreTheme } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { CheckIcon } from "@/components/ui/Icons";
import { DesktopMockup, MobileMockup } from "@/components/visuals/StoreMockup";

const theme: StoreTheme = { primary: "#7047EB", soft: "#F2EDFF", ink: "#19152B", surface: "#FFFFFF" };

export function Outcomes() {
  const d = home.outcomes;
  return (
    <section aria-labelledby="outcomes-title" className="section-y">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading
            id="outcomes-title"
            eyebrow={d.eyebrow}
            title={d.title}
            subtitle={d.subtitle}
            align="start"
            className="max-lg:mx-auto max-lg:text-center"
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {d.items.map((it, i) => (
              <Reveal as="li" key={it.title} delay={i * 70} className="flex gap-4">
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-white">
                  <CheckIcon className="size-4" />
                </span>
                <span>
                  <span className="block text-lg font-bold text-ink">{it.title}</span>
                  <span className="mt-1 block leading-7 text-muted">{it.text}</span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
        <Reveal delay={120} className="relative mx-auto aspect-[5/4] w-full max-w-[600px]">
          <div aria-hidden className="absolute inset-[6%] rounded-full bg-primary/15 blur-3xl" />
          <DesktopMockup
            theme={theme}
            storeName="متجرك"
            tagline="تجربة تسوق تقود العميل إلى الطلب"
            products={["perfume", "serum", "ring", "watch"]}
            className="absolute top-[6%] right-0 w-[88%]"
          />
          <MobileMockup
            theme={theme}
            storeName="متجرك"
            products={["perfume", "serum", "ring", "watch"]}
            className="absolute bottom-0 left-[4%] w-[26%]"
          />
        </Reveal>
      </div>
    </section>
  );
}
