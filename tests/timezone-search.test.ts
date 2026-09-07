import { describe, expect, test } from 'vitest'
import { searchTimezones } from '@/lib/timezone-search'

describe('grouped timezone search', () => {
  test('empty query shows last used only', () => {
    const result = searchTimezones('', ['Europe/Berlin', 'Asia/Tokyo'])

    expect(result.lastUsed.map((entry) => entry.zone)).toEqual(['Europe/Berlin', 'Asia/Tokyo'])
    expect(result.all).toEqual([])
  })

  test('one character does not search either group', () => {
    expect(searchTimezones('b', ['Europe/Berlin'])).toEqual({ lastUsed: [], all: [] })
  })

  test('two or more characters filter both groups and omit last used from All', () => {
    const result = searchTimezones('be', ['Europe/Berlin'])

    expect(result.lastUsed.map((entry) => entry.zone)).toEqual(['Europe/Berlin'])
    expect(result.all.map((entry) => entry.zone)).not.toContain('Europe/Berlin')
    expect(result.all.length).toBeGreaterThan(0)
  })

  test('last used that do not match stay out of both groups', () => {
    const result = searchTimezones('tokyo', ['Europe/Berlin'])

    expect(result.lastUsed).toEqual([])
    expect(result.all.map((entry) => entry.zone)).toContain('Asia/Tokyo')
    expect(result.all.map((entry) => entry.zone)).not.toContain('Europe/Berlin')
  })
})
