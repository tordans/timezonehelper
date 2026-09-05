import { TZDate, tzOffset } from '@date-fns/tz'

export type HourFormat = '12' | '24' | 'mx'

const MINUTES_PER_DAY = 24 * 60

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

function zoneDeltaHours(baseZone: string, compareZone: string, timestamp: number): number {
  const baseOffset = tzOffset(baseZone, new Date(timestamp))
  const compareOffset = tzOffset(compareZone, new Date(timestamp))
  return (compareOffset - baseOffset) / 60
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
  const now = new Date()
  const year = new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: zone }).format(now)
  const month = new Intl.DateTimeFormat('en-CA', { month: '2-digit', timeZone: zone }).format(now)
  const day = new Intl.DateTimeFormat('en-CA', { day: '2-digit', timeZone: zone }).format(now)
  return `${year}-${month}-${day}`
}
