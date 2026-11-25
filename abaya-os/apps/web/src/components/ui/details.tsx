'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Progressive disclosure: secondary fields live behind "More options". */
export function MoreOptions({ label, defaultOpen = false, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-dashed">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground" aria-expanded={open}>
        {label}
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="space-y-4 border-t border-dashed p-4">{children}</div>}
    </div>
  );
}
