import type { HourFormat } from '@/lib/time'
import {
  formatTimestampForZone,
  parseMinute,
  toTimestampFromHome,
  zoneAbbreviation,
} from '@/lib/time'
import { getZoneMeta } from '@/lib/zone-meta'

export type MeetingCopyInput = {
  date: string
  start: string
  end: string
  home: string
  zones: string[]
  hourFormat: HourFormat
}

export function formatMeetingCopy({
  date,
  start,
  end,
  home,
  zones,
  hourFormat,
}: MeetingCopyInput): string {
  const startTimestamp = toTimestampFromHome(date, home, parseMinute(start))
  const endTimestamp = toTimestampFromHome(date, home, parseMinute(end))
  const lines = [`Meeting · ${date} · ${start}–${end} home (${home})`]

  for (const zone of zones) {
    const meta = getZoneMeta(zone)
    const localStart = formatTimestampForZone(startTimestamp, zone, hourFormat)
    const localEnd = formatTimestampForZone(endTimestamp, zone, hourFormat)
    const abbreviation = zoneAbbreviation(startTimestamp, zone)
    const suffix = abbreviation ? ` ${abbreviation}` : ''
    lines.push(`${meta.city}  ${localStart}–${localEnd}${suffix}`)
  }

  return lines.join('\n')
}
