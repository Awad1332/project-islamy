import { cx } from "@/lib/cx";

const nf = new Intl.NumberFormat("ar-SA-u-nu-latn");
export const fmtN = (n: number) => nf.format(n);
export const fmtPct = (p: number, digits = 0) => `${(p * 100).toFixed(digits)}%`;

export function Delta({ cur, prev, suffix = "" }: { cur: number; prev: number; suffix?: string }) {
  if (!prev) return null;
  const d = (cur - prev) / prev;
  const up = d >= 0;
  return (
    <span className={cx("num inline-flex items-center gap-0.5 text-xs", up ? "text-ok" : "text-danger")}>
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {fmtPct(Math.abs(d))}
      {suffix}
      <span className="sr-only">{up ? "ارتفاع" : "انخفاض"} مقارنة بالفترة السابقة</span>
    </span>
  );
}

export function StatTile({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="num mt-2 font-display text-[32px] font-semibold leading-none">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        {delta}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

/** Horizontal magnitude bars: one hue, value labels in text ink, hover title. */
export function BarList({ items, max = 6 }: { items: { key: string; label: string; pct: number; count: number }[]; max?: number }) {
  const shown = items.slice(0, max);
  const top = Math.max(...shown.map((s) => s.pct), 0.0001);
  return (
    <ul className="space-y-3">
      {shown.map((s, i) => (
        <li key={s.key} className="group" title={`${s.label}: ${fmtPct(s.pct, 1)} (${fmtN(s.count)} تصميم)`}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className={cx(i === 0 && "font-medium")}>{s.label}</span>
            <span className="num text-ink-2">{fmtPct(s.pct)}</span>
          </div>
          <div className="h-2 rounded-full bg-sand">
            <div
              className={cx("h-full rounded-full transition-all duration-700 group-hover:opacity-80", i === 0 ? "bg-ink" : "bg-ink/45")}
              style={{ width: `${Math.max(2, (s.pct / top) * 100)}%` }}
            />
          </div>
        </li>
      ))}
      {items.length === 0 && <li className="py-6 text-center text-sm text-muted">لا توجد بيانات بعد</li>}
    </ul>
  );
}

/** Daily columns (single series) with per-bar hover. */
export function DailyColumns({ series }: { series: { day: string; designs: number; orders: number }[] }) {
  const max = Math.max(1, ...series.map((s) => s.designs));
  const W = 600;
  const H = 140;
  const bw = W / series.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 4}`} className="h-44 w-full" role="img" aria-label="التصميمات اليومية">
        <line x1="0" x2={W} y1={H} y2={H} stroke="var(--color-line-2)" strokeWidth="1" />
        {series.map((s, i) => {
          const h = (s.designs / max) * (H - 8);
          // RTL: newest day on the left
          const x = W - (i + 1) * bw;
          return (
            <g key={s.day}>
              <title>{`${s.day}: ${s.designs} تصميم، ${s.orders} طلب`}</title>
              <rect x={x} y={0} width={bw} height={H} fill="transparent" />
              <rect x={x + 2} y={H - h} width={Math.max(2, bw - 4)} height={h} rx="3" fill="var(--color-ink)" opacity={i === series.length - 1 ? 1 : 0.32} />
            </g>
          );
        })}
      </svg>
      <figcaption className="num -mt-3 flex justify-between text-[11px] text-muted">
        <span>{series[0]?.day.slice(5)}</span>
        <span>{series[series.length - 1]?.day.slice(5)}</span>
        <span className="sr-only">عدد التصميمات اليومية خلال الفترة</span>
      </figcaption>
    </figure>
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-2xl border border-line bg-white p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-medium">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
