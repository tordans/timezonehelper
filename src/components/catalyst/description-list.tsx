import clsx from 'clsx'

export function DescriptionList({ className, ...props }: React.ComponentPropsWithoutRef<'dl'>) {
  return (
    <dl
      {...props}
      className={clsx(className, 'grid grid-cols-[auto_1fr] items-baseline gap-x-4 text-sm/6')}
    />
  )
}

export function DescriptionTerm({ className, ...props }: React.ComponentPropsWithoutRef<'dt'>) {
  return (
    <dt
      {...props}
      className={clsx(
        className,
        'col-start-1 border-t border-zinc-950/5 py-1 text-zinc-500 first:border-none',
      )}
    />
  )
}

export function DescriptionDetails({ className, ...props }: React.ComponentPropsWithoutRef<'dd'>) {
  return (
    <dd
      {...props}
      className={clsx(
        className,
        'border-t border-zinc-950/5 py-1 text-zinc-950 nth-2:border-none',
      )}
    />
  )
}
