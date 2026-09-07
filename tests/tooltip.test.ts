import { describe, expect, test } from 'vitest'
import {
  clampTooltipCenterX,
  pickTooltipPlacement,
  TOOLTIP_GAP,
  TOOLTIP_VIEWPORT_MARGIN,
} from '@/components/ui/tooltip'

describe('clampTooltipCenterX', () => {
  test('shifts right when the tooltip would overflow the left edge', () => {
    expect(clampTooltipCenterX(20, 200, 800)).toBe(TOOLTIP_VIEWPORT_MARGIN + 100)
  })

  test('shifts left when the tooltip would overflow the right edge', () => {
    expect(clampTooltipCenterX(790, 200, 800)).toBe(800 - TOOLTIP_VIEWPORT_MARGIN - 100)
  })

  test('keeps the trigger center when there is room', () => {
    expect(clampTooltipCenterX(400, 200, 800)).toBe(400)
  })

  test('centers in the viewport when the tooltip is wider than the usable width', () => {
    expect(clampTooltipCenterX(10, 800, 400)).toBe(200)
  })
})

describe('pickTooltipPlacement', () => {
  test('flips to top when there is not enough room below', () => {
    expect(pickTooltipPlacement('bottom', 400, 420, 80, 500)).toBe('top')
  })

  test('flips to bottom when there is not enough room above', () => {
    expect(pickTooltipPlacement('top', 40, 60, 80, 500)).toBe('bottom')
  })

  test('keeps the preferred side when it fits', () => {
    expect(pickTooltipPlacement('bottom', 40, 60, 40, 500)).toBe('bottom')
  })

  test('keeps bottom when both sides are tight but below has more room', () => {
    const triggerTop = 20
    const triggerBottom = 40
    const viewportHeight = triggerBottom + TOOLTIP_GAP + 30
    expect(pickTooltipPlacement('bottom', triggerTop, triggerBottom, 80, viewportHeight)).toBe(
      'bottom',
    )
  })
})
