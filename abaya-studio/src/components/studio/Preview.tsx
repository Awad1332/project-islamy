"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { RenderInput, RenderView } from "@/lib/render/abaya";
import { AbayaArt } from "./Art";
import { cx, Icon } from "../ui";

type Focus = "full" | "upper" | "neck" | "hem";

const FOCUS: Record<Focus, { scale: number; origin: string }> = {
  full: { scale: 1, origin: "50% 50%" },
  upper: { scale: 1.55, origin: "50% 30%" },
  neck: { scale: 2.3, origin: "50% 18%" },
  hem: { scale: 1.45, origin: "50% 100%" },
};

export function Preview({
  input,
  view,
  onViewChange,
  focus = "full",
  onReset,
  overlay,
  imageUrl,
  compact,
  className,
}: {
  input: RenderInput;
  view: RenderView;
  onViewChange: (v: RenderView) => void;
  focus?: Focus;
  onReset?: () => void;
  overlay?: ReactNode;
  /** When set, shows this image (e.g. AI result) instead of the live render. */
  imageUrl?: string;
  compact?: boolean;
  className?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [autoFocus, setAutoFocus] = useState<Focus>(focus);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [tick, setTick] = useState(0);

  // Follow the step's focus until the customer zooms manually.
  useEffect(() => {
    setAutoFocus(focus);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [focus]);

  // Crossfade on every change of the design.
  const key = JSON.stringify(input) + view;
  useEffect(() => setTick((t) => t + 1), [key]);

  const manual = zoom !== 1;
  const f = FOCUS[manual ? "full" : autoFocus];
  const scale = manual ? zoom : f.scale;

  const onPointerDown = (e: React.PointerEvent) => {
    if (!manual) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const lim = 160 * (zoom - 1);
    setPan({
      x: Math.max(-lim, Math.min(lim, drag.current.px + (e.clientX - drag.current.x))),
      y: Math.max(-lim * 2, Math.min(lim * 2, drag.current.py + (e.clientY - drag.current.y))),
    });
  };
  const end = () => (drag.current = null);

  const zoomBy = (d: number) => {
    const z = Math.max(1, Math.min(3, +(zoom + d).toFixed(2)));
    setZoom(z);
    if (z === 1) setPan({ x: 0, y: 0 });
  };

  return (
    <div className={cx("relative isolate overflow-hidden bg-[#f3eee7]", className)}>
      <div
        className={cx("absolute inset-0 touch-none select-none", manual ? "cursor-grab active:cursor-grabbing" : "")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onDoubleClick={() => (manual ? (setZoom(1), setPan({ x: 0, y: 0 })) : setZoom(2))}
      >
        <div
          className="h-full w-full transition-transform duration-700 ease-[var(--ease-lux)]"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: f.origin }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={imageUrl} src={imageUrl} alt="تصور العباية" className="animate-crossfade h-full w-full object-contain" draggable={false} />
          ) : (
            <AbayaArt key={tick} input={input} view={view} mode="studio" idPrefix="pv" className="animate-crossfade h-full w-full" title="معاينة العباية" />
          )}
        </div>
      </div>

      {overlay}

      {/* Controls */}
      <div className={cx("absolute inset-x-3 flex items-center justify-between gap-2", compact ? "bottom-2" : "bottom-3")}>
        <div className="flex rounded-full bg-white/85 p-1 text-sm shadow-sm ring-1 ring-black/5 backdrop-blur">
          {(["front", "back"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={cx("h-8 rounded-full px-3.5 transition-colors", view === v ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}
              aria-pressed={view === v}
            >
              {v === "front" ? "أمام" : "خلف"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/85 p-1 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <button className="grid size-8 place-items-center rounded-full hover:bg-sand disabled:opacity-30" onClick={() => zoomBy(0.5)} disabled={zoom >= 3} aria-label="تكبير">
            <Icon name="zoomIn" className="size-[18px]" />
          </button>
          <button className="grid size-8 place-items-center rounded-full hover:bg-sand disabled:opacity-30" onClick={() => zoomBy(-0.5)} disabled={zoom <= 1} aria-label="تصغير">
            <Icon name="zoomOut" className="size-[18px]" />
          </button>
          {onReset && (
            <button className="grid size-8 place-items-center rounded-full hover:bg-sand" onClick={onReset} aria-label="إعادة التصميم" title="إعادة التصميم">
              <Icon name="refresh" className="size-[18px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Elegant "generating" overlay. */
export function GeneratingOverlay() {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-paper/70 backdrop-blur-[3px]" role="status" aria-live="polite">
      <div className="flex flex-col items-center px-8 text-center">
        <div className="relative mb-6 h-40 w-24">
          <svg viewBox="0 0 100 170" className="animate-breathe h-full w-full text-ink">
            <path d="M50 6c-8 0-13 6-13 13 0 5 2 9 5 11L22 160h56L58 30c3-2 5-6 5-11 0-7-5-13-13-13z" fill="currentColor" opacity=".9" />
          </svg>
          {[["-8%", "20%", "0s"], ["92%", "35%", ".6s"], ["10%", "78%", "1.1s"], ["80%", "88%", "1.6s"]].map(([l, t, d], i) => (
            <span key={i} className="absolute text-gold" style={{ left: l, top: t, animation: `sparkle 2.2s ${d} ease-in-out infinite` }}>
              <Icon name="sparkle" className="size-4" />
            </span>
          ))}
        </div>
        <p className="font-display text-xl font-semibold">جاري تصميم عبايتك...</p>
        <p className="mt-1.5 text-sm text-muted">نجهز لك تصورًا قريبًا من اختياراتك.</p>
        <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-line">
          <div className="shimmer relative h-full w-full bg-gold/40" />
        </div>
      </div>
    </div>
  );
}
