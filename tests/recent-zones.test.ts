import { describe, expect, test } from 'vitest'
import { parseRecentZones, rememberRecentZone, RECENT_ZONES_CAP } from '@/lib/recent-zones'

const SAMPLE_ZONES = [
  'Europe/Berlin',
  'Europe/London',
  'America/New_York',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'America/Los_Angeles',
  'America/Chicago',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Europe/Paris',
] as const

describe('rememberRecentZone', () => {
  test('prepends a known zone', () => {
    expect(rememberRecentZone(['Europe/London'], 'Europe/Berlin')).toEqual([
      'Europe/Berlin',
      'Europe/London',
    ])
  })

  test('moves an existing zone to the front', () => {
    expect(rememberRecentZone(['Europe/London', 'Europe/Berlin'], 'Europe/Berlin')).toEqual([
      'Europe/Berlin',
      'Europe/London',
    ])
  })

  test('keeps a zone unique and already-first list unchanged', () => {
    const current = ['Europe/Berlin', 'Europe/London']
    expect(rememberRecentZone(current, 'Europe/Berlin')).toBe(current)
  })

  test('ignores unknown zone ids', () => {
    const current = ['Europe/Berlin']
    expect(rememberRecentZone(current, 'Not/A_Zone')).toBe(current)
  })

  test('caps the list at 10 most recent', () => {
    let zones: string[] = []
    for (const zone of SAMPLE_ZONES) {
      zones = rememberRecentZone(zones, zone)
    }

    expect(zones).toHaveLength(RECENT_ZONES_CAP)
    expect(zones[0]).toBe('Europe/Paris')
    expect(zones).not.toContain('Europe/Berlin')
  })
})

describe('parseRecentZones', () => {
  test('reads unique known ids and drops unknown values', () => {
    expect(
      parseRecentZones(JSON.stringify(['Europe/Berlin', 'Not/A_Zone', 'Europe/Berlin', 12])),
    ).toEqual(['Europe/Berlin'])
  })

  test('returns an empty list for missing or invalid payloads', () => {
    expect(parseRecentZones(null)).toEqual([])
    expect(parseRecentZones('[]')).toEqual([])
    expect(parseRecentZones('not-json')).toEqual([])
    expect(parseRecentZones('{"zone":"Europe/Berlin"}')).toEqual([])
  })
})
