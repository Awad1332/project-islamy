'use client';
import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ className, children, title, description, wide }: { className?: string; children: React.ReactNode; title: string; description?: string; wide?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-charcoal/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <D.Content className={cn('fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-6 shadow-xl data-[state=open]:animate-in data-[state=open]:zoom-in-95', wide ? 'max-w-3xl' : 'max-w-lg', className)}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <D.Title className="text-lg font-semibold">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-sm text-muted-foreground">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close className="rounded-md p-1 text-muted-foreground hover:bg-accent" aria-label="close"><X className="size-4" /></D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}
