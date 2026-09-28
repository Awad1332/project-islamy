import type { Project } from "@/content/site";
import { DesktopMockup, MobileMockup } from "@/components/visuals/StoreMockup";
import { cn } from "@/lib/cn";

/** Cover image for a project: real screenshot when provided, otherwise a generated mockup. */
export function ProjectCover({ project, className }: { project: Project; className?: string }) {
  const img = project.images?.[0];
  return (
    <div
      className={cn("relative aspect-[16/11] overflow-hidden", className)}
      style={{ background: `linear-gradient(145deg, ${project.theme.soft}, #ffffff 70%)` }}
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img.src} alt={img.alt} loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <div
            aria-hidden
            className="absolute -bottom-1/3 left-1/2 size-3/4 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: project.theme.primary }}
          />
          <DesktopMockup
            theme={project.theme}
            storeName={project.name}
            tagline={project.tagline}
            products={project.products}
            className="absolute top-[10%] right-[7%] w-[78%] transition-transform duration-700 group-hover:-translate-y-1.5"
          />
          <MobileMockup
            theme={project.theme}
            storeName={project.name.split(" ")[0]}
            products={project.products}
            className="absolute bottom-[-28%] left-[6%] w-[22%] transition-transform duration-700 group-hover:-translate-y-3"
          />
        </>
      )}
    </div>
  );
}
