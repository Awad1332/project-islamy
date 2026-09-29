import { faq, home } from "@/content/site";
import { PageShell } from "@/components/layout/PageShell";
import { Hero } from "@/components/sections/Hero";
import { Clients } from "@/components/sections/Clients";
import { Problems } from "@/components/sections/home/Problems";
import { Outcomes } from "@/components/sections/home/Outcomes";
import { ServicesOverview } from "@/components/sections/home/ServicesOverview";
import { Process } from "@/components/sections/home/Process";
import { FeaturedWork } from "@/components/sections/home/FeaturedWork";
import { Packages } from "@/components/sections/home/Packages";
import { Comparison } from "@/components/sections/home/Comparison";
import { Commitment } from "@/components/sections/home/Commitment";
import { Testimonials } from "@/components/sections/Testimonials";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";

/**
 * Sales page structure: promise → pain → solution → offer → proof →
 * process → packages → objections → risk reversal → call to action.
 */
export default function HomePage() {
  return (
    <PageShell>
      <Hero />
      <Clients />
      <Problems />
      <Outcomes />
      <ServicesOverview />
      <FeaturedWork />
      <Process />
      <Packages />
      <Comparison />
      <Testimonials />
      <Commitment />
      <Faq items={[...home.faq.extra, ...faq.items.filter((_, i) => [1, 4, 5].includes(i))]} />
      <FinalCta />
    </PageShell>
  );
}
