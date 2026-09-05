import { describe, expect, test } from 'vitest'
import { routerSearch } from '@/lib/router-search'
import { normalizeSearch } from '@/lib/search'
import { formatMinute, parseMinute, sortZonesByOffset } from '@/lib/time'

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
})
