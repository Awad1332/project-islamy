import { cn } from '@/lib/utils';

/** ABAYA OS mark: charcoal tile, gold arch (abaya silhouette / Najdi doorway). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('size-9', className)} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#2B2B2B" />
      <path d="M20 8c-3.3 0-6 2.7-6 6v1.2L10.5 32h19L26 15.2V14c0-3.3-2.7-6-6-6Z" fill="none" stroke="#B8975A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 14.5V32" stroke="#B8975A" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Brand({ inverted, className }: { inverted?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <BrandMark />
      <span className={cn('font-display text-xl leading-none tracking-wide', inverted ? 'text-ivory' : 'text-charcoal')}>
        عباية <span className="text-xl font-bold tracking-[0.08em] text-gold" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontFeatureSettings: "normal" }}>OS</span>
      </span>
    </span>
  );
}
