import type { Metadata } from "next";
import { pages } from "@/content/site";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/ui/PageHero";
import { Journey } from "@/components/sections/Journey";
import { Tools } from "@/components/sections/Tools";
import { Comparison } from "@/components/sections/home/Comparison";
import { FinalCta } from "@/components/sections/FinalCta";

export const metadata: Metadata = {
  title: pages.expertise.title,
  description: pages.expertise.text,
  alternates: { canonical: "/expertise/" },
};

export default function ExpertisePage() {
  return (
    <PageShell>
      <PageHero {...pages.expertise} />
      <Journey />
      <Tools />
      <Comparison />
      <FinalCta />
    </PageShell>
  );
}
