'use client';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { ar, type Dict } from './ar';
import { en } from './en';
import { formatSar } from '@abaya/shared';

export type Locale = 'ar' | 'en';
const dicts: Record<Locale, Dict> = { ar, en };

interface I18n {
  locale: Locale;
  dict: Dict;
  t: (path: string, fallback?: string) => string;
  money: (halalas: number | null | undefined) => string;
  date: (d: string | Date | null | undefined, withTime?: boolean) => string;
  num: (n: number) => string;
  setLocale: (l: Locale) => void;
}
const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const setLocale = useCallback((l: Locale) => {
    document.cookie = `locale=${l}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }, []);
  const value = useMemo<I18n>(() => {
    const dict = dicts[locale];
    const t = (path: string, fallback?: string) => {
      const v = path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), dict);
      return typeof v === 'string' ? v : fallback ?? path.split('.').pop() ?? path;
    };
    const tag = locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB';
    return {
      locale, dict, t, setLocale,
      money: (h) => (h == null ? '—' : formatSar(h, locale).replace('ر.س.‏', 'ر.س')),
      date: (d, withTime) => (d ? new Intl.DateTimeFormat(tag, { timeZone: 'Asia/Riyadh', dateStyle: 'medium', ...(withTime ? { timeStyle: 'short' } : {}) }).format(new Date(d)) : '—'),
      num: (n) => new Intl.NumberFormat(tag).format(n),
    };
  }, [locale, setLocale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('I18nProvider missing');
  return v;
}
