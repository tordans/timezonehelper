import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useEffect, useState } from 'react'
import { MotionButton, MotionLi, MotionSpan } from '@/components/shared/motion'
import { useAppSearch, useSearchActions, useSortedZones } from '@/hooks/use-app-search'
import { useUiMotion } from '@/hooks/use-ui-motion'
import { formatMeetingCopy } from '@/lib/meeting-copy'
import type { HourFormat } from '@/lib/time'
import {
  addDaysIso,
  formatDurationMinutes,
  formatTimestampForZone,
  parseMinute,
  todayInZone,
  toTimestampFromHome,
  zoneAbbreviation,
} from '@/lib/time'
import { getZoneMeta } from '@/lib/zone-meta'

const HOUR_FORMATS = ['12', '24', 'mx'] as const

const controlButtonClassName =
  'min-h-11 cursor-pointer touch-manipulation select-none rounded-md border border-slate-300 bg-slate-50 px-3 text-sm active:bg-indigo-100 hover-fine:bg-indigo-50 disabled:pointer-events-none disabled:opacity-40'

function isHourFormat(value: string): value is HourFormat {
  return (HOUR_FORMATS as readonly string[]).includes(value)
}

export function ControlsCard() {
  const search = useAppSearch()
  const sortedZones = useSortedZones()
  const { updateSearchPatch } = useSearchActions()
  const [copied, setCopied] = useState(false)
  const { duration, prefersReducedMotion } = useUiMotion()

  const startMinute = parseMinute(search.start)
  const endMinute = parseMinute(search.end)
  const startTimestamp = toTimestampFromHome(search.date, search.home, startMinute)
  const endTimestamp = toTimestampFromHome(search.date, search.home, endMinute)
  const durationLabel = formatDurationMinutes(endMinute - startMinute)
  const copyText = formatMeetingCopy({
    date: search.date,
    start: search.start,
    end: search.end,
    home: search.home,
    zones: sortedZones,
    hourFormat: search.hourFormat,
  })

  useEffect(
    function clearCopiedConfirmation() {
      if (!copied) {
        return
      }

      const timeoutId = window.setTimeout(() => {
        setCopied(false)
      }, 2000)

      return function cancelCopiedConfirmation() {
        window.clearTimeout(timeoutId)
      }
    },
    [copied],
  )

  async function copyTimes() {
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1 text-sm font-medium text-slate-800">
          Date
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`${controlButtonClassName} min-w-11`}
              type="button"
              onClick={() => updateSearchPatch({ date: addDaysIso(search.date, search.home, -1) })}
            >
              Prev
            </button>
            <input
              className="min-h-11 rounded-md border border-slate-300 bg-white px-2.5 text-base"
              type="date"
              value={search.date}
              onChange={(event) => updateSearchPatch({ date: event.target.value })}
            />
            <button
              className={controlButtonClassName}
              type="button"
              onClick={() => updateSearchPatch({ date: todayInZone(search.home) })}
            >
              Today
            </button>
            <button
              className={`${controlButtonClassName} min-w-11`}
              type="button"
              onClick={() => updateSearchPatch({ date: addDaysIso(search.date, search.home, 1) })}
            >
              Next
            </button>
          </div>
        </div>

        <label className="grid gap-1 text-sm font-medium text-slate-800">
          Hour format
          <select
            className="min-h-11 cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 text-base"
            value={search.hourFormat}
            onChange={(event) => {
              if (isHourFormat(event.target.value)) {
                updateSearchPatch({ hourFormat: event.target.value })
              }
            }}
          >
            <option value="mx">Mixed (MX)</option>
            <option value="12">12-hour</option>
            <option value="24">24-hour</option>
          </select>
        </label>

        <div className="ml-auto grid text-right">
          <span className="text-sm text-slate-700">Selected range</span>
          <strong className="text-base font-semibold text-slate-900">
            {search.start}–{search.end}
          </strong>
          <span className="text-sm text-slate-600">Duration {durationLabel}</span>
        </div>

        <MotionButton
          className={controlButtonClassName}
          type="button"
          onClick={() => void copyTimes()}
        >
          <AnimatePresence mode="wait" initial={false}>
            <MotionSpan
              key={copied ? 'copied' : 'copy'}
              className="inline-block"
              initial={{ opacity: 0, scale: copied ? 0.96 : 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration }}
            >
              {copied ? 'Copied' : 'Copy times'}
            </MotionSpan>
          </AnimatePresence>
        </MotionButton>
      </div>

      <p className="text-xs text-slate-500">Mixed uses each location’s usual 12/24 format.</p>

      <LayoutGroup>
        <ul className="grid gap-0.5 text-sm text-slate-700">
          <AnimatePresence initial={false}>
            {sortedZones.map((zone) => {
              const meta = getZoneMeta(zone)
              const localStart = formatTimestampForZone(startTimestamp, zone, search.hourFormat)
              const localEnd = formatTimestampForZone(endTimestamp, zone, search.hourFormat)
              const abbreviation = zoneAbbreviation(startTimestamp, zone)
              const isHome = zone === search.home

              return (
                <MotionLi
                  className="flex justify-between gap-4"
                  key={zone}
                  layout={prefersReducedMotion ? false : 'position'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration }}
                >
                  <span>
                    {meta.city}
                    {isHome ? ' (home)' : ''}
                  </span>
                  <span>
                    {localStart}–{localEnd}
                    {abbreviation ? ` ${abbreviation}` : ''}
                  </span>
                </MotionLi>
              )
            })}
          </AnimatePresence>
        </ul>
      </LayoutGroup>

      <p className="text-xs text-slate-500">Hold Shift while dragging for 5-minute precision.</p>
    </section>
  )
}
