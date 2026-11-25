import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      default: 'border-transparent bg-charcoal text-ivory',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      gold: 'border-gold-300 bg-gold-100 text-gold-700',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      warning: 'border-amber-200 bg-amber-50 text-amber-800',
      danger: 'border-red-200 bg-red-50 text-red-800',
      outline: 'text-foreground',
    },
  },
  defaultVariants: { variant: 'secondary' },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
