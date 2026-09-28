import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/layout/BackToTop";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { Clients } from "@/components/sections/Clients";
import { Industries } from "@/components/sections/Industries";
import { Services } from "@/components/sections/Services";
import { Journey } from "@/components/sections/Journey";
import { Portfolio } from "@/components/sections/Portfolio";
import { Tools } from "@/components/sections/Tools";
import { Testimonials } from "@/components/sections/Testimonials";
import { About } from "@/components/sections/About";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";

export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main id="main">
        <Hero />
        <Stats />
        <Clients />
        <Industries />
        <Services />
        <Journey />
        <Portfolio />
        <Tools />
        <Testimonials />
        <About />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
