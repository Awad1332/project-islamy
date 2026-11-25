'use client';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { iconForPath } from './icons';
import { Button } from './ui/button';
import { useI18n } from '@/i18n';

/** Every page opens the same way: concept icon · title · one-line explanation · (one) primary action. */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  const Icon = iconForPath(usePathname());
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {Icon && <span className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-700 sm:flex"><Icon className="size-6" strokeWidth={1.75} /></span>}
        <div>
          <h1 className="font-display text-2xl font-semibold md:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Pagination({ page, pageCount, total, onPage }: { page: number; pageCount: number; total: number; onPage: (p: number) => void }) {
  const { t, num, locale } = useI18n();
  if (pageCount <= 1) return <p className="mt-3 text-xs text-muted-foreground">{num(total)}</p>;
  const Prev = locale === 'ar' ? ChevronRight : ChevronLeft;
  const Next = locale === 'ar' ? ChevronLeft : ChevronRight;
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{t('common.page')} {num(page)} {t('common.of')} {num(pageCount)} · {num(total)}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><Prev />{t('common.prev')}</Button>
        <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>{t('common.next')}<Next /></Button>
      </div>
    </div>
  );
}

export function Stat({ label, value, hint, icon: Icon }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {Icon && <Icon className="size-4 text-gold" />}
      </div>
      <div className="mt-2 text-2xl font-semibold num">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
