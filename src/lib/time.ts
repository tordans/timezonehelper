import { TZDate, tzOffset } from '@date-fns/tz'
import { format, getISOWeek, type Locale } from 'date-fns'
import { de } from 'date-fns/locale/de'
import { enGB } from 'date-fns/locale/en-GB'
import { enUS } from 'date-fns/locale/en-US'
import { fr } from 'date-fns/locale/fr'
import { ja } from 'date-fns/locale/ja'
import { getZoneMeta, zoneUsesHour12 } from '@/lib/zone-meta'

export type HourFormat = '12' | '24' | 'mx'

const MINUTES_PER_DAY = 24 * 60
const MS_PER_DAY = 24 * 60 * 60 * 1000

export function resolveHour12(hourFormat: HourFormat, zone: string) {
  switch (hourFormat) {
    case '12':
      return true
    case '24':
      return false
    case 'mx':
      return zoneUsesHour12(zone)
  }
}

export function parseMinute(value: string) {
  const [hText, mText] = value.split(':')
  const hour = Number.parseInt(hText ?? '', 10)
  const minute = Number.parseInt(mText ?? '', 10)

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 9 * 60
  }

  return clamp(hour * 60 + minute, 0, MINUTES_PER_DAY - 5)
}

export function formatMinute(value: number) {
  const safe = clamp(Math.floor(value), 0, MINUTES_PER_DAY - 1)
  const hours = Math.floor(safe / 60)
  const minutes = safe % 60
  const hh = hours.toString().padStart(2, '0')
  const mm = minutes.toString().padStart(2, '0')
  return `${hh}:${mm}`
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function roundToStep(value: number, step: number) {
  return Math.round(value / step) * step
}

export function toTimestampFromHome(dateIso: string, homeZone: string, minuteOfDay: number) {
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

export function formatTimestampForZone(timestamp: number, zone: string, hourFormat: HourFormat) {
  const hour12 = resolveHour12(hourFormat, zone)

  return new Intl.DateTimeFormat(hour12 ? 'en-US' : 'en-GB', {
    hour: hour12 ? 'numeric' : '2-digit',
    minute: '2-digit',
    hour12,
    timeZone: zone,
  }).format(new Date(timestamp))
}

export function isWeekendInZone(timestamp: number, zone: string) {
  const zoned = new TZDate(timestamp, zone)
  const day = zoned.getDay()
  return day === 0 || day === 6
}

export function zoneDeltaHours(baseZone: string, compareZone: string, timestamp: number) {
  const baseOffset = tzOffset(baseZone, new Date(timestamp))
  const compareOffset = tzOffset(compareZone, new Date(timestamp))
  return (compareOffset - baseOffset) / 60
}

export function addLeadingSign(value: number) {
  if (value > 0) {
    return `+${value}`
  }

  if (value < 0) {
    return `−${Math.abs(value)}`
  }

  return '0'
}

export function zoneAbbreviation(timestamp: number, zone: string) {
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

export function minuteOfDayInZone(timestamp: number, zone: string) {
  const zoned = new TZDate(timestamp, zone)
  return zoned.getHours() * 60 + zoned.getMinutes()
}

export function formatDurationMinutes(minutes: number) {
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

function formatIsoDateInZone(date: Date, zone: string) {
  const year = new Intl.DateTimeFormat('en-CA', { year: 'numeric', timeZone: zone }).format(date)
  const month = new Intl.DateTimeFormat('en-CA', { month: '2-digit', timeZone: zone }).format(date)
  const day = new Intl.DateTimeFormat('en-CA', { day: '2-digit', timeZone: zone }).format(date)
  return `${year}-${month}-${day}`
}

export function addDaysIso(dateIso: string, zone: string, delta: number) {
  const noon = toTimestampFromHome(dateIso, zone, 12 * 60)
  return formatIsoDateInZone(new Date(noon + delta * MS_PER_DAY), zone)
}

export function sortZonesByOffset(zones: string[], homeZone: string, dateIso: string) {
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

export function todayInZone(zone: string) {
  return formatIsoDateInZone(new Date(), zone)
}

export function isoWeekMonday(dateIso: string) {
  const [yearText, monthText, dayText] = dateIso.split('-')
  const year = Number.parseInt(yearText ?? '', 10)
  const month = Number.parseInt(monthText ?? '', 10)
  const day = Number.parseInt(dayText ?? '', 10)

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return ''
  }

  const utcNoon = Date.UTC(year, month - 1, day, 12)
  const weekday = new Date(utcNoon).getUTCDay()
  const isoDay = weekday === 0 ? 7 : weekday
  const mondayNoon = utcNoon - (isoDay - 1) * MS_PER_DAY
  const monday = new Date(mondayNoon)
  const mondayYear = monday.getUTCFullYear()
  const mondayMonth = String(monday.getUTCMonth() + 1).padStart(2, '0')
  const mondayDay = String(monday.getUTCDate()).padStart(2, '0')
  return `${mondayYear}-${mondayMonth}-${mondayDay}`
}

export function isCurrentWeekInZone(timestamp: number, zone: string, now: Date = new Date()) {
  const cellDate = formatIsoDateInZone(new Date(timestamp), zone)
  const today = formatIsoDateInZone(now, zone)
  return isoWeekMonday(cellDate) === isoWeekMonday(today)
}

function dateFnsLocaleForCountry(countryCode: string) {
  switch (countryCode) {
    case 'AT':
    case 'CH':
    case 'DE':
    case 'LI':
      return de
    case 'GB':
    case 'IE':
      return enGB
    case 'FR':
      return fr
    case 'JP':
      return ja
    default:
      return enUS
  }
}

export function formatHourCellTooltip(
  timestamp: number,
  homeZone: string,
  locale: Locale = dateFnsLocaleForCountry(getZoneMeta(homeZone).countryCode),
) {
  const zoned = new TZDate(timestamp, homeZone)
  const weekPrefix = locale.code?.startsWith('de') ? 'KW' : 'Wk'

  return {
    headline: format(zoned, 'EEEE d.M.yyyy', { locale }),
    detail: `${format(zoned, 'MMMM', { locale })}, ${weekPrefix} ${getISOWeek(zoned)}`,
  }
}

function shortDateWithoutYear(zoned: TZDate, locale: Locale) {
  const code = locale.code ?? 'en-US'

  if (code.startsWith('de')) {
    return format(zoned, 'd.M.', { locale })
  }

  if (code === 'en-GB' || code.startsWith('fr')) {
    return format(zoned, 'd/M', { locale })
  }

  return format(zoned, 'M/d', { locale })
}

function shortHourInZone(zoned: TZDate, hour12: boolean, withMinutes: boolean) {
  if (hour12) {
    return withMinutes ? format(zoned, 'h:mm') : format(zoned, 'h')
  }

  return withMinutes ? format(zoned, 'H:mm') : format(zoned, 'H')
}

function shortRangeTime(
  startTimestamp: number,
  endTimestamp: number,
  homeZone: string,
  hourFormat: HourFormat,
) {
  const start = new TZDate(startTimestamp, homeZone)
  const end = new TZDate(endTimestamp, homeZone)
  const hour12 = resolveHour12(hourFormat, homeZone)
  const withMinutes = start.getMinutes() !== 0 || end.getMinutes() !== 0
  const startHour = shortHourInZone(start, hour12, withMinutes)
  const endHour = shortHourInZone(end, hour12, withMinutes)

  if (!hour12) {
    return `${startHour}–${endHour}`
  }

  const startPeriod = format(start, 'a')
  const endPeriod = format(end, 'a')

  if (startPeriod === endPeriod) {
    return `${startHour}–${endHour} ${startPeriod}`
  }

  return `${startHour} ${startPeriod}–${endHour} ${endPeriod}`
}

export function formatSelectedRangeHeading(
  startTimestamp: number,
  endTimestamp: number,
  homeZone: string,
  hourFormat: HourFormat,
  durationLabel: string,
) {
  const locale = dateFnsLocaleForCountry(getZoneMeta(homeZone).countryCode)
  const start = new TZDate(startTimestamp, homeZone)
  const weekPrefix = locale.code?.startsWith('de') ? 'KW' : 'Wk'
  const time = shortRangeTime(startTimestamp, endTimestamp, homeZone, hourFormat)

  return {
    title: `${shortDateWithoutYear(start, locale)} · ${time}`,
    meta: `${durationLabel} · ${weekPrefix} ${getISOWeek(start)} · ${format(start, 'MMMM yyyy', { locale })}`,
  }
}

export function formatCalendarDateLong(dateIso: string, homeZone: string) {
  const timestamp = toTimestampFromHome(dateIso, homeZone, 12 * 60)
  const locale = dateFnsLocaleForCountry(getZoneMeta(homeZone).countryCode)
  return format(new TZDate(timestamp, homeZone), 'PPPP', { locale })
}

export function formatWeekday(dateIso: string, style: 'short' | 'long' = 'short', locale?: string) {
  const [yearText, monthText, dayText] = dateIso.split('-')
  const year = Number.parseInt(yearText ?? '', 10)
  const month = Number.parseInt(monthText ?? '', 10)
  const day = Number.parseInt(dayText ?? '', 10)

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return ''
  }

  const formatted = new Intl.DateTimeFormat(locale, {
    weekday: style,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))

  return style === 'short' ? formatted.replace(/\.+$/u, '') : formatted
}
