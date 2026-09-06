import { HomeIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useRef, type PointerEvent } from 'react'
import { MotionDiv } from '@/components/shared/motion'
import { useAppSearch, useSearchActions, useSortedZones } from '@/hooks/use-app-search'
import { useUiMotion } from '@/hooks/use-ui-motion'
import { cn } from '@/lib/cn'
import {
  addLeadingSign,
  clamp,
  formatMinute,
  isWeekendInZone,
  minuteOfDayInZone,
  parseMinute,
  roundToStep,
  todayInZone,
  toTimestampFromHome,
  zoneAbbreviation,
  zoneDeltaHours,
} from '@/lib/time'
import { getZoneMeta, zoneUsesHour12 } from '@/lib/zone-meta'
import { useDragState, useNowTimestamp, useUiActions } from '@/state/ui-store'

const SLOT_STEP = 60
const MAX_MINUTE = 24 * 60 - 5
const LABEL_WIDTH = 240
const CELL_WIDTH = 54
const SLOT_MARKERS = Array.from({ length: 24 }, (_, index) => index * SLOT_STEP)

const rowActionClassName =
  'inline-flex size-11 cursor-pointer touch-manipulation items-center justify-center rounded border border-slate-300 bg-slate-50 text-slate-700 select-none active:bg-indigo-100 hover-fine:bg-indigo-50'

function minuteFromClientX(clientX: number, bounds: DOMRect): number {
  const relativeX = clamp(clientX - bounds.left - LABEL_WIDTH, 0, bounds.width - LABEL_WIDTH)
  const progress = relativeX / (SLOT_MARKERS.length * CELL_WIDTH)
  return clamp(Math.round(progress * 24 * 60), 0, MAX_MINUTE)
}

