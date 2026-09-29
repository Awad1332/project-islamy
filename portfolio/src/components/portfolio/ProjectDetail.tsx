import type { Project } from "@/content/site";
import { whatsappLink } from "@/content/site";
import { DesktopMockup, MobileMockup, TabletMockup } from "@/components/visuals/StoreMockup";
import { PlaceholderBadge } from "@/components/ui/PlaceholderBadge";
import { CheckIcon, ExternalIcon, WhatsAppIcon } from "@/components/ui/Icons";

/** Full project case study rendered on each project page. */
export function ProjectDetail({ project, headingLevel = "h2" }: { project: Project; headingLevel?: "h1" | "h2" }) {
  const H = headingLevel;
  const hasImages = Boolean(project.images?.length);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-lilac px-3 py-1 text-sm font-semibold text-primary">{project.categoryLabel}</span>
        {project.year && <span className="rounded-full bg-alt px-3 py-1 text-sm text-muted">{project.year}</span>}
        <PlaceholderBadge show={project.isIllustrative} label="مشروع توضيحي — ليس عميلًا فعليًا" />
      </div>
      <H id="project-title" className="mt-4 text-3xl leading-tight font-bold text-ink sm:text-4xl">
        {project.name}
      </H>
      <p className="mt-2 text-lg text-muted">{project.tagline}</p>

      {/* Hero preview */}
      <div
        className="relative mt-8 overflow-hidden rounded-[1.75rem] ring-1 ring-line"
        style={{ background: `linear-gradient(150deg, ${project.theme.soft}, #ffffff 75%)` }}
      >
        {hasImages ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.images![0].src} alt={project.images![0].alt} className="w-full" />
        ) : (
          <div className="relative aspect-[16/9]">
            <DesktopMockup
              theme={project.theme}
              storeName={project.name}
              tagline={project.tagline}
              products={project.products}
              label={`واجهة سطح المكتب لمتجر ${project.name}`}
              className="absolute top-[8%] right-[6%] w-[72%]"
            />
            <MobileMockup
              theme={project.theme}
              storeName={project.name.split(" ")[0]}
              products={project.products}
              label={`واجهة الجوال لمتجر ${project.name}`}
              className="absolute bottom-[-10%] left-[5%] w-[20%]"
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-10">
          <Block title="نظرة عامة">
            <p className="text-lg leading-8 text-muted">{project.overview}</p>
          </Block>
          <Block title="أهداف المشروع">
            <List items={project.objectives} />
          </Block>
          <Block title="منهجية التصميم">
            <List items={project.approach} />
          </Block>
          {project.outcome && (
            <Block title="النتيجة">
              <p className="text-lg leading-8 text-muted">{project.outcome}</p>
            </Block>
          )}
        </div>

        <aside className="h-fit space-y-6 rounded-[1.5rem] bg-alt p-6 ring-1 ring-line">
          <div>
            <p className="text-sm text-muted">القطاع</p>
            <p className="mt-1 font-semibold text-ink">{project.categoryLabel}</p>
          </div>
          <div>
            <p className="text-sm text-muted">الخدمات المقدمة</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {project.services.map((s) => (
                <li key={s} className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-ink ring-1 ring-line">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full bg-white py-3 font-semibold text-primary ring-1 ring-line transition hover:ring-primary/40"
            >
              زيارة المتجر <ExternalIcon className="size-4" />
            </a>
          )}
          <a
            href={whatsappLink(`مرحبًا عوض، شاهدت مشروع «${project.name}» وأرغب في مشروع مشابه.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-white transition hover:bg-primary-600"
          >
            <WhatsAppIcon className="size-5" /> أريد مشروعًا مشابهًا
          </a>
        </aside>
      </div>

      {/* Screens */}
      <Block title="واجهات رئيسية وعرض متجاوب" className="mt-12">
        {hasImages && project.images!.length > 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {project.images!.slice(1).map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.src} src={img.src} alt={img.alt} loading="lazy" className="w-full rounded-2xl ring-1 ring-line" />
            ))}
          </div>
        ) : (
          <div className="grid items-end gap-4 rounded-[1.75rem] bg-alt p-5 ring-1 ring-line sm:grid-cols-[2.2fr_1fr_0.7fr] sm:gap-6 sm:p-8">
            <figure>
              <DesktopMockup
                theme={project.theme}
                storeName={project.name}
                tagline={project.tagline}
                products={[...project.products].reverse()}
              />
              <figcaption className="mt-3 text-center text-sm text-muted">سطح المكتب</figcaption>
            </figure>
            <figure className="mx-auto w-2/3 sm:w-full">
              <TabletMockup theme={project.theme} storeName={project.name} products={project.products} />
              <figcaption className="mt-3 text-center text-sm text-muted">التابلت</figcaption>
            </figure>
            <figure className="mx-auto w-1/2 sm:w-full">
              <MobileMockup
                theme={project.theme}
                storeName={project.name.split(" ")[0]}
                products={[...project.products].reverse()}
              />
              <figcaption className="mt-3 text-center text-sm text-muted">الجوال</figcaption>
            </figure>
          </div>
        )}
      </Block>
    </div>
  );
}

function Block({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h3 className="mb-4 text-xl font-bold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((it) => (
        <li key={it} className="flex items-start gap-3 text-lg leading-8 text-muted">
          <span className="mt-1.5 grid size-5 shrink-0 place-items-center rounded-full bg-lilac text-primary">
            <CheckIcon className="size-3" />
          </span>
          {it}
        </li>
      ))}
    </ul>
  );
}
