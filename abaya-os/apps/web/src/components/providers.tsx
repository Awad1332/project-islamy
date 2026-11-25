'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider, type Locale } from '@/i18n';
import { ApiError } from '@/lib/api';
import { UiModeProvider } from '@/lib/mode';

export function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 15_000, refetchOnWindowFocus: false, retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2 },
    },
  }));
  return (
    <QueryClientProvider client={qc}>
      <I18nProvider locale={locale}>
        <UiModeProvider><AuthProvider>{children}</AuthProvider></UiModeProvider>
        <Toaster position={locale === 'ar' ? 'top-left' : 'top-right'} dir={locale === 'ar' ? 'rtl' : 'ltr'} toastOptions={{ className: 'font-sans' }} richColors />
      </I18nProvider>
    </QueryClientProvider>
  );
}
