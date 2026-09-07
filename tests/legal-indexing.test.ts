import { describe, expect, test } from 'vitest'
import { hrefWithoutLegal } from '@/lib/legal-indexing'

describe('hrefWithoutLegal', () => {
  test('drops legal while keeping meeting params', () => {
    const href =
      'https://tim.ingsparks.de/?zones=Europe/Berlin,America/New_York&home=Europe/Berlin&legal=true'
    const next = new URL(hrefWithoutLegal(href))

    expect(next.origin + next.pathname).toBe('https://tim.ingsparks.de/')
    expect(next.searchParams.has('legal')).toBe(false)
    expect(next.searchParams.get('zones')).toBe('Europe/Berlin,America/New_York')
    expect(next.searchParams.get('home')).toBe('Europe/Berlin')
    expect(hrefWithoutLegal(href)).toContain('zones=Europe/Berlin,America/New_York')
    expect(hrefWithoutLegal(href)).not.toContain('legal=')
  })

  test('leaves a URL without legal unchanged besides normalization', () => {
    const href = 'https://tim.ingsparks.de/?zones=UTC'
    const next = hrefWithoutLegal(href)

    expect(new URL(next).searchParams.has('legal')).toBe(false)
    expect(new URL(next).searchParams.get('zones')).toBe('UTC')
  })
})
