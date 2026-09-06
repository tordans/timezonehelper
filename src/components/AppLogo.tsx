import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

type AppLogoProps = ComponentPropsWithoutRef<'img'>

export function AppLogo({ className, alt = '', ...props }: AppLogoProps) {
  return (
    <img
      {...props}
      src="/favicon.svg"
      alt={alt}
      width={32}
      height={32}
      className={cn('size-8', className)}
    />
  )
}
