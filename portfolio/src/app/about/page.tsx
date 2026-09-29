import type { Metadata } from "next";
import { pages } from "@/content/site";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/ui/PageHero";
import { About } from "@/components/sections/About";
import { Stats } from "@/components/sections/Stats";
import { Clients } from "@/components/sections/Clients";
import { Testimonials } from "@/components/sections/Testimonials";
import { FinalCta } from "@/components/sections/FinalCta";

export const metadata: Metadata = {
  title: pages.about.title,
  description: pages.about.text,
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero {...pages.about} />
      <About />
      <Stats />
      <Clients />
      <Testimonials />
      <FinalCta />
    </PageShell>
  );
}