function todClassForHour(hour: number): string {
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

function tickToneClass(todClass: string, weekend: boolean): string {
  if (weekend) {
    if (todClass === 'tod_m') {
      return 'bg-rose-100'
    }
    if (todClass === 'tod_d') {
      return 'bg-rose-50'
    }
    if (todClass === 'tod_e') {
      return 'bg-rose-100/80'
    }
    return 'bg-rose-50/80'
  }

  if (todClass === 'tod_m') {
    return 'bg-slate-100'
  }
  if (todClass === 'tod_d') {
    return 'bg-white'
  }
  if (todClass === 'tod_e') {
    return 'bg-slate-100/70'
  }
  return 'bg-slate-50'
}

export function TimezoneTableGrid() {
  const search = useAppSearch()
  const sortedZones = useSortedZones()
  const { setHome, removeZone, updateSearchPatch } = useSearchActions()
  const nowTimestamp = useNowTimestamp()
  const dragState = useDragState()
  const { setDragState } = useUiActions()
  const { duration, prefersReducedMotion } = useUiMotion()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)

  const startMinute = parseMinute(search.start)
  const endMinute = parseMinute(search.end)
  const timelineStart = Math.min(startMinute, endMinute)
  const timelineEnd = Math.max(startMinute, endMinute)
  const offsetSampleTimestamp = toTimestampFromHome(search.date, search.home, 12 * 60)
  const isToday = search.date === todayInZone(search.home)
  const nowMinute = minuteOfDayInZone(nowTimestamp, search.home)

  const selectionLeft = LABEL_WIDTH + (timelineStart / SLOT_STEP) * CELL_WIDTH
  const selectionWidth = Math.max(6, ((timelineEnd - timelineStart) / SLOT_STEP) * CELL_WIDTH)
  const nowLeft = LABEL_WIDTH + (nowMinute / SLOT_STEP) * CELL_WIDTH
  const zoneRowColumns = `${LABEL_WIDTH}px repeat(${SLOT_MARKERS.length}, ${CELL_WIDTH}px)`
  const selectionTransition =
    dragState || prefersReducedMotion
      ? { duration: 0 }
      : { type: 'tween' as const, duration: 0.18, ease: 'easeOut' as const }

  function localDateParts(
    timestamp: number,
    zone: string,
  ): { weekday: string; month: string; day: string } {
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

  function localHourParts(timestamp: number, zone: string): { hour: string; period: string } {
    const hour12 =
      search.hourFormat === '24' ? false : search.hourFormat === '12' ? true : zoneUsesHour12(zone)

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

  function localHourForClass(timestamp: number, zone: string): number {
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

    if (dragState.mode === 'create') {
      const start = Math.min(dragState.anchor, roundedMinute)
      const end = Math.max(dragState.anchor, roundedMinute) + minimumSpan
      updateSearchPatch({
        start: formatMinute(start),
        end: formatMinute(clamp(end, minimumSpan, MAX_MINUTE)),
      })
      return
    }

    if (dragState.mode === 'resize-start') {
      const start = clamp(roundedMinute, 0, timelineEnd - minimumSpan)
      updateSearchPatch({
        start: formatMinute(start),
      })
      return
    }

    const end = clamp(roundedMinute + minimumSpan, timelineStart + minimumSpan, MAX_MINUTE)
    updateSearchPatch({
      end: formatMinute(end),
    })
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    const target = event.target as HTMLElement
    if (target.closest('button')) {
      return
    }
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
    captureScrollPointer(event)
    setDragState({
      mode: 'resize-start',
      anchor: timelineStart,
    })
  }

  function startResizeEnd(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    captureScrollPointer(event)
    setDragState({
      mode: 'resize-end',
      anchor: timelineEnd,
    })
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Meeting grid</h2>
      <div
        className="relative w-full touch-none overflow-auto rounded-lg border border-slate-200 font-sans text-xs select-none"
        ref={scrollRef}
        onPointerDown={startDrag}
        onPointerMove={updateSelectionFromPointer}
        onPointerUp={() => setDragState(null)}
        onPointerCancel={() => setDragState(null)}
      >
        <div className="relative w-max min-w-full" ref={gridRef}>
          {isToday && (
            <MotionDiv
              className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-indigo-600"
              style={{ left: nowLeft }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
              aria-hidden="true"
            />
          )}
          <MotionDiv
            className="pointer-events-none absolute inset-y-0 z-20 flex justify-between rounded-md border border-indigo-700 bg-indigo-500/20"
            initial={false}
            animate={{ left: `${selectionLeft}px`, width: `${selectionWidth}px` }}
            transition={selectionTransition}
          >
            <div
              className="pointer-events-auto w-3 min-w-3 cursor-ew-resize touch-manipulation bg-indigo-700 select-none"
              onPointerDown={startResizeStart}
              aria-label="Resize selection start"
            />
            <div
              className="pointer-events-auto w-3 min-w-3 cursor-ew-resize touch-manipulation bg-indigo-700 select-none"
              onPointerDown={startResizeEnd}
              aria-label="Resize selection end"
            />
          </MotionDiv>

          <LayoutGroup>
            <AnimatePresence initial={false} mode="popLayout">
              {sortedZones.map((zone) => {
                const meta = getZoneMeta(zone)
                const isHome = zone === search.home
                const deltaHours = zoneDeltaHours(search.home, zone, offsetSampleTimestamp)
                const abbreviation = zoneAbbreviation(offsetSampleTimestamp, zone)
                const offsetLabel = isHome ? '0' : addLeadingSign(deltaHours)

                return (
                  <MotionDiv
                    key={zone}
                    layout={!prefersReducedMotion}
                    className="grid w-max min-w-full items-stretch"
                    style={{ gridTemplateColumns: zoneRowColumns }}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'tween', duration, ease: 'easeOut' }}
                  >
                    <div
                      className={cn(
                        'sticky left-0 z-30 flex items-center justify-between gap-2 border-r border-b border-slate-200 px-2.5 py-2',
                        isHome ? 'bg-indigo-50' : 'bg-white',
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="block truncate text-[12px] leading-none font-semibold text-slate-800">
                            {meta.city}
                          </span>
                          {isHome && (
                            <span className="rounded-md bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-800">
                              Home
                            </span>
                          )}
                        </div>
                        <span className="mt-1 block text-[11px] text-slate-500">
                          {abbreviation ? `${abbreviation} ` : ''}
                          {offsetLabel}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {new Intl.DateTimeFormat('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: search.hourFormat !== '24',
                            timeZone: zone,
                          }).format(new Date(nowTimestamp))}
                        </span>
                      </div>
                      {!isHome && (
                        <div className="flex shrink-0 gap-3">
                          <button
                            className={rowActionClassName}
                            type="button"
                            aria-label={`Set ${meta.city} as home`}
                            onClick={() => setHome(zone)}
                          >
                            <HomeIcon className="size-5" aria-hidden="true" />
                          </button>
                          <button
                            className={cn(
                              rowActionClassName,
                              'disabled:pointer-events-none disabled:opacity-40',
                            )}
                            type="button"
                            aria-label={`Remove ${meta.city}`}
                            disabled={search.zones.length <= 1}
                            onClick={() => removeZone(zone)}
                          >
                            <XMarkIcon className="size-5" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>

                    {SLOT_MARKERS.map((minute) => {
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
                      const toneClass = tickToneClass(todClass, weekendCell)
                      const isCurrentHour =
                        isToday && nowMinute >= minute && nowMinute < minute + SLOT_STEP

                      return (
                        <div
                          className={cn(
                            'grid min-h-[34px] place-items-center border-r border-b border-slate-100 py-0.5 text-center',
                            toneClass,
                            selected && '!bg-blue-100',
                            isCurrentHour &&
                              'font-semibold text-indigo-800 ring-1 ring-indigo-300 ring-inset',
                          )}
                          key={`${zone}-${minute}`}
                        >
                          {isBoundary ? (
                            <>
                              <span className="text-[10px] leading-none text-slate-600">
                                {currentDate.weekday}
                              </span>
                              <span className="text-[11px] leading-none font-semibold text-slate-700">
                                {currentDate.month}
                              </span>
                              <span className="text-[11px] leading-none text-slate-700">
                                {currentDate.day}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-[13px] leading-none font-bold text-slate-800">
                                {local.hour}
                              </span>
                              <span className="text-[10px] leading-none text-slate-500">
                                {local.period}
                              </span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </MotionDiv>
                )
              })}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </div>
    </section>
  )
}
