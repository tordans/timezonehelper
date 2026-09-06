import { beforeEach, describe, expect, test } from 'vitest'
import { routerSearch } from '@/lib/router-search'
import { IMPLICIT_RANGE_END, IMPLICIT_RANGE_START, normalizeSearch } from '@/lib/search'
import {
  addDaysIso,
  addLeadingSign,
  formatDurationMinutes,
  formatHourCellTooltip,
  formatMinute,
  formatSelectedRangeHeading,
  formatWeekday,
  isoWeekMonday,
  isCurrentWeekInZone,
  minuteOfDayInZone,
  parseMinute,
  sortZonesByOffset,
  toTimestampFromHome,
  zoneDeltaHours,
} from '@/lib/time'
import { markTimeRangeCommitted, resetTimeRangeCommitForTests } from '@/state/ui-store'

describe('search normalization', () => {
  test('keeps readable URL schema defaults stable', () => {
    const normalized = normalizeSearch({})

    expect(normalized.hourFormat).toBe('mx')
    expect(normalized.sort).toBe('offset')
    expect(normalized.zones.length).toBeGreaterThan(0)
    expect(normalized.home).toBe(normalized.zones[0])
    expect(normalized.start).toBe(IMPLICIT_RANGE_START)
    expect(normalized.end).toBe(IMPLICIT_RANGE_END)
  })

  test('normalizes malformed ranges', () => {
    const normalized = normalizeSearch({
      zones: 'UTC,Europe/London',
      home: 'UTC',
      start: '18:00',
      end: '05:00',
    })

    expect(parseMinute(normalized.end)).toBeGreaterThan(parseMinute(normalized.start))
  })

  test('keeps comma-separated zones as an array', () => {
    const normalized = normalizeSearch({
      zones: 'America/New_York,Europe/London',
    })

    expect(normalized.zones).toContain('America/New_York')
    expect(normalized.zones).toContain('Europe/London')
  })
})

describe('router search serialization', () => {
  beforeEach(() => {
    resetTimeRangeCommitForTests()
  })

  test('keeps comma-separated zones readable', () => {
    const encoded = routerSearch.stringify({
      zones: ['America/New_York', 'Europe/London'],
      hourFormat: 'mx',
    })

    expect(encoded).toContain('zones=America/New_York,Europe/London')
    expect(encoded).not.toContain('%2C')
    expect(encoded).not.toContain('%5B')
  })

  test('round-trips pretty JSON objects', () => {
    const encoded = routerSearch.stringify({ filter: { users: [1, 2] } })
    expect(encoded).toContain('filter={"users":[1,2]}')

    const parsed = routerSearch.parse(encoded.startsWith('?') ? encoded : `?${encoded}`)
    expect(parsed).toEqual({ filter: { users: [1, 2] } })
  })

  test('omits start and end until the user selects a range', () => {
    const encoded = routerSearch.stringify({
      zones: ['America/New_York'],
      start: IMPLICIT_RANGE_START,
      end: IMPLICIT_RANGE_END,
    })

    expect(encoded).not.toContain('start=')
    expect(encoded).not.toContain('end=')
  })

  test('writes start and end after the range is committed', () => {
    markTimeRangeCommitted()

    const encoded = routerSearch.stringify({
      zones: ['America/New_York'],
      start: '14:00',
      end: '15:30',
    })

    expect(encoded).toContain('start=14:00')
    expect(encoded).toContain('end=15:30')
  })

  test('keeps start and end from a shared URL', () => {
    const parsed = routerSearch.parse('?start=14:00&end=16:00')
    expect(parsed).toEqual({ start: '14:00', end: '16:00' })

    const encoded = routerSearch.stringify({
      start: '14:00',
      end: '16:00',
    })
    expect(encoded).toContain('start=14:00')
    expect(encoded).toContain('end=16:00')
  })
})

