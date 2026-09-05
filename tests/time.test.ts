import { describe, expect, test } from 'vitest'
import { routerSearch } from '@/lib/router-search'
import { normalizeSearch } from '@/lib/search'
import {
  addDaysIso,
  addLeadingSign,
  formatDurationMinutes,
  formatMinute,
  minuteOfDayInZone,
  parseMinute,
  sortZonesByOffset,
  zoneDeltaHours,
} from '@/lib/time'

describe('search normalization', () => {
  test('keeps readable URL schema defaults stable', () => {
    const normalized = normalizeSearch({})

    expect(normalized.hourFormat).toBe('mx')
    expect(normalized.sort).toBe('offset')
    expect(normalized.zones.length).toBeGreaterThan(0)
    expect(normalized.home).toBe(normalized.zones[0])
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

  test('formats signed offsets from home', () => {
    expect(addLeadingSign(2)).toBe('+2')
    expect(addLeadingSign(-5)).toBe('−5')
    expect(addLeadingSign(0)).toBe('0')

    const noonUtc = Date.UTC(2026, 8, 5, 12, 0, 0)
    expect(zoneDeltaHours('Europe/London', 'America/New_York', noonUtc)).toBe(-5)
    expect(zoneDeltaHours('Europe/London', 'Europe/London', noonUtc)).toBe(0)
  })
})
