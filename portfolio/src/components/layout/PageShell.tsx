import type { ReactNode } from "react";
import { AnnouncementBar } from "./AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BackToTop } from "./BackToTop";
import { MobileCtaBar } from "./MobileCtaBar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <BackToTop />
      <MobileCtaBar />
      {/* Keeps the footer clear of the fixed mobile CTA bar */}
      <div aria-hidden className="h-[76px] sm:hidden" />
    </>
  );
}
