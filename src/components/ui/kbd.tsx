import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

export function Kbd({ className, ...props }: ComponentPropsWithoutRef<'kbd'>) {
  return (
    <kbd
      {...props}
      className={cn(
        'inline-flex cursor-help items-center justify-center rounded-md border border-zinc-950/10 bg-white px-1.5 py-px font-sans text-[0.6875rem]/5 font-semibold text-zinc-950 shadow-xs',
        className,
      )}
    />
  )
}
