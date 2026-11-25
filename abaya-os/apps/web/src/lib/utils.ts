import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
}

export function sarInput(halalas: number | null | undefined) {
  return halalas == null ? '' : (halalas / 100).toString();
}
export function toHalalas(v: string | number) {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
