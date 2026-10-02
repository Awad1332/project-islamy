"use client";

import { useState } from "react";
import { formatSAR, formatSigned, type PriceBreakdown } from "@/lib/engine/pricing";
import { cx, Icon } from "../ui";

export function PriceLines({ price }: { price: PriceBreakdown }) {
  return (
    <dl className="num space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">السعر الأساسي</dt>
        <dd>{formatSAR(price.base)}</dd>
      </div>
      {price.lines.map((l) => (
        <div key={l.optionId} className="animate-fade-in flex justify-between">
          <dt className="text-muted">{l.label}</dt>
          <dd>{formatSigned(l.amount)}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-line pt-2.5 text-base font-semibold">
        <dt>الإجمالي</dt>
        <dd>{formatSAR(price.total)}</dd>
      </div>
      <p className="text-xs text-muted">مدة التنفيذ التقريبية: {price.leadTimeDays} أيام عمل</p>
    </dl>
  );
}

/** Always-visible live price. Tap to expand the breakdown. */
export function PriceBar({ price, className }: { price: PriceBreakdown; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cx("bg-white", className)}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3" aria-expanded={open}>
        <span className="text-sm text-muted">
          الإجمالي
          {price.addons > 0 && <span className="num ms-2 text-xs">({formatSAR(price.base)} {formatSigned(price.addons)})</span>}
        </span>
        <span className="flex items-center gap-2">
          <span key={price.total} className="num animate-fade-in font-display text-xl font-semibold">{formatSAR(price.total)}</span>
          <Icon name="arrowPrev" className={cx("size-4 text-muted transition-transform", open ? "-rotate-90" : "rotate-90")} />
        </span>
      </button>
      {open && (
        <div className="animate-fade-in border-t border-line px-4 py-3">
          <PriceLines price={price} />
        </div>
      )}
    </div>
  );
}
