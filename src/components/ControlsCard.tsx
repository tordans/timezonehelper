import * as Headless from '@headlessui/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid'
import { Button, TouchTarget } from '@/components/catalyst/button'
import { Field, Fieldset } from '@/components/catalyst/fieldset'
import { Input } from '@/components/catalyst/input'
import {
  ButtonGroup,
  buttonGroupFrameClassName,
  buttonGroupSegmentClassName,
} from '@/components/ui/button-group'
import { CurrentWeekMark, TodayLineMark } from '@/components/ui/grid-legend'
import { InfoHint } from '@/components/ui/info-hint'
import { Tooltip } from '@/components/ui/tooltip'
import { useAppSearch, useSearchActions } from '@/hooks/use-app-search'
import type { HourFormat } from '@/lib/time'
import {
  addDaysIso,
  formatHourCellTooltip,
  formatWeekday,
  todayInZone,
  toTimestampFromHome,
} from '@/lib/time'

const HOUR_FORMAT_OPTIONS = [
  { value: 'mx', label: 'Mixed' },
  { value: '12', label: '12h' },
  { value: '24', label: '24h' },
] as const satisfies ReadonlyArray<{ value: HourFormat; label: string }>

export function ControlsCard() {
  const search = useAppSearch()
  const { updateSearchPatch } = useSearchActions()
  const weekdayShort = formatWeekday(search.date, 'short')
  const weekdayLong = formatWeekday(search.date, 'long')
  const isToday = search.date === todayInZone(search.home)
  const previousDateIso = addDaysIso(search.date, search.home, -1)
  const nextDateIso = addDaysIso(search.date, search.home, 1)
  const previousDateLabel = formatHourCellTooltip(
    toTimestampFromHome(previousDateIso, search.home, 12 * 60),
    search.home,
  ).headline
  const nextDateLabel = formatHourCellTooltip(
    toTimestampFromHome(nextDateIso, search.home, 12 * 60),
    search.home,
  ).headline

  return (
    <Fieldset>
      <div className="flex flex-wrap items-end gap-4">
        <Field>
          <div className="flex flex-nowrap items-center gap-2">
            <Button
              outline
              type="button"
              aria-label="Today"
              aria-current={isToday ? 'date' : undefined}
              disabled={isToday}
              className={isToday ? 'cursor-help!' : undefined}
              onClick={() => updateSearchPatch({ date: todayInZone(search.home) })}
            >
              <span className="inline-flex items-center gap-1.5">
                Today
                <TodayLineMark />
                <span className="font-normal text-zinc-400">/</span>
                Current Week
                <CurrentWeekMark />
              </span>
            </Button>
            <span className="relative w-fit">
              <Input
                className="w-fit! [&_input]:field-sizing-content [&_input]:w-auto [&_input]:pl-[calc(3ch+--spacing(6))] sm:[&_input]:pl-[calc(3ch+--spacing(5))]"
                type="date"
                aria-label={weekdayLong ? `Date, ${weekdayLong}` : 'Date'}
                value={search.date}
                onChange={(event) => updateSearchPatch({ date: event.target.value })}
              />
              {weekdayShort ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-[calc(--spacing(3.5)-1px)] z-10 -translate-y-1/2 text-sm/6 font-medium text-zinc-500 sm:left-[calc(--spacing(3)-1px)]"
                >
                  {weekdayShort}
                </span>
              ) : null}
            </span>
            <div className={buttonGroupFrameClassName()} role="group" aria-label="Change date">
              <Tooltip content={previousDateLabel}>
                <Headless.Button
                  type="button"
                  aria-label={`Previous day, ${previousDateLabel}`}
                  className={buttonGroupSegmentClassName({ isFirst: true, isLast: false })}
                  onClick={() => updateSearchPatch({ date: previousDateIso })}
                >
                  <TouchTarget>
                    <ChevronLeftIcon className="size-4" aria-hidden="true" />
                  </TouchTarget>
                </Headless.Button>
              </Tooltip>
              <Tooltip className="-ml-px inline-flex" content={nextDateLabel}>
                <Headless.Button
                  type="button"
                  aria-label={`Next day, ${nextDateLabel}`}
                  className={buttonGroupSegmentClassName({ isFirst: false, isLast: true })}
                  onClick={() => updateSearchPatch({ date: nextDateIso })}
                >
                  <TouchTarget>
                    <ChevronRightIcon className="size-4" aria-hidden="true" />
                  </TouchTarget>
                </Headless.Button>
              </Tooltip>
            </div>
          </div>
        </Field>

        <Field>
          <div className="flex items-center gap-1">
            <ButtonGroup
              aria-label="Hour format"
              value={search.hourFormat}
              options={HOUR_FORMAT_OPTIONS}
              onChange={(hourFormat) => updateSearchPatch({ hourFormat })}
            />
            <InfoHint label="Hour format">Mixed uses each location's usual 12/24 format.</InfoHint>
          </div>
        </Field>
      </div>
    </Fieldset>
  )
}
