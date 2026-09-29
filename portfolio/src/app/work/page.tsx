import type { Metadata } from "next";
import { pages } from "@/content/site";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/ui/PageHero";
import { Portfolio } from "@/components/sections/Portfolio";
import { FinalCta } from "@/components/sections/FinalCta";

export const metadata: Metadata = {
  title: pages.work.title,
  description: pages.work.text,
  alternates: { canonical: "/work/" },
};

export default function WorkPage() {
  return (
    <PageShell>
      <PageHero {...pages.work} />
      <Portfolio bare />
      <FinalCta />
    </PageShell>
  );
}
