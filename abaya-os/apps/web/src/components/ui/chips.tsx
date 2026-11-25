'use client';
import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChipOption { value: string; label?: string; swatch?: string }

/** Tap-to-select chips with optional colour swatches and a "custom value" input. */
export function ChipPicker({ options, value, onChange, addLabel, ltr }: { options: ChipOption[]; value: string[]; onChange: (v: string[]) => void; addLabel?: string; ltr?: boolean }) {
  const [custom, setCustom] = useState('');
  const all: ChipOption[] = [...options, ...value.filter((v) => !options.some((o) => o.value === v)).map((v) => ({ value: v }))];
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((o) => {
        const on = value.includes(o.value);
        return (
          <button key={o.value} type="button" onClick={() => toggle(o.value)} dir={ltr ? 'ltr' : undefined} aria-pressed={on}
            className={cn('flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition', on ? 'border-gold bg-gold-100 font-medium text-charcoal shadow-sm' : 'border-border bg-card hover:border-gold-300')}>
            {o.swatch && <span className="size-4 rounded-full border border-black/10" style={{ background: o.swatch }} />}
            {o.label ?? o.value}
            {on && <Check className="size-3.5 text-gold-700" />}
          </button>
        );
      })}
      {addLabel && (
        <form className="flex items-center" onSubmit={(e) => { e.preventDefault(); const v = custom.trim(); if (v && !value.includes(v)) onChange([...value, v]); setCustom(''); }}>
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={addLabel} className="h-11 w-28 rounded-s-full border border-dashed border-border bg-transparent px-3 text-sm outline-none focus:border-gold" />
          <button type="submit" className="flex h-11 items-center rounded-e-full border border-s-0 border-dashed border-border px-3 text-muted-foreground hover:text-gold-700" aria-label={addLabel}><Plus className="size-4" /></button>
        </form>
      )}
    </div>
  );
}
