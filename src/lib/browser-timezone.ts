import { resolveKnownZone } from '@/lib/zone-meta'

export function resolveBrowserTimeZone(): string | null {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!timeZone) {
      return null
    }

    return resolveKnownZone(timeZone)
  } catch {
    return null
  }
}
