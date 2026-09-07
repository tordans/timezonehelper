import { tzOffset } from '@date-fns/tz'
import { formatDistanceStrict } from 'date-fns'
import { dateFnsLocaleForCountry } from '@/lib/time'
import { getZoneMeta } from '@/lib/zone-meta'

export const DST_WARNING_WINDOW_DAYS = 28

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function nextOffsetChange(zone: string, from: number, until: number): number | null {
  if (until <= from) {
    return null
  }

  const startOffset = tzOffset(zone, new Date(from))
  let previous = from

  for (let sample = from + MS_PER_DAY; sample < until; sample += MS_PER_DAY) {
    if (tzOffset(zone, new Date(sample)) !== startOffset) {
      return findTransitionInstant(zone, previous, sample, startOffset)
    }
    previous = sample
  }

  if (tzOffset(zone, new Date(until)) !== startOffset) {
    return findTransitionInstant(zone, previous, until, startOffset)
  }

  return null
}

export function upcomingDstChanges(
  zones: string[],
  now: number,
): Array<{ zone: string; at: number }> {
  const until = now + DST_WARNING_WINDOW_DAYS * MS_PER_DAY
  const changes: Array<{ zone: string; at: number }> = []

  for (const zone of zones) {
    const at = nextOffsetChange(zone, now, until)
    if (at !== null) {
      changes.push({ zone, at })
    }
  }

  return changes
}

export function formatDstRelativeLabel(at: number, now: number, homeZone: string): string {
  const locale = dateFnsLocaleForCountry(getZoneMeta(homeZone).countryCode)
  return formatDistanceStrict(at, now, { addSuffix: true, locale })
}

export function formatDstWarningLines(
  changes: Array<{ zone: string; at: number }>,
  now: number,
  homeZone: string,
): string {
  return changes
    .map((change) => {
      const relative = formatDstRelativeLabel(change.at, now, homeZone)
      return `${getZoneMeta(change.zone).city}: ${relative}`
    })
    .join('\n')
}

function findTransitionInstant(zone: string, low: number, high: number, startOffset: number) {
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2)
    if (tzOffset(zone, new Date(mid)) === startOffset) {
      low = mid
    } else {
      high = mid
    }
  }

  return high
}
