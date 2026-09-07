import type { MeetingCopyInput } from '@/lib/meeting-copy'
import { formatMeetingCopy } from '@/lib/meeting-copy'
import {
  formatTimestampForZone,
  parseMinute,
  toTimestampFromHome,
  zoneAbbreviation,
} from '@/lib/time'
import { getZoneMeta } from '@/lib/zone-meta'

const ICS_CRLF = '\r\n'
const ICS_LINE_LIMIT = 75

export type CalendarExport = {
  title: string
  description: string
  googleCalendarUrl: string
  icsText: string
  icsFilename: string
}

function formatUtcCompact(timestamp: number) {
  return new Date(timestamp)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

function formatEventTitle({
  date,
  start,
  end,
  home,
  hourFormat,
}: Pick<MeetingCopyInput, 'date' | 'start' | 'end' | 'home' | 'hourFormat'>) {
  const startTimestamp = toTimestampFromHome(date, home, parseMinute(start))
  const endTimestamp = toTimestampFromHome(date, home, parseMinute(end))
  const localStart = formatTimestampForZone(startTimestamp, home, hourFormat)
  const localEnd = formatTimestampForZone(endTimestamp, home, hourFormat)
  const abbreviation = zoneAbbreviation(startTimestamp, home)
  const suffix = abbreviation ? ` ${abbreviation}` : ''

  return `${getZoneMeta(home).city} ${localStart}–${localEnd}${suffix}`
}

function digitsFromMinute(value: string) {
  return value.replace(':', '')
}

function icsFilename(date: string, start: string, end: string) {
  return `meeting-${date}-${digitsFromMinute(start)}-${digitsFromMinute(end)}.ics`
}

function escapeIcsText(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\r\n', '\n')
    .replaceAll('\n', '\\n')
}

/** RFC 5545 §3.1: fold at 75 octets without splitting a UTF-8 sequence. */
function foldIcsLine(line: string) {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= ICS_LINE_LIMIT) {
    return line
  }

  const decoder = new TextDecoder()
  const parts: string[] = []
  let offset = 0

  while (offset < bytes.length) {
    const maxBytes = offset === 0 ? ICS_LINE_LIMIT : ICS_LINE_LIMIT - 1
    let end = Math.min(offset + maxBytes, bytes.length)
    while (end > offset && end < bytes.length && (bytes[end]! & 0xc0) === 0x80) {
      end -= 1
    }

    const chunk = decoder.decode(bytes.subarray(offset, end))
    parts.push(offset === 0 ? chunk : ` ${chunk}`)
    offset = end
  }

  return parts.join(ICS_CRLF)
}

function icsUid(date: string, start: string, end: string, home: string) {
  const zone = home.replaceAll('/', '-')
  return `${date}-${digitsFromMinute(start)}-${digitsFromMinute(end)}-${zone}@timingsparks`
}

function googleCalendarTemplateUrl(
  title: string,
  description: string,
  startUtc: string,
  endUtc: string,
) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
  })

  // Keep a literal `/` in `dates`. URLSearchParams encodes it as `%2F`, which
  // Google Calendar's template parser does not treat as a start/end separator.
  return `https://calendar.google.com/calendar/render?${params.toString()}&dates=${startUtc}/${endUtc}`
}

function icsCalendarText({
  title,
  description,
  startUtc,
  endUtc,
  uid,
  stampUtc,
}: {
  title: string
  description: string
  startUtc: string
  endUtc: string
  uid: string
  stampUtc: string
}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Timing Sparks//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stampUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    foldIcsLine(`SUMMARY:${escapeIcsText(title)}`),
    foldIcsLine(`DESCRIPTION:${escapeIcsText(description)}`),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return `${lines.join(ICS_CRLF)}${ICS_CRLF}`
}

export function buildCalendarExport(
  input: MeetingCopyInput,
  generatedAt: number = Date.now(),
): CalendarExport {
  const startTimestamp = toTimestampFromHome(input.date, input.home, parseMinute(input.start))
  const endTimestamp = toTimestampFromHome(input.date, input.home, parseMinute(input.end))
  const startUtc = formatUtcCompact(startTimestamp)
  const endUtc = formatUtcCompact(endTimestamp)
  const title = formatEventTitle(input)
  const description = formatMeetingCopy(input)

  return {
    title,
    description,
    googleCalendarUrl: googleCalendarTemplateUrl(title, description, startUtc, endUtc),
    icsText: icsCalendarText({
      title,
      description,
      startUtc,
      endUtc,
      uid: icsUid(input.date, input.start, input.end, input.home),
      stampUtc: formatUtcCompact(generatedAt),
    }),
    icsFilename: icsFilename(input.date, input.start, input.end),
  }
}

export function downloadIcsFile(icsText: string, filename: string) {
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 1000)
}
