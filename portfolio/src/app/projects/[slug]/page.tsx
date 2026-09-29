import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects, site } from "@/content/site";
import { ProjectDetail } from "@/components/portfolio/ProjectDetail";
import { PageShell } from "@/components/layout/PageShell";
import { ArrowIcon } from "@/components/ui/Icons";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${p.categoryLabel}`,
    description: p.summary,
    alternates: { canonical: `/projects/${p.slug}/` },
    openGraph: {
      title: `${p.name} | ${site.nameAr}`,
      description: p.summary,
      url: `/projects/${p.slug}/`,
      locale: "ar_SA",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();
  const project = projects[index];
  const next = projects[(index + 1) % projects.length];

  return (
    <PageShell>
      <div className="bg-white">
        <div className="container-x max-w-[1100px] py-12 sm:py-16">
          <nav aria-label="مسار التنقل" className="mb-8 text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-primary">
                  الرئيسية
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/work/" className="hover:text-primary">
                  أعمالي
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="font-medium text-ink">
                {project.name}
              </li>
            </ol>
          </nav>
          <ProjectDetail project={project} headingLevel="h1" />

          <a
            href={`/projects/${next.slug}/`}
            className="group mt-16 flex items-center justify-between gap-4 rounded-[2rem] bg-alt p-6 ring-1 ring-line transition hover:bg-lilac sm:p-8"
          >
            <span>
              <span className="text-sm text-muted">المشروع التالي</span>
              <span className="mt-1 block text-2xl font-bold text-ink">{next.name}</span>
            </span>
            <span className="grid size-12 place-items-center rounded-full bg-white text-primary ring-1 ring-line transition group-hover:bg-primary group-hover:text-white">
              <ArrowIcon className="size-5" />
            </span>
          </a>
        </div>
      </div>
    </PageShell>
  );
}
