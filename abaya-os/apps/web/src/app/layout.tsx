import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = { title: 'ABAYA OS — عباية OS', description: 'منصة إدارة متاجر العبايات السعودية' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await cookies()).get('locale')?.value === 'en' ? 'en' : 'ar';
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Noto+Naskh+Arabic:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