describe('time helpers', () => {
  test('formats and parses minute values', () => {
    expect(formatMinute(9 * 60 + 30)).toBe('09:30')
    expect(parseMinute('09:30')).toBe(9 * 60 + 30)
  })

  test('sorts zones with home first', () => {
    const sorted = sortZonesByOffset(
      ['Asia/Tokyo', 'Europe/London', 'America/New_York'],
      'Europe/London',
      '2026-04-28',
    )

    expect(sorted[0]).toBe('Europe/London')
  })

  test('formats duration from a minute span', () => {
    expect(formatDurationMinutes(90)).toBe('1h 30m')
    expect(formatDurationMinutes(60)).toBe('1h')
    expect(formatDurationMinutes(15)).toBe('15m')
    expect(formatDurationMinutes(0)).toBe('0m')
  })

  test('adds calendar days in a zone from a noon timestamp', () => {
    expect(addDaysIso('2026-09-05', 'Europe/London', 1)).toBe('2026-09-06')
    expect(addDaysIso('2026-09-05', 'Europe/London', -1)).toBe('2026-09-04')
    expect(addDaysIso('2026-03-01', 'UTC', -1)).toBe('2026-02-28')
  })

  test('reads minute of day in a zone from a known UTC instant', () => {
    const timestamp = Date.UTC(2026, 8, 5, 12, 30, 0)

    expect(minuteOfDayInZone(timestamp, 'UTC')).toBe(12 * 60 + 30)
    expect(minuteOfDayInZone(timestamp, 'Europe/London')).toBe(13 * 60 + 30)
    expect(minuteOfDayInZone(timestamp, 'America/New_York')).toBe(8 * 60 + 30)
  })

  test('formats a short weekday for a calendar date', () => {
    expect(formatWeekday('2026-09-06', 'short', 'en-US')).toBe('Sun')
    expect(formatWeekday('2026-09-06', 'long', 'en-US')).toBe('Sunday')
    expect(formatWeekday('2026-09-06', 'short', 'de-DE')).toBe('So')
    expect(formatWeekday('not-a-date', 'short', 'en-US')).toBe('')
  })

  test('groups calendar dates into ISO weeks starting Monday', () => {
    expect(isoWeekMonday('2026-09-06')).toBe('2026-08-31')
    expect(isoWeekMonday('2026-08-31')).toBe('2026-08-31')
    expect(isoWeekMonday('2026-09-07')).toBe('2026-09-07')
    expect(isoWeekMonday('not-a-date')).toBe('')
  })

  test('detects whether a zoned instant falls in the current ISO week', () => {
    const now = new Date('2026-09-06T12:00:00Z')

    expect(isCurrentWeekInZone(Date.UTC(2026, 8, 6, 12), 'UTC', now)).toBe(true)
    expect(isCurrentWeekInZone(Date.UTC(2026, 7, 30, 12), 'UTC', now)).toBe(false)
    expect(isCurrentWeekInZone(Date.UTC(2026, 8, 7, 12), 'UTC', now)).toBe(false)
  })

  test('formats signed offsets from home', () => {
    expect(addLeadingSign(2)).toBe('+2')
    expect(addLeadingSign(-5)).toBe('−5')
    expect(addLeadingSign(0)).toBe('0')

    const noonUtc = Date.UTC(2026, 8, 5, 12, 0, 0)
    expect(zoneDeltaHours('Europe/London', 'America/New_York', noonUtc)).toBe(-5)
    expect(zoneDeltaHours('Europe/London', 'Europe/London', noonUtc)).toBe(0)
  })

  test('formats a long home-zone hour tooltip with weekday, date, and ISO week', () => {
    const berlinSundayEvening = toTimestampFromHome('2026-09-06', 'Europe/Berlin', 21 * 60)
    const tooltip = formatHourCellTooltip(berlinSundayEvening, 'Europe/Berlin')

    expect(tooltip.headline).toBe('Sonntag 6.9.2026')
    expect(tooltip.detail).toBe('September, KW 36')
  })

  test('formats a selected-range heading with short home date, hours, duration, and ISO week', () => {
    const start = toTimestampFromHome('2026-09-06', 'Europe/Berlin', 7 * 60)
    const end = toTimestampFromHome('2026-09-06', 'Europe/Berlin', 10 * 60)
    const heading = formatSelectedRangeHeading(start, end, 'Europe/Berlin', '24', '3h')

    expect(heading.title).toBe('6.9. · 7–10')
    expect(heading.meta).toBe('3h · KW 36 · September 2026')
  })

  test('shows minutes on both range times when either side is off the hour', () => {
    const start = toTimestampFromHome('2026-09-06', 'Europe/Berlin', 6 * 60 + 45)
    const end = toTimestampFromHome('2026-09-06', 'Europe/Berlin', 10 * 60)
    const heading = formatSelectedRangeHeading(start, end, 'Europe/Berlin', '24', '3h 15m')

    expect(heading.title).toBe('6.9. · 6:45–10:00')
  })
})
