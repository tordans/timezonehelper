import { Fragment, useRef, type PointerEvent } from 'react'
import { useAppSearch, useSearchActions, useSortedZones } from '@/hooks/use-app-search'
import { cn } from '@/lib/cn'
import { clamp, formatMinute, parseMinute, roundToStep, toTimestampFromHome } from '@/lib/time'
import { useDragState, useNowTimestamp, useUiActions } from '@/state/ui-store'

const SLOT_STEP = 60
const MAX_MINUTE = 24 * 60 - 5
const LABEL_WIDTH = 200
const CELL_WIDTH = 54
const SLOT_MARKERS = Array.from({ length: 24 }, (_, index) => index * SLOT_STEP)

function minuteFromClientX(clientX: number, bounds: DOMRect): number {
  const relativeX = clamp(clientX - bounds.left - LABEL_WIDTH, 0, bounds.width - LABEL_WIDTH)
  const progress = relativeX / (SLOT_MARKERS.length * CELL_WIDTH)
  return clamp(Math.round(progress * 24 * 60), 0, MAX_MINUTE)
}

export function TimezoneTableGrid() {
  const search = useAppSearch()
  const sortedZones = useSortedZones()
  const { setHome, removeZone, updateSearchPatch } = useSearchActions()
  const nowTimestamp = useNowTimestamp()
  const dragState = useDragState()
  const { setDragState } = useUiActions()
  const gridRef = useRef<HTMLDivElement | null>(null)

  const startMinute = parseMinute(search.start)
  const endMinute = parseMinute(search.end)
  const timelineStart = Math.min(startMinute, endMinute)
  const timelineEnd = Math.max(startMinute, endMinute)

  const selectionLeft = LABEL_WIDTH + (timelineStart / SLOT_STEP) * CELL_WIDTH
  const selectionWidth = Math.max(6, ((timelineEnd - timelineStart) / SLOT_STEP) * CELL_WIDTH)

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
    if (search.hourFormat === '24') {
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

  function tickToneClass(todClass: string): string {
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
    event.currentTarget.setPointerCapture(event.pointerId)
    updateSearchPatch({
      start: formatMinute(anchor),
      end: formatMinute(clamp(anchor + step, step, MAX_MINUTE)),
    })
  }

  function startResizeStart(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    setDragState({
      mode: 'resize-start',
      anchor: timelineStart,
    })
  }

  function startResizeEnd(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
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
        ref={gridRef}
        onPointerDown={startDrag}
        onPointerMove={updateSelectionFromPointer}
        onPointerUp={() => setDragState(null)}
      >
        <div
          className="pointer-events-none absolute z-20 flex h-[26px] justify-between rounded-md border border-indigo-700 bg-indigo-500/20"
          style={{ left: `${selectionLeft}px`, width: `${selectionWidth}px` }}
        >
          <div
            className="pointer-events-auto w-2.5 cursor-ew-resize rounded-sm bg-indigo-700"
            onPointerDown={startResizeStart}
          />
          <div
            className="pointer-events-auto w-2.5 cursor-ew-resize rounded-sm bg-indigo-700"
            onPointerDown={startResizeEnd}
          />
        </div>

        <div
          className="grid w-max min-w-full items-stretch"
          style={{
            gridTemplateColumns: `${LABEL_WIDTH}px repeat(${SLOT_MARKERS.length}, ${CELL_WIDTH}px)`,
          }}
        >
          {sortedZones.map((zone) => (
            <Fragment key={zone}>
              <div
                className="sticky left-0 z-30 flex items-center justify-between gap-2 border-r border-b border-slate-200 bg-white px-2.5 py-2"
                key={`label-${zone}`}
              >
                <div>
                  <strong className="block text-[12px] leading-none font-semibold text-slate-800">
                    {zone}
                  </strong>
                  <small className="text-[11px] text-slate-500">
                    {new Intl.DateTimeFormat('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: search.hourFormat !== '24',
                      timeZone: zone,
                    }).format(new Date(nowTimestamp))}
                  </small>
                </div>
                <div className="flex gap-1">
                  <button
                    className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[11px] hover:bg-indigo-50 disabled:opacity-40"
                    type="button"
                    disabled={zone === search.home}
                    onClick={() => setHome(zone)}
                  >
                    Home
                  </button>
                  <button
                    className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[11px] hover:bg-indigo-50 disabled:opacity-40"
                    type="button"
                    disabled={search.zones.length <= 1}
                    onClick={() => removeZone(zone)}
                  >
                    Remove
                  </button>
                </div>
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
                const zoneLabel = zone.split('/').at(-1)?.replace('_', ' ') ?? ''
                const toneClass = tickToneClass(todClass)
                const isSelectedClass = selected ? '!bg-blue-100' : ''
                const boundaryClass = isBoundary ? 'border-r-2 border-r-slate-300' : ''

                return (
                  <div
                    className={cn(
                      'grid min-h-[34px] place-items-center border-r border-b border-slate-100 py-0.5 text-center',
                      toneClass,
                      isSelectedClass,
                      boundaryClass,
                    )}
                    key={`${zone}-${minute}`}
                  >
                    {isBoundary ? (
                      <>
                        <div className="text-[10px] leading-none text-slate-600">
                          {currentDate.weekday}
                        </div>
                        <b className="text-[11px] leading-none font-semibold text-slate-700">
                          {currentDate.month}
                        </b>
                        <i className="text-[11px] leading-none text-slate-700 not-italic">
                          {currentDate.day}
                        </i>
                      </>
                    ) : (
                      <>
                        <b className="text-[13px] leading-none font-bold text-slate-800">
                          {local.hour}
                        </b>
                        <u className="text-[10px] leading-none text-slate-500 no-underline">
                          {local.period}
                        </u>
                        {search.hourFormat !== '24' && (
                          <em className="text-[10px] leading-none text-slate-400 not-italic">
                            {zoneLabel}
                          </em>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
