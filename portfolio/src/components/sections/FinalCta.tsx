import { finalCta, primaryOffer, whatsappLink } from "@/content/site";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ArrowIcon, WhatsAppIcon } from "@/components/ui/Icons";
import { Capsule, RoundedCube, Sphere, Torus } from "@/components/visuals/Shapes";

export function FinalCta() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="px-3 py-16 sm:px-6 sm:py-20 lg:py-24">
      <Reveal className="relative isolate mx-auto max-w-[1320px] overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#5a31d6] via-deep to-deeper px-6 py-20 text-center text-white sm:px-12 sm:py-24 lg:py-28">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_10%,transparent_70%)] opacity-30" />
          <div className="absolute top-[-30%] left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-[#9a74ff]/40 blur-[120px]" />
          <Sphere className="absolute top-[12%] right-[6%] size-20 motion-safe:animate-float sm:size-28" tone="light" />
          <Torus className="absolute bottom-[-6%] left-[4%] size-32 motion-safe:animate-float-slow sm:size-44" tone="purple" />
          <RoundedCube
            className="absolute top-[14%] left-[10%] hidden size-16 rotate-12 motion-safe:animate-float-slow md:block"
            tone="purple"
          />
          <Capsule className="absolute right-[12%] bottom-[12%] hidden h-10 w-28 -rotate-[24deg] md:block" tone="purple" />
        </div>

        <h2 id="contact-title" className="mx-auto max-w-3xl text-4xl leading-[1.2] font-bold sm:text-5xl lg:text-6xl">
          {finalCta.title}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl sm:leading-9">{finalCta.text}</p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button
            href={whatsappLink(primaryOffer.message)}
            target="_blank"
            rel="noopener noreferrer"
            variant="white"
            size="lg"
            icon={<WhatsAppIcon className="size-5" />}
          >
            {finalCta.primary}
          </Button>
          <Button
            href="/work/"
            variant="outlineWhite"
            size="lg"
            icon={<ArrowIcon className="size-5 transition-transform group-hover:-translate-x-1" />}
          >
            {finalCta.secondary}
          </Button>
        </div>
        {finalCta.note && <p className="mx-auto mt-8 max-w-xl text-sm text-white/65">{finalCta.note}</p>}
      </Reveal>
    </section>
  );
}
