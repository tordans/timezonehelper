import { describe, expect, test } from 'vitest'
import { buildCalendarExport } from '@/lib/calendar-export'
import { formatMeetingCopy } from '@/lib/meeting-copy'

const MEETING = {
  date: '2026-09-05',
  start: '09:00',
  end: '10:00',
  home: 'Europe/London',
  zones: ['Europe/London', 'America/New_York', 'Asia/Tokyo'],
  hourFormat: '24',
} as const

const GENERATED_AT = Date.UTC(2026, 8, 5, 12, 0, 0)

describe('calendar export', () => {
  test('builds a Google Calendar template URL from UTC instants', () => {
    const exportEvent = buildCalendarExport(MEETING, GENERATED_AT)
    const url = new URL(exportEvent.googleCalendarUrl)

    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render')
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('text')).toBe('London 09:00–10:00 BST')
    expect(url.searchParams.get('dates')).toBe('20260905T080000Z/20260905T090000Z')
    expect(exportEvent.googleCalendarUrl).toContain('dates=20260905T080000Z/20260905T090000Z')
    expect(exportEvent.googleCalendarUrl).not.toContain('dates=20260905T080000Z%2F')
    expect(url.searchParams.get('details')).toBe(formatMeetingCopy(MEETING))
    expect(url.searchParams.has('ctz')).toBe(false)
  })

  test('builds an ICS event with escaped description and UTC times', () => {
    const exportEvent = buildCalendarExport(MEETING, GENERATED_AT)
    const description = [
      'Saturday\\, 5 September 2026',
      'London: 09:00–10:00 BST',
      'New York City: 04:00–05:00 EDT',
      'Tokyo: 17:00–18:00 JST',
    ].join('\\n')

    expect(exportEvent.icsFilename).toBe('meeting-2026-09-05-0900-1000.ics')
    expect(exportEvent.icsText).toContain('BEGIN:VCALENDAR')
    expect(exportEvent.icsText).toContain('PRODID:-//Timing Sparks//EN')
    expect(exportEvent.icsText).toContain('UID:2026-09-05-0900-1000-Europe-London@timingsparks')
    expect(exportEvent.icsText).toContain('DTSTAMP:20260905T120000Z')
    expect(exportEvent.icsText).toContain('DTSTART:20260905T080000Z')
    expect(exportEvent.icsText).toContain('DTEND:20260905T090000Z')
    expect(exportEvent.icsText).toContain('SUMMARY:London 09:00–10:00 BST')
    expect(exportEvent.icsText.replaceAll('\r\n ', '')).toContain(`DESCRIPTION:${description}`)
    expect(exportEvent.icsText.endsWith('\r\n')).toBe(true)

    const encoder = new TextEncoder()
    for (const line of exportEvent.icsText.split('\r\n').filter(Boolean)) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75)
    }
  })
})
