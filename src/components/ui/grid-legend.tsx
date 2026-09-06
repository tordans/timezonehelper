import { cn } from '@/lib/cn'

export function TodayLineMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block h-3.5 w-0.5 shrink-0 rounded-full bg-fuchsia-600', className)}
    />
  )
}

export function CurrentWeekMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-2.5 shrink-0 rounded-full bg-fuchsia-200', className)}
    />
  )
}
