import type { Metadata } from "next";
import { pages } from "@/content/site";
import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/ui/PageHero";
import { ContactSection } from "@/components/sections/ContactSection";
import { Faq } from "@/components/sections/Faq";

export const metadata: Metadata = {
  title: pages.contact.title,
  description: pages.contact.text,
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <PageShell>
      <PageHero {...pages.contact} />
      <ContactSection />
      <Faq />
    </PageShell>
  );
}
