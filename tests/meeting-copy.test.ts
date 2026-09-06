import { describe, expect, test } from 'vitest'
import { formatMeetingCopy } from '@/lib/meeting-copy'

describe('meeting copy', () => {
  test('lists the calendar date then each location and local time', () => {
    const text = formatMeetingCopy({
      date: '2026-09-05',
      start: '09:00',
      end: '10:00',
      home: 'Europe/London',
      zones: ['Europe/London', 'America/New_York', 'Asia/Tokyo'],
      hourFormat: '24',
    })

    expect(text).toBe(
      [
        'Saturday, 5 September 2026',
        'London: 09:00–10:00 BST',
        'New York City: 04:00–05:00 EDT',
        'Tokyo: 17:00–18:00 JST',
      ].join('\n'),
    )
  })
})
