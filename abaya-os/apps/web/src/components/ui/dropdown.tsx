'use client';
import * as React from 'react';
import * as M from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export const Dropdown = M.Root;
export const DropdownTrigger = M.Trigger;
export function DropdownContent({ children, align = 'end' }: { children: React.ReactNode; align?: 'start' | 'end' }) {
  return (
    <M.Portal>
      <M.Content align={align} sideOffset={6} className="z-50 min-w-[12rem] rounded-lg border bg-popover p-1 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0">
        {children}
      </M.Content>
    </M.Portal>
  );
}
export const DropdownItem = ({ className, ...p }: React.ComponentPropsWithoutRef<typeof M.Item>) => (
  <M.Item className={cn('flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent [&_svg]:size-4', className)} {...p} />
);
export const DropdownSeparator = () => <M.Separator className="my-1 h-px bg-border" />;
export const DropdownLabel = ({ children }: { children: React.ReactNode }) => <M.Label className="px-2 py-1.5 text-xs text-muted-foreground">{children}</M.Label>;
