import { TZDate, tzOffset } from '@date-fns/tz'
import { getZoneMeta, zoneUsesHour12 } from '@/lib/zone-meta'

export type HourFormat = '12' | '24' | 'mx'

const MINUTES_PER_DAY = 24 * 60
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function parseMinute(value: string): number {
  const [hText, mText] = value.split(':')
  const hour = Number.parseInt(hText ?? '', 10)
  const minute = Number.parseInt(mText ?? '', 10)

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 9 * 60
  }

  return clamp(hour * 60 + minute, 0, MINUTES_PER_DAY - 5)
}

export function formatMinute(value: number): string {
  const safe = clamp(Math.floor(value), 0, MINUTES_PER_DAY - 1)
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60
  const hh = hours.toString().padStart(2, '0')
  const mm = minutes.toString().padStart(2, '0')
  return `${hh}:${mm}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

export function toTimestampFromHome(
  dateIso: string,
  homeZone: string,
  minuteOfDay: number,
): number {
  const [yearText, monthText, dayText] = dateIso.split('-')
  const year = Number.parseInt(yearText ?? '', 10)
  const month = Number.parseInt(monthText ?? '', 10)
  const day = Number.parseInt(dayText ?? '', 10)
  const clampedMinute = clamp(Math.floor(minuteOfDay), 0, MINUTES_PER_DAY - 1)
  const hour = Math.floor(clampedMinute / 60)
  const minute = clampedMinute % 60

  const zonedDate = TZDate.tz(homeZone, year, month - 1, day, hour, minute, 0, 0)
  return zonedDate.getTime()
}

export function formatTimestampForZone(
  timestamp: number,
  zone: string,
  hourFormat: HourFormat,
): string {
  const hour12 = hourFormat === '24' ? false : hourFormat === '12' ? true : zoneUsesHour12(zone)

  return new Intl.DateTimeFormat(hour12 ? 'en-US' : 'en-GB', {
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12,
    timeZone: zone,
  }).format(new Date(timestamp))
}

export function isWeekendInZone(timestamp: number, zone: string): boolean {
  const zoned = new TZDate(timestamp, zone)
  const day = zoned.getDay()
  return day === 0 || day === 6
}

export function zoneDeltaHours(baseZone: string, compareZone: string, timestamp: number): number {
  const baseOffset = tzOffset(baseZone, new Date(timestamp))
  const compareOffset = tzOffset(compareZone, new Date(timestamp))
  return (compareOffset - baseOffset) / 60
}

export function addLeadingSign(value: number): string {
  if (value > 0) {
    return `+${value}`
  }

  if (value < 0) {
    return `−${Math.abs(value)}`
  }

  return '0'
}

export function zoneAbbreviation(timestamp: number, zone: string): string {
  for (const locale of ['en-US', 'en-GB']) {
    const parts = new Intl.DateTimeFormat(locale, {
      timeZone: zone,
      timeZoneName: 'short',
    }).formatToParts(new Date(timestamp))
    const name = parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
    if (name && !/^(GMT|UTC)/i.test(name)) {
      return name
    }
  }

  return getZoneMeta(zone).abbreviation
}

export function minuteOfDayInZone(timestamp: number, zone: string): number {
  const zoned = new TZDate(timestamp, zone)
  return zoned.getHours() * 60 + zoned.getMinutes()
}

export function formatDurationMinutes(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes))
  const hours = Math.floor(safe / 60)
  const remainingMinutes = safe % 60

  if (hours === 0) {
    return `${remainingMinutes}m`
  }

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

function formatIsoDateInZone(date: Date, zone: string): string {
  const year = new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: zone }).format(date)
  const month = new Intl.DateTimeFormat('en-CA', { month: '2-digit', timeZone: zone }).format(date)
  const day = new Intl.DateTimeFormat('en-CA', { day: '2-digit', timeZone: zone }).format(date)
  return `${year}-${month}-${day}`
}

export function addDaysIso(dateIso: string, zone: string, delta: number): string {
  const noon = toTimestampFromHome(dateIso, zone, 12 * 60)
  return formatIsoDateInZone(new Date(noon + delta * MS_PER_DAY), zone)
}

export function sortZonesByOffset(zones: string[], homeZone: string, dateIso: string): string[] {
  const uniqueZones = Array.from(new Set(zones))
  const sampleTimestamp = toTimestampFromHome(dateIso, homeZone, 12 * 60)

  const withoutHome = uniqueZones.filter((zone) => zone !== homeZone)
  withoutHome.sort((left, right) => {
    const leftOffset = zoneDeltaHours(homeZone, left, sampleTimestamp)
    const rightOffset = zoneDeltaHours(homeZone, right, sampleTimestamp)

    if (leftOffset === rightOffset) {
      return left.localeCompare(right)
    }

    return leftOffset - rightOffset
  })

  return [homeZone, ...withoutHome]
}

export function todayInZone(zone: string): string {
  return formatIsoDateInZone(new Date(), zone)
}
