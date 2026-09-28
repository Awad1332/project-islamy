import { about, site, whatsappLink } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ArrowIcon, SparkIcon } from "@/components/ui/Icons";
import { Sphere, RoundedCube } from "@/components/visuals/Shapes";

function PortraitPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-b from-lilac via-[#e9e1ff] to-[#cdbcff]">
      <svg viewBox="0 0 200 220" className="w-[78%]" aria-hidden>
        <defs>
          <linearGradient id="portrait-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8f6bff" />
            <stop offset="1" stopColor="#40218c" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="78" r="42" fill="url(#portrait-g)" opacity="0.9" />
        <path d="M22 220c4-52 38-82 78-82s74 30 78 82z" fill="url(#portrait-g)" opacity="0.9" />
      </svg>
      <span className="absolute top-5 right-5 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-deep">
        مكان الصورة الشخصية
      </span>
    </div>
  );
}

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative overflow-hidden bg-alt section-y">
      <div className="container-x grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        {/* Portrait */}
        <Reveal className="relative mx-auto w-full max-w-[460px]">
          <RoundedCube className="absolute -top-6 -left-6 size-20 rotate-12 motion-safe:animate-float" tone="light" />
          <Sphere className="absolute -right-5 -bottom-5 size-16 motion-safe:animate-float-slow" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-card ring-8 ring-white">
            {about.portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={about.portrait}
                alt={`${site.nameAr} — ${site.titleAr}`}
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <PortraitPlaceholder />
            )}
          </div>
          <div className="glass absolute -bottom-6 left-1/2 w-[86%] -translate-x-1/2 rounded-2xl p-4 shadow-float ring-1 ring-white/70 sm:-right-6 sm:left-auto sm:w-auto sm:translate-x-0">
            <p className="text-base font-bold text-ink">{site.nameAr}</p>
            <p className="text-sm text-muted">{site.titleAr}</p>
          </div>
        </Reveal>

        {/* Copy */}
        <div>
          <SectionHeading
            id="about-title"
            eyebrow={about.eyebrow}
            title={about.title}
            align="start"
            className="max-lg:mx-auto max-lg:text-center"
          />
          <Reveal delay={80} className="mt-6 space-y-5 text-lg leading-9 text-muted">
            {about.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>

          <ul className="mt-9 grid gap-4 sm:grid-cols-2">
            {about.pillars.map((p, i) => (
              <Reveal
                as="li"
                key={p.title}
                delay={i * 70}
                className="rounded-2xl bg-white p-5 ring-1 ring-line transition hover:shadow-soft"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-lilac text-primary">
                  <SparkIcon className="size-5" />
                </span>
                <h3 className="mt-4 font-bold text-ink">{p.title}</h3>
                <p className="mt-1.5 leading-7 text-muted">{p.text}</p>
              </Reveal>
            ))}
          </ul>

          <Reveal className="mt-10 flex justify-center lg:justify-start">
            <Button
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              icon={<ArrowIcon className="size-5 transition-transform group-hover:-translate-x-1" />}
            >
              {about.cta}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
