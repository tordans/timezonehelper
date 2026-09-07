import { describe, expect, test } from 'vitest'
import {
  DST_WARNING_WINDOW_DAYS,
  formatDstWarningLines,
  nextOffsetChange,
  upcomingDstChanges,
} from '@/lib/dst'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function untilFrom(now: number) {
  return now + DST_WARNING_WINDOW_DAYS * MS_PER_DAY
}

function expectUtcDate(at: number, year: number, monthIndex: number, day: number) {
  const date = new Date(at)
  expect(date.getUTCFullYear()).toBe(year)
  expect(date.getUTCMonth()).toBe(monthIndex)
  expect(date.getUTCDate()).toBe(day)
}

describe('nextOffsetChange', () => {
  test('finds Berlin CEST to CET on 25 Oct 2026', () => {
    const from = Date.UTC(2026, 9, 1)
    const at = nextOffsetChange('Europe/Berlin', from, untilFrom(from))

    expect(at).not.toBeNull()
    expectUtcDate(at!, 2026, 9, 25)
    expect(at!).toBeGreaterThanOrEqual(Date.UTC(2026, 9, 25, 0, 50))
    expect(at!).toBeLessThanOrEqual(Date.UTC(2026, 9, 25, 1, 10))
  })

  test('finds New York EDT to EST on 1 Nov 2026', () => {
    const from = Date.UTC(2026, 9, 10)
    const at = nextOffsetChange('America/New_York', from, untilFrom(from))

    expect(at).not.toBeNull()
    expectUtcDate(at!, 2026, 10, 1)
    expect(at!).toBeGreaterThanOrEqual(Date.UTC(2026, 10, 1, 5, 50))
    expect(at!).toBeLessThanOrEqual(Date.UTC(2026, 10, 1, 6, 10))
  })

  test('returns null for Tokyo which has no DST', () => {
    const from = Date.UTC(2026, 5, 1)
    expect(nextOffsetChange('Asia/Tokyo', from, untilFrom(from))).toBeNull()
  })

  test('returns null when Berlin next change is outside the 28-day window', () => {
    const from = Date.UTC(2026, 8, 7)
    expect(nextOffsetChange('Europe/Berlin', from, untilFrom(from))).toBeNull()
  })
})

describe('upcomingDstChanges', () => {
  test('preserves input order and skips Tokyo', () => {
    const now = Date.UTC(2026, 9, 10)
    const changes = upcomingDstChanges(['Asia/Tokyo', 'Europe/Berlin', 'America/New_York'], now)

    expect(changes.map((change) => change.zone)).toEqual(['Europe/Berlin', 'America/New_York'])
  })

  test('omits Tokyo from any 2026 window', () => {
    const now = Date.UTC(2026, 2, 15)
    expect(upcomingDstChanges(['Asia/Tokyo'], now)).toEqual([])
  })
})

describe('formatDstWarningLines', () => {
  test('uses city labels from getZoneMeta', () => {
    const now = Date.UTC(2026, 9, 10)
    const changes = upcomingDstChanges(['America/New_York', 'Europe/Berlin'], now)
    const lines = formatDstWarningLines(changes, now, 'America/New_York')

    expect(lines).toContain('New York City:')
    expect(lines).toContain('Berlin:')
    expect(lines).not.toContain('America/New_York')
    expect(lines).not.toContain('Europe/Berlin')
    expect(lines).toMatch(/^New York City: in \d+ days\nBerlin: in \d+ days$/)
  })
})
