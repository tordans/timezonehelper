import { describe, expect, test } from 'vitest'
import { formatMeetingCopy } from '@/lib/meeting-copy'

describe('meeting copy', () => {
  test('includes the home header and every zone', () => {
    const text = formatMeetingCopy({
      date: '2026-09-05',
      start: '09:00',
      end: '10:00',
      home: 'Europe/London',
      zones: ['Europe/London', 'America/New_York', 'Asia/Tokyo'],
      hourFormat: '24',
    })

    expect(text).toContain('Meeting · 2026-09-05 · 09:00–10:00 home (Europe/London)')
    expect(text).toContain('London  09:00–10:00 BST')
    expect(text).toContain('New York City  04:00–05:00 EDT')
    expect(text).toContain('Tokyo  17:00–18:00 JST')
  })
})
