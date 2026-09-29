import Link from "next/link";
import { home, projects } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlaceholderBadge } from "@/components/ui/PlaceholderBadge";
import { ArrowIcon } from "@/components/ui/Icons";
import { ProjectCover } from "@/components/portfolio/ProjectVisual";

export function FeaturedWork() {
  const d = home.work;
  return (
    <section aria-labelledby="featured-work-title" className="section-y">
      <div className="container-x">
        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="featured-work-title"
            eyebrow={d.eyebrow}
            title={d.title}
            subtitle={d.subtitle}
            align="start"
            className="max-lg:text-center"
          />
          <Link
            href="/work/"
            className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 font-semibold text-primary ring-1 ring-line transition hover:bg-lilac"
          >
            {d.cta}
            <ArrowIcon className="size-4" />
          </Link>
        </div>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {projects.slice(0, 3).map((p, i) => (
            <Reveal as="li" key={p.slug} delay={i * 90}>
              <Link
                href={`/projects/${p.slug}/`}
                className="group relative block h-full overflow-hidden rounded-[1.75rem] border border-line bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-card"
              >
                <ProjectCover project={p} />
                {p.isIllustrative && <PlaceholderBadge className="absolute top-3 right-3" label="مشروع توضيحي" />}
                <span className="block p-6">
                  <span className="text-sm font-semibold text-primary">{p.categoryLabel}</span>
                  <span className="mt-1.5 block text-xl font-bold text-ink">{p.name}</span>
                  <span className="mt-2 block leading-7 text-muted">{p.summary}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
