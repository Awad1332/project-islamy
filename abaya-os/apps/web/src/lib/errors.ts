import { ApiError } from './api';

/** Translates API errors (and Zod field messages) into localized text. */
export function errorText(e: unknown, t: (k: string, f?: string) => string): string {
  if (e instanceof ApiError) {
    const known = t(`errors.${e.code}`, '');
    if (known) return known;
    return e.message || t('common.error');
  }
  return t('common.error');
}

export function fieldErrors(e: unknown, t: (k: string, f?: string) => string): Record<string, string> {
  if (!(e instanceof ApiError) || !Array.isArray(e.details)) return {};
  const out: Record<string, string> = {};
  for (const d of e.details as { path: string; message: string }[]) out[d.path] = t(`errors.${d.message}`, d.message);
  return out;
}
