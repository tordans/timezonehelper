import { resolveKnownZone } from '@/lib/zone-meta'

export const RECENT_ZONES_STORAGE_KEY = 'timingsparks-recent-zones'
export const RECENT_ZONES_CAP = 10

export function rememberRecentZone(zones: string[], zone: string) {
  const known = resolveKnownZone(zone)
  if (!known) {
    return zones
  }

  if (zones[0] === known && !zones.includes(known, 1)) {
    return zones
  }

  return [known, ...zones.filter((entry) => entry !== known)].slice(0, RECENT_ZONES_CAP)
}

export function parseRecentZones(raw: string | null) {
  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    const unique: string[] = []

    for (const entry of parsed) {
      if (typeof entry !== 'string') {
        continue
      }

      const known = resolveKnownZone(entry)
      if (!known || unique.includes(known)) {
        continue
      }

      unique.push(known)
      if (unique.length >= RECENT_ZONES_CAP) {
        break
      }
    }

    return unique
  } catch {
    return []
  }
}
