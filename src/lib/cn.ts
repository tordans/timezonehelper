import { twJoin, twMerge } from 'tailwind-merge'

export function cn(...classLists: Parameters<typeof twJoin>): string {
  return twMerge(twJoin(...classLists))
}
