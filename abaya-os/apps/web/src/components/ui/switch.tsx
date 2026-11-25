'use client';
import * as React from 'react';
import * as S from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export function Switch({ className, ...p }: React.ComponentPropsWithoutRef<typeof S.Root>) {
  return (
    <S.Root className={cn('peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-gold data-[state=unchecked]:bg-beige-300 disabled:opacity-50', className)} {...p}>
      <S.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform data-[state=checked]:-translate-x-5 data-[state=unchecked]:translate-x-0 ltr:data-[state=checked]:translate-x-5" />
    </S.Root>
  );
}
