'use client';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Brand } from '@/components/brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-charcoal lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(184,151,90,0.25),transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-ivory">
          <Brand inverted />
          <div>
            <div className="mb-6 h-px w-24 bg-gold" />
            <p className="font-display text-4xl leading-relaxed">{t('app.tagline')}</p>
            <p className="mt-4 max-w-md text-ivory/70">{t('auth.welcomeSub')}</p>
          </div>
          <p className="text-xs text-ivory/50">SAR · Asia/Riyadh · ZATCA Phase 1 QR</p>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4">
          <span className="lg:hidden"><Brand /></span><span className="hidden lg:block" />
          <Button variant="ghost" size="sm" onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}>{t('common.language')}</Button>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
