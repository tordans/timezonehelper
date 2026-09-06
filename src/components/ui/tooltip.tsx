import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

const SHOW_DELAY_MS = 150
const VIEWPORT_MARGIN = 16

type TooltipPlacement = 'top' | 'bottom'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: 'bottom' as TooltipPlacement,
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
    const centerX = bounds.left + bounds.width / 2
    const gap = 8
    const placement: TooltipPlacement = window.innerHeight - bounds.bottom < 56 ? 'top' : 'bottom'
    const top = placement === 'bottom' ? bounds.bottom + gap : bounds.top - gap
    const left = Math.min(Math.max(centerX, VIEWPORT_MARGIN), window.innerWidth - VIEWPORT_MARGIN)

    showTimeoutRef.current = window.setTimeout(() => {
      setPosition({ top, left, placement })
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
      {open
        ? createPortal(
            <span
              role="tooltip"
              className={cn(
                'pointer-events-none fixed z-50 w-max max-w-xs -translate-x-1/2 rounded-md bg-zinc-950 px-3 py-1.5 text-sm/5 font-medium whitespace-pre-line text-white shadow-xs',
                position.placement === 'top' && '-translate-y-full',
              )}
              style={{ top: position.top, left: position.left }}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}
