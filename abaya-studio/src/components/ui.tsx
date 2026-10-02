"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cx } from "@/lib/cx";

export { cx };

/* ---------- Icons (inline, stroke-based) ---------- */
const paths: Record<string, ReactNode> = {
  arrowNext: <path d="M15 6l-6 6 6 6" />, // RTL: "next" points left
  arrowPrev: <path d="M9 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  refresh: <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />,
  bag: <><path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.9l7.6-4.4M8.2 13.1l7.6 4.4" /></>,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  ruler: <><path d="M3 17L17 3l4 4L7 21z" /><path d="M7 13l2 2M10 10l2 2M13 7l2 2" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4M12 17h.01" /></>,
  zoomIn: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5" /></>,
  zoomOut: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2M8.5 11h5" /></>,
  rotate: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  layers: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
  box: <><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></>,
  flask: <path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></>,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
};

export function Icon({ name, className = "size-5", strokeWidth = 1.6 }: { name: keyof typeof paths | string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

/* ---------- Buttons ---------- */
type BtnVariant = "primary" | "secondary" | "ghost" | "gold" | "danger";
const btn: Record<BtnVariant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-2 disabled:bg-line-2 disabled:text-muted",
  secondary: "bg-white text-ink border border-line-2 hover:border-ink disabled:text-muted disabled:border-line",
  ghost: "text-ink hover:bg-sand disabled:text-muted",
  gold: "bg-ink text-paper hover:bg-ink-2 ring-1 ring-gold/60 ring-offset-2 ring-offset-paper disabled:opacity-60",
  danger: "bg-white text-danger border border-danger/30 hover:bg-danger-soft",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg"; loading?: boolean }) {
  const sz = size === "lg" ? "h-14 px-7 text-base" : size === "sm" ? "h-9 px-3.5 text-sm" : "h-12 px-5 text-[15px]";
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cx(
        "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
        sz,
        btn[variant],
        className,
      )}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "gold" | "ok" | "danger" | "dark"; children: ReactNode; className?: string }) {
  const t = {
    neutral: "bg-sand text-ink-2",
    gold: "bg-gold-soft text-gold",
    ok: "bg-ok-soft text-ok",
    danger: "bg-danger-soft text-danger",
    dark: "bg-ink text-paper",
  }[tone];
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", t, className)}>{children}</span>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("shimmer relative overflow-hidden rounded-xl bg-stone", className)} />;
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Abaya Studio AI">
      <span className="grid size-8 place-items-center rounded-lg bg-ink text-paper">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 3c-1.6 0-2.6 1.2-2.6 2.6 0 1 .5 1.7 1 2.1L7 21h10l-3.4-13.3c.5-.4 1-1.1 1-2.1C14.6 4.2 13.6 3 12 3z" />
          <path d="M12 8v13" opacity=".5" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[17px] font-semibold tracking-tight" dir="ltr">Abaya Studio</span>
          <span className="block text-[11px] text-muted">استوديو تصميم العباية</span>
        </span>
      )}
    </Link>
  );
}

/* ---------- Toasts ---------- */
type Toast = { id: number; message: string; tone?: "default" | "ok" | "danger"; action?: { label: string; onClick: () => void } };
const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "animate-fade-in pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lg shadow-black/10",
              t.tone === "ok" ? "bg-ink text-paper" : t.tone === "danger" ? "bg-danger text-white" : "bg-white text-ink ring-1 ring-line",
            )}
          >
            <Icon name={t.tone === "danger" ? "alert" : t.tone === "ok" ? "check" : "info"} className="size-4 shrink-0" />
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button className="font-semibold underline underline-offset-4" onClick={t.action.onClick}>
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ---------- Sheet (bottom on mobile, centered on desktop) ---------- */
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} aria-label="إغلاق" />
      <div
        ref={ref}
        tabIndex={-1}
        className={cx(
          "animate-sheet relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none sm:rounded-3xl sm:p-7",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-2 sm:hidden" />
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="font-display text-xl font-semibold">{title}</h2>}
          <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-sand" aria-label="إغلاق">
            <Icon name="x" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Choice chip used in assistants. */
export function Chip({ active, onClick, children, disabled }: { active?: boolean; onClick?: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cx(
        "num min-h-12 rounded-xl border px-4 text-[15px] transition-all duration-200 active:scale-[0.98]",
        active ? "border-ink bg-ink text-paper" : "border-line-2 bg-white hover:border-ink",
        disabled && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}
