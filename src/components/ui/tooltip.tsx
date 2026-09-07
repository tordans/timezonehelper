import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

const SHOW_DELAY_MS = 150
export const TOOLTIP_GAP = 8
export const TOOLTIP_VIEWPORT_MARGIN = 16

export type TooltipPlacement = 'top' | 'bottom'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  className?: string
}

type ViewportFixedTooltipProps = {
  anchorX: number
  triggerTop: number
  triggerBottom: number
  preferredPlacement: TooltipPlacement
  children: ReactNode
  className?: string
}

export function clampTooltipCenterX(anchorX: number, tooltipWidth: number, viewportWidth: number) {
  const half = tooltipWidth / 2
  const minCenter = TOOLTIP_VIEWPORT_MARGIN + half
  const maxCenter = viewportWidth - TOOLTIP_VIEWPORT_MARGIN - half

  if (maxCenter <= minCenter) {
    return viewportWidth / 2
  }

  return Math.min(Math.max(anchorX, minCenter), maxCenter)
}

export function pickTooltipPlacement(
  preferred: TooltipPlacement,
  triggerTop: number,
  triggerBottom: number,
  tooltipHeight: number,
  viewportHeight: number,
): TooltipPlacement {
  const spaceBelow = viewportHeight - triggerBottom - TOOLTIP_GAP
  const spaceAbove = triggerTop - TOOLTIP_GAP

  if (preferred === 'bottom' && spaceBelow < tooltipHeight && spaceAbove > spaceBelow) {
    return 'top'
  }

  if (preferred === 'top' && spaceAbove < tooltipHeight && spaceBelow > spaceAbove) {
    return 'bottom'
  }

  return preferred
}

export function ViewportFixedTooltip({
  anchorX,
  triggerTop,
  triggerBottom,
  preferredPlacement,
  children,
  className,
}: ViewportFixedTooltipProps) {
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const [centerX, setCenterX] = useState(anchorX)
  const [placement, setPlacement] = useState(preferredPlacement)

  useLayoutEffect(
    function clampTooltipToViewport() {
      const node = tooltipRef.current
      if (!node) {
        return
      }

      const nextCenterX = clampTooltipCenterX(anchorX, node.offsetWidth, window.innerWidth)
      const nextPlacement = pickTooltipPlacement(
        preferredPlacement,
        triggerTop,
        triggerBottom,
        node.offsetHeight,
        window.innerHeight,
      )

      setCenterX((current) => (current === nextCenterX ? current : nextCenterX))
      setPlacement((current) => (current === nextPlacement ? current : nextPlacement))
    },
    [anchorX, preferredPlacement, triggerBottom, triggerTop],
  )

  const top = placement === 'bottom' ? triggerBottom + TOOLTIP_GAP : triggerTop - TOOLTIP_GAP

  return createPortal(
    <span
      ref={tooltipRef}
      role="tooltip"
      className={cn(
        'pointer-events-none fixed z-50 w-max max-w-xs -translate-x-1/2 rounded-md bg-zinc-950 px-3 py-1.5 text-sm/5 font-medium whitespace-pre-line text-white shadow-xs',
        placement === 'top' && '-translate-y-full',
        className,
      )}
      style={{ top, left: centerX }}
    >
      {children}
    </span>,
    document.body,
  )
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{
    x: number
    triggerTop: number
    triggerBottom: number
    placement: TooltipPlacement
  }>({
    x: 0,
    triggerTop: 0,
    triggerBottom: 0,
    placement: 'bottom',
  })
  const showTimeoutRef = useRef<number | null>(null)

  function cancelPendingShow() {
    if (showTimeoutRef.current === null) {
      return
    }

    window.clearTimeout(showTimeoutRef.current)
    showTimeoutRef.current = null
  }

  function hideTooltip() {
    cancelPendingShow()
    setOpen(false)
  }

  function scheduleShow(target: HTMLElement) {
    cancelPendingShow()
    const bounds = target.getBoundingClientRect()
    const placement: TooltipPlacement = window.innerHeight - bounds.bottom < 56 ? 'top' : 'bottom'

    showTimeoutRef.current = window.setTimeout(() => {
      setAnchor({
        x: bounds.left + bounds.width / 2,
        triggerTop: bounds.top,
        triggerBottom: bounds.bottom,
        placement,
      })
      setOpen(true)
    }, SHOW_DELAY_MS)
  }

  useEffect(function clearPendingTooltipShow() {
    return function cancelPendingTooltipShow() {
      if (showTimeoutRef.current === null) {
        return
      }

      window.clearTimeout(showTimeoutRef.current)
    }
  }, [])

  return (
    <span
      className={cn('inline-flex cursor-help', className)}
      onPointerEnter={(event) => scheduleShow(event.currentTarget)}
      onPointerLeave={hideTooltip}
      onFocus={(event) => scheduleShow(event.currentTarget)}
      onBlur={hideTooltip}
    >
      {children}
      {open ? (
        <ViewportFixedTooltip
          anchorX={anchor.x}
          triggerTop={anchor.triggerTop}
          triggerBottom={anchor.triggerBottom}
          preferredPlacement={anchor.placement}
        >
          {content}
        </ViewportFixedTooltip>
      ) : null}
    </span>
  )
}
