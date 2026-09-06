import { describe, expect, test } from 'vitest'
import { resolveKnownZone } from '@/lib/zone-meta'

describe('known IANA zones', () => {
  test('resolves a canonical zone id', () => {
    expect(resolveKnownZone('Europe/Berlin')).toBe('Europe/Berlin')
    expect(resolveKnownZone('America/New_York')).toBe('America/New_York')
  })

  test('returns null for an unknown id', () => {
    expect(resolveKnownZone('Not/A_Zone')).toBeNull()
  })
})
