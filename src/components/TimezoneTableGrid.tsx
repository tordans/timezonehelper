import { HomeIcon, SunIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { AnimatePresence } from 'motion/react'
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { Badge } from '@/components/catalyst/badge'
import { Button } from '@/components/catalyst/button'
import { MotionDiv } from '@/components/shared/motion'
import { Kbd } from '@/components/ui/kbd'
import { Tooltip, ViewportFixedTooltip } from '@/components/ui/tooltip'
import { ZoneSearchField } from '@/components/ZoneSearchCard'
import { useAppSearch, useSearchActions, useSortedZones } from '@/hooks/use-app-search'
import { useUiMotion } from '@/hooks/use-ui-motion'
import { cn } from '@/lib/cn'
import { formatDstSunTooltip, upcomingDstChanges } from '@/lib/dst'
import {
  addLeadingSign,
  clamp,
  formatDurationMinutes,
  formatHourCellTooltip,
  formatMinute,
  formatSelectedRangeHeading,
  isCurrentWeekInZone,
  isWeekendInZone,
  minuteOfDayInZone,
  parseMinute,
  resolveHour12,
  roundToStep,
  todayInZone,
  toTimestampFromHome,
  zoneAbbreviation,
  zoneDeltaHours,
} from '@/lib/time'
import { getZoneMeta } from '@/lib/zone-meta'
import { useDragState, useAutoAddedZone, useNowTimestamp, useUiActions } from '@/state/ui-store'

const SLOT_STEP = 60
const MAX_MINUTE = 24 * 60 - 5
const LABEL_WIDTH = 240
const CELL_WIDTH = 54
const SLOT_MARKERS = Array.from({ length: 24 }, (_, index) => index * SLOT_STEP)
const HOUR_TOOLTIP_DELAY_MS = 150
const zoneActionButtonClassName =
  'size-6 p-0! sm:p-0! *:data-[slot=icon]:m-0 *:data-[slot=icon]:size-3.5 sm:*:data-[slot=icon]:my-0 sm:*:data-[slot=icon]:size-3.5'

function minuteFromClientX(clientX: number, bounds: DOMRect) {
  const relativeX = clamp(clientX - bounds.left, 0, bounds.width)
  const progress = relativeX / (SLOT_MARKERS.length * CELL_WIDTH)
  return clamp(Math.round(progress * 24 * 60), 0, MAX_MINUTE)
}

function todClassForHour(hour: number) {
  if (hour >= 6 && hour <= 7) {
    return 'tod_m'
  }
  if (hour >= 8 && hour <= 17) {
    return 'tod_d'
  }
  if (hour >= 18 && hour <= 21) {
    return 'tod_e'
  }
  return 'tod_n'
}

function tickToneClass(todClass: string, weekend: boolean, currentWeek: boolean) {
  if (currentWeek) {
    return weekend ? 'bg-fuchsia-100/50' : 'bg-fuchsia-50/50'
  }

  if (weekend) {
    if (todClass === 'tod_m' || todClass === 'tod_e') {
      return 'bg-rose-100'
    }
    if (todClass === 'tod_d') {
      return 'bg-rose-50'
    }
    return 'bg-rose-50/80'
  }

  if (todClass === 'tod_m') {
    return 'bg-zinc-100'
  }
  if (todClass === 'tod_d') {
    return 'bg-white'
  }
  if (todClass === 'tod_e') {
    return 'bg-zinc-100/70'
  }
  return 'bg-zinc-50'
}

export function TimezoneTableGrid() {
  const search = useAppSearch()
  const sortedZones = useSortedZones()
  const { setHome, removeZone, updateSearchPatch } = useSearchActions()
  const nowTimestamp = useNowTimestamp()
  const autoAddedZone = useAutoAddedZone()
  const dragState = useDragState()
  const { setDragState } = useUiActions()
  const { duration, prefersReducedMotion } = useUiMotion()
  const cardRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const rangeCaptionRef = useRef<HTMLHeadingElement | null>(null)
  const hourTipTimeoutRef = useRef<number | null>(null)
  const hourTipOpenRef = useRef(false)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [captionLeft, setCaptionLeft] = useState(0)
  const [hourTip, setHourTip] = useState<{
    headline: string
    detail: string
    anchorX: number
    triggerTop: number
    triggerBottom: number
    preferredPlacement: 'top' | 'bottom'
  } | null>(null)

  const startMinute = parseMinute(search.start)
  const endMinute = parseMinute(search.end)
  const timelineStart = Math.min(startMinute, endMinute)
  const timelineEnd = Math.max(startMinute, endMinute)
  const offsetSampleTimestamp = toTimestampFromHome(search.date, search.home, 12 * 60)
  const isToday = search.date === todayInZone(search.home)
  const nowMinute = minuteOfDayInZone(nowTimestamp, search.home)
  const nowDate = new Date(nowTimestamp)

  const selectionLeft = (timelineStart / SLOT_STEP) * CELL_WIDTH
  const selectionWidth = Math.max(6, ((timelineEnd - timelineStart) / SLOT_STEP) * CELL_WIDTH)
  const nowLeft = (nowMinute / SLOT_STEP) * CELL_WIDTH
  const hoursTemplateColumns = `repeat(${SLOT_MARKERS.length}, ${CELL_WIDTH}px)`
  const zoneCount = sortedZones.length
  const dstLabelByZone = new Map(
    upcomingDstChanges(sortedZones, nowTimestamp).map((change) => [
      change.zone,
      formatDstSunTooltip(change.at, nowTimestamp),
    ]),
  )
  const selectionTransition =
    dragState || prefersReducedMotion
      ? { duration: 0 }
      : { type: 'tween' as const, duration: 0.18, ease: 'easeOut' as const }
  const rangeStartTimestamp = toTimestampFromHome(search.date, search.home, timelineStart)
  const rangeEndTimestamp = toTimestampFromHome(search.date, search.home, timelineEnd)
  const rangeHeading = formatSelectedRangeHeading(
    rangeStartTimestamp,
    rangeEndTimestamp,
    search.home,
    search.hourFormat,
    formatDurationMinutes(timelineEnd - timelineStart),
  )

  function localDateParts(timestamp: number, zone: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: zone,
    }).formatToParts(new Date(timestamp))

    const weekday = parts.find((part) => part.type === 'weekday')?.value ?? ''
    const month = parts.find((part) => part.type === 'month')?.value ?? ''
    const day = parts.find((part) => part.type === 'day')?.value ?? ''
    return { weekday, month, day }
  }

  function localHourParts(timestamp: number, zone: string) {
    const hour12 = resolveHour12(search.hourFormat, zone)

    if (!hour12) {
      const hour = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        hour12: false,
        timeZone: zone,
      }).format(new Date(timestamp))

      return { hour, period: '' }
    }

    const parts = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: true,
      timeZone: zone,
    }).formatToParts(new Date(timestamp))

    const hour = parts.find((part) => part.type === 'hour')?.value ?? ''
    const period = (parts.find((part) => part.type === 'dayPeriod')?.value ?? '').toLowerCase()
    return { hour, period }
  }

  function localHourForClass(timestamp: number, zone: string) {
    const hour = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      hour12: false,
      timeZone: zone,
    }).format(new Date(timestamp))

    return Number.parseInt(hour, 10)
  }

  function updateSelectionFromPointer(event: PointerEvent<HTMLDivElement>) {
    if (!dragState || !gridRef.current) {
      return
    }

    const bounds = gridRef.current.getBoundingClientRect()
    const step = event.shiftKey ? 5 : SLOT_STEP
    const rawMinute = minuteFromClientX(event.clientX, bounds)
    const roundedMinute = clamp(roundToStep(rawMinute, step), 0, 24 * 60 - step)
    const minimumSpan = step

    switch (dragState.mode) {
      case 'create': {
        const start = Math.min(dragState.anchor, roundedMinute)
        const end = Math.max(dragState.anchor, roundedMinute) + minimumSpan
        updateSearchPatch({
          start: formatMinute(start),
          end: formatMinute(clamp(end, minimumSpan, MAX_MINUTE)),
        })
        return
      }
      case 'resize-start': {
        const start = clamp(roundedMinute, 0, timelineEnd - minimumSpan)
        updateSearchPatch({
          start: formatMinute(start),
        })
        return
      }
      case 'resize-end': {
        const end = clamp(roundedMinute + minimumSpan, timelineStart + minimumSpan, MAX_MINUTE)
        updateSearchPatch({
          end: formatMinute(end),
        })
      }
    }
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }
    if (target.closest('button, a, input, [tabindex]:not([tabindex="-1"])')) {
      return
    }

    hideHourTip()
    event.preventDefault()
    if (!gridRef.current) {
      return
    }

    const bounds = gridRef.current.getBoundingClientRect()
    const step = event.shiftKey ? 5 : SLOT_STEP
    const anchor = clamp(
      roundToStep(minuteFromClientX(event.clientX, bounds), step),
      0,
      24 * 60 - step,
    )
    setDragState({ mode: 'create', anchor })
    updateSearchPatch({
      start: formatMinute(anchor),
      end: formatMinute(clamp(anchor + step, step, MAX_MINUTE)),
    })
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Untrusted or already-released pointers cannot capture.
    }
  }

  function captureScrollPointer(event: PointerEvent<HTMLDivElement>) {
    try {
      scrollRef.current?.setPointerCapture(event.pointerId)
    } catch {
      // Untrusted or already-released pointers cannot capture.
    }
  }

  function startResizeStart(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    hideHourTip()
    captureScrollPointer(event)
    setDragState({
      mode: 'resize-start',
      anchor: timelineStart,
    })
  }

  function startResizeEnd(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    hideHourTip()
    captureScrollPointer(event)
    setDragState({
      mode: 'resize-end',
      anchor: timelineEnd,
    })
  }

  function cancelHourTipTimeout() {
    if (hourTipTimeoutRef.current === null) {
      return
    }

    window.clearTimeout(hourTipTimeoutRef.current)
    hourTipTimeoutRef.current = null
  }

  function hideHourTip() {
    cancelHourTipTimeout()
    hourTipOpenRef.current = false
    setHourTip(null)
  }

  function handleHourGridScroll() {
    hideHourTip()
    setScrollLeft(scrollRef.current?.scrollLeft ?? 0)
  }

  function hideHourTipSoon() {
    cancelHourTipTimeout()
    hourTipTimeoutRef.current = window.setTimeout(() => {
      hourTipOpenRef.current = false
      setHourTip(null)
      hourTipTimeoutRef.current = null
    }, 80)
  }

  function showHourTip(target: HTMLElement, minute: number) {
    if (dragState) {
      return
    }

    cancelHourTipTimeout()
    const copy = formatHourCellTooltip(
      toTimestampFromHome(search.date, search.home, minute),
      search.home,
    )
    const bounds = target.getBoundingClientRect()
    const preferredPlacement: 'top' | 'bottom' =
      window.innerHeight - bounds.bottom < 72 ? 'top' : 'bottom'
    const nextTip = {
      headline: copy.headline,
      detail: copy.detail,
      anchorX: bounds.left + bounds.width / 2,
      triggerTop: bounds.top,
      triggerBottom: bounds.bottom,
      preferredPlacement,
    }

    function applyHourTip() {
      hourTipOpenRef.current = true
      setHourTip(nextTip)
    }

    if (hourTipOpenRef.current) {
      applyHourTip()
      return
    }

    hourTipTimeoutRef.current = window.setTimeout(applyHourTip, HOUR_TOOLTIP_DELAY_MS)
  }

  useEffect(function clearHourTipTimeout() {
    return function cancelPendingHourTip() {
      cancelHourTipTimeout()
    }
  }, [])

  useLayoutEffect(
    function positionRangeCaption() {
      const caption = rangeCaptionRef.current
      const card = cardRef.current
      const scroller = scrollRef.current
      if (!caption || !card || !scroller) {
        return
      }

      const scrollerOffset =
        scroller.getBoundingClientRect().left - card.getBoundingClientRect().left
      const anchorLeft = scrollerOffset + selectionLeft - scrollLeft
      const anchorRight = anchorLeft + selectionWidth
      const width = caption.offsetWidth
      const fitsLeft = anchorLeft + width <= card.clientWidth
      const nextLeft = fitsLeft
        ? Math.max(0, anchorLeft)
        : clamp(anchorRight - width, 0, Math.max(0, card.clientWidth - width))

      setCaptionLeft(nextLeft)
    },
    [rangeHeading.meta, rangeHeading.title, scrollLeft, selectionLeft, selectionWidth, zoneCount],
  )

  return (
    <div className="relative w-full max-w-full min-w-0 pt-7" ref={cardRef}>
      {zoneCount > 0 ? (
        <MotionDiv
          className="absolute top-0 z-30 whitespace-nowrap"
          initial={false}
          animate={{ left: captionLeft }}
          transition={selectionTransition}
        >
          <h2 className="text-sm/6" id="selected-range-heading" ref={rangeCaptionRef}>
            <span className="font-semibold text-orange-800">{rangeHeading.title}</span>
            <span className="text-zinc-500"> · {rangeHeading.meta}</span>
          </h2>
        </MotionDiv>
      ) : null}
      <div className="w-full max-w-full min-w-0 overflow-visible rounded-lg bg-white font-sans text-xs shadow-sm ring-1 ring-zinc-950/5">
        <div
          className="grid w-full min-w-0 overflow-hidden rounded-t-lg"
          style={{ gridTemplateColumns: `${LABEL_WIDTH}px minmax(0, 1fr)` }}
        >
          <AnimatePresence initial={false}>
            {sortedZones.map((zone, index) => {
              const meta = getZoneMeta(zone)
              const isHome = zone === search.home
              const isAutoAdded = zone === autoAddedZone
              const deltaHours = zoneDeltaHours(search.home, zone, offsetSampleTimestamp)
              const abbreviation = zoneAbbreviation(offsetSampleTimestamp, zone)
              const offsetLabel = isHome ? '0' : addLeadingSign(deltaHours)
              const dstLabel = dstLabelByZone.get(zone)

              return (
                <MotionDiv
                  key={zone}
                  className={cn(
                    'group/zone flex items-center justify-between gap-1 border-r border-b border-zinc-950/10 py-1.5 pr-0.5 pl-2.5',
                    isHome ? 'bg-orange-50' : 'bg-white',
                  )}
                  style={{ gridColumn: 1, gridRow: index + 1 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="flex min-w-0 items-center gap-0.5">
                        <span className="truncate text-sm/5 font-semibold text-zinc-950">
                          {meta.city}
                        </span>
                        {isHome && (
                          <span
                            className="mt-px inline-flex shrink-0 cursor-help items-center text-orange-600"
                            aria-label="Home"
                          >
                            <HomeIcon className="size-3.5" />
                          </span>
                        )}
                        {dstLabel != null && (
                          <Tooltip content={dstLabel}>
                            <span
                              className="mt-px inline-flex shrink-0 cursor-help items-center text-orange-600"
                              aria-label={dstLabel}
                            >
                              <SunIcon className="size-3.5" />
                            </span>
                          </Tooltip>
                        )}
                      </span>
                      {isAutoAdded && (
                        <Tooltip content="Auto added based on your browser settings">
                          <Badge
                            color="zinc"
                            className="cursor-help outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                            tabIndex={0}
                            aria-label="Auto added based on your browser settings"
                          >
                            Auto added
                          </Badge>
                        </Tooltip>
                      )}
                    </div>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px]/4 text-zinc-500">
                      <span>
                        {abbreviation ? `${abbreviation} ` : ''}
                        {offsetLabel}
                      </span>
                      <span>
                        {new Intl.DateTimeFormat('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: search.hourFormat !== '24',
                          timeZone: zone,
                        }).format(new Date(nowTimestamp))}
                      </span>
                    </span>
                  </div>
                  {(!isHome || isAutoAdded) && (
                    <div
                      className={cn(
                        'flex shrink-0 items-center origin-right',
                        'transition duration-150 ease-out motion-reduce:transition-none',
                        'fine-pointer:pointer-events-none fine-pointer:scale-95 fine-pointer:opacity-0',
                        'group-hover/zone:pointer-events-auto! group-hover/zone:scale-100! group-hover/zone:opacity-100!',
                        'group-focus-within/zone:pointer-events-auto! group-focus-within/zone:scale-100! group-focus-within/zone:opacity-100!',
                      )}
                    >
                      {!isHome && (
                        <Button
                          plain
                          type="button"
                          className={zoneActionButtonClassName}
                          aria-label={`Set ${meta.city} as home`}
                          onClick={() => setHome(zone)}
                        >
                          <HomeIcon data-slot="icon" />
                        </Button>
                      )}
                      <Button
                        plain
                        type="button"
                        className={zoneActionButtonClassName}
                        aria-label={`Remove ${meta.city}`}
                        disabled={search.zones.length <= 1}
                        onClick={() => removeZone(zone)}
                      >
                        <XMarkIcon data-slot="icon" />
                      </Button>
                    </div>
                  )}
                </MotionDiv>
              )
            })}
          </AnimatePresence>

          {zoneCount > 0 && (
            <div
              className="relative z-0 min-w-0 touch-none overflow-x-auto overflow-y-hidden select-none"
              ref={scrollRef}
              style={{
                gridColumn: 2,
                gridRow: `1 / span ${zoneCount}`,
                display: 'grid',
                gridTemplateRows: 'subgrid',
              }}
              onPointerDown={startDrag}
              onPointerMove={updateSelectionFromPointer}
              onPointerUp={() => setDragState(null)}
              onPointerCancel={() => setDragState(null)}
              onScroll={handleHourGridScroll}
            >
              <div
                className="relative grid min-h-full w-max"
                ref={gridRef}
                style={{
                  gridColumn: 1,
                  gridRow: '1 / -1',
                  gridTemplateColumns: hoursTemplateColumns,
                  gridTemplateRows: 'subgrid',
                }}
              >
                {isToday && (
                  <MotionDiv
                    className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-fuchsia-600"
                    style={{
                      left: nowLeft,
                      gridColumn: '1 / -1',
                      gridRow: '1 / -1',
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
                    aria-hidden="true"
                  />
                )}
                <MotionDiv
                  className="pointer-events-none absolute inset-y-0 z-20 rounded-md bg-orange-500/10 ring-2 ring-orange-700 ring-inset"
                  initial={false}
                  animate={{ left: `${selectionLeft}px`, width: `${selectionWidth}px` }}
                  transition={selectionTransition}
                  style={{ gridColumn: '1 / -1', gridRow: '1 / -1' }}
                >
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center">
                    <div
                      className="pointer-events-auto h-10 w-2 -translate-x-1/2 cursor-ew-resize touch-manipulation rounded-full bg-orange-700 shadow-sm select-none"
                      onPointerDown={startResizeStart}
                      aria-label="Resize selection start"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center">
                    <div
                      className="pointer-events-auto h-10 w-2 translate-x-1/2 cursor-ew-resize touch-manipulation rounded-full bg-orange-700 shadow-sm select-none"
                      onPointerDown={startResizeEnd}
                      aria-label="Resize selection end"
                    />
                  </div>
                </MotionDiv>

                {sortedZones.map((zone, zoneIndex) => (
                  <Fragment key={zone}>
                    {SLOT_MARKERS.map((minute, hourIndex) => {
                      const timestamp = toTimestampFromHome(search.date, search.home, minute)
                      const selected = minute >= timelineStart && minute < timelineEnd
                      const localHour = localHourForClass(timestamp, zone)
                      const local = localHourParts(timestamp, zone)
                      const currentDate = localDateParts(timestamp, zone)
                      const previousDate =
                        minute > 0
                          ? localDateParts(
                              toTimestampFromHome(search.date, search.home, minute - SLOT_STEP),
                              zone,
                            )
                          : null
                      const isBoundary =
                        minute === 0 ||
                        !previousDate ||
                        `${previousDate.month}-${previousDate.day}` !==
                          `${currentDate.month}-${currentDate.day}`
                      const todClass = todClassForHour(localHour)
                      const weekendCell = isWeekendInZone(timestamp, zone)
                      const currentWeekCell = isCurrentWeekInZone(timestamp, zone, nowDate)
                      const toneClass = tickToneClass(todClass, weekendCell, currentWeekCell)

                      return (
                        <div
                          className={cn(
                            'flex min-h-[34px] flex-col items-center justify-center gap-0.5 py-1.5 text-center text-xs/4',
                            'border-r border-b border-zinc-950/5',
                            toneClass,
                            selected && '!bg-orange-100',
                          )}
                          key={`${zone}-${minute}`}
                          style={{ gridColumn: hourIndex + 1, gridRow: zoneIndex + 1 }}
                          onPointerEnter={(event) => showHourTip(event.currentTarget, minute)}
                          onPointerLeave={hideHourTipSoon}
                        >
                          {isBoundary ? (
                            <>
                              <span className="text-[11px]/4 text-zinc-500">
                                {currentDate.weekday}{' '}
                              </span>
                              <span className="font-semibold text-zinc-700">
                                {currentDate.month} {currentDate.day}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-semibold text-zinc-800">{local.hour}</span>
                              {local.period ? (
                                <span className="text-[11px]/4 text-zinc-500">{local.period}</span>
                              ) : null}
                            </>
                          )}
                        </div>
                      )
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="grid w-full min-w-0"
          style={{ gridTemplateColumns: `${LABEL_WIDTH}px minmax(0, 1fr)` }}
        >
          <div
            className={cn(
              'relative z-20 border-r border-zinc-950/10 bg-white px-2.5 py-2',
              zoneCount === 0 ? 'rounded-l-lg' : 'rounded-bl-lg',
            )}
          >
            <ZoneSearchField />
          </div>
          <p
            className={cn(
              'flex items-center justify-end bg-white px-3 py-2 text-[11px]/none text-zinc-500',
              zoneCount === 0 ? 'rounded-r-lg' : 'rounded-br-lg',
            )}
          >
            <span>
              Hold <Kbd>Shift</Kbd> while dragging for 5-minute precision.
            </span>
          </p>
        </div>
        {hourTip ? (
          <ViewportFixedTooltip
            anchorX={hourTip.anchorX}
            triggerTop={hourTip.triggerTop}
            triggerBottom={hourTip.triggerBottom}
            preferredPlacement={hourTip.preferredPlacement}
          >
            <span className="block">{hourTip.headline}</span>
            <span className="mt-0.5 block font-normal text-white/80">{hourTip.detail}</span>
          </ViewportFixedTooltip>
        ) : null}
      </div>
    </div>
  )
}
