import type { MetadataRoute } from "next";
import { projects, site } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, changeFrequency: "monthly", priority: 1 },
    ...["about", "services", "work", "expertise", "contact"].map((p) => ({
      url: `${site.url}/${p}/`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...projects.map((p) => ({ url: `${site.url}/projects/${p.slug}/`, changeFrequency: "yearly" as const, priority: 0.6 })),
  ];
}
