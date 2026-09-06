import * as Headless from '@headlessui/react'
import { TouchTarget } from '@/components/catalyst/button'
import { cn } from '@/lib/cn'

type ButtonGroupOption<T extends string> = {
  value: T
  label: string
}

type ButtonGroupProps<T extends string> = {
  value: T
  options: readonly ButtonGroupOption<T>[]
  onChange: (value: T) => void
  'aria-label'?: string
  className?: string
}

export function buttonGroupFrameClassName(className?: string) {
  return cn('isolate inline-flex rounded-lg shadow-xs', className)
}

export function buttonGroupSegmentClassName({
  isFirst,
  isLast,
}: {
  isFirst: boolean
  isLast: boolean
}) {
  return cn(
    'relative inline-flex min-h-9 cursor-pointer items-center justify-center bg-white px-3 py-[calc(--spacing(2.5)-1px)] text-sm/6 font-semibold text-zinc-950 inset-ring-1 inset-ring-zinc-300 data-disabled:cursor-default sm:py-[calc(--spacing(1.5)-1px)]',
    'data-hover:bg-zinc-50',
    'data-focus:z-10 data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500',
    isFirst && 'rounded-l-lg',
    isLast && 'rounded-r-lg',
    !isFirst && '-ml-px',
  )
}

export function ButtonGroup<T extends string>({
  value,
  options,
  onChange,
  className,
  'aria-label': ariaLabel,
}: ButtonGroupProps<T>) {
  return (
    <Headless.RadioGroup
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      data-slot="control"
      className={buttonGroupFrameClassName(className)}
    >
      {options.map((option, index) => {
        const isFirst = index === 0
        const isLast = index === options.length - 1

        return (
          <Headless.Radio
            key={option.value}
            value={option.value}
            className={cn(
              buttonGroupSegmentClassName({ isFirst, isLast }),
              'data-checked:z-10 data-checked:bg-indigo-600 data-checked:text-white data-checked:inset-ring-indigo-600',
              'data-checked:data-hover:bg-indigo-500',
            )}
          >
            <TouchTarget>{option.label}</TouchTarget>
          </Headless.Radio>
        )
      })}
    </Headless.RadioGroup>
  )
}
