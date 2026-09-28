import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { contact, faq, site } from "@/content/site";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.nameAr} | ${site.titleAr}`,
    template: `%s | ${site.nameAr}`,
  },
  description: site.seoDescription,
  keywords: site.keywords,
  authors: [{ name: site.nameEn, url: site.url }],
  creator: site.nameEn,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "/",
    siteName: `${site.nameAr} — ${site.nameEn}`,
    title: `${site.nameAr} | ${site.titleAr}`,
    description: site.seoDescription,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${site.nameAr} — ${site.titleAr}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.nameAr} | ${site.titleAr}`,
    description: site.seoDescription,
    images: ["/og.png"],
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#7047EB",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${site.url}/#person`,
      name: site.nameAr,
      alternateName: site.nameEn,
      jobTitle: site.titleAr,
      description: site.seoDescription,
      url: site.url,
      email: `mailto:${contact.email}`,
      sameAs: [contact.linkedin, contact.instagram, contact.x],
      knowsAbout: ["تصميم المتاجر الإلكترونية", "تجربة المستخدم", "سلة", "Figma", "WordPress"],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${site.url}/#service`,
      name: `${site.nameAr} — ${site.descriptor}`,
      url: site.url,
      founder: { "@id": `${site.url}/#person` },
      areaServed: ["SA", "AE", "KW", "QA", "BH", "OM"],
      availableLanguage: ["ar", "en"],
      serviceType: ["تصميم المتاجر الإلكترونية", "تجربة المستخدم", "تطوير واجهات المتاجر", "تحسين المتاجر"],
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable} suppressHydrationWarning>
      <head>
        {/* Enables scroll-reveal styles only when JS runs (content stays visible otherwise). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
        >
          تخطَّ إلى المحتوى الرئيسي
        </a>
        {children}
      </body>
    </html>
  );
}
