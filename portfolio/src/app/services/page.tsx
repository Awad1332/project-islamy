import type { Metadata } from "next";
import { pages } from "@/content/site";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/ui/PageHero";
import { Services } from "@/components/sections/Services";
import { Industries } from "@/components/sections/Industries";
import { Process } from "@/components/sections/home/Process";
import { Packages } from "@/components/sections/home/Packages";
import { FinalCta } from "@/components/sections/FinalCta";

export const metadata: Metadata = {
  title: pages.services.title,
  description: pages.services.text,
  alternates: { canonical: "/services/" },
};

export default function ServicesPage() {
  return (
    <PageShell>
      <PageHero {...pages.services} />
      <Services />
      <Industries />
      <Process />
      <Packages />
      <FinalCta />
    </PageShell>
  );
}
