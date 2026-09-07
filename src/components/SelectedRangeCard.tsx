import * as Headless from '@headlessui/react'
import { ClipboardDocumentIcon, SunIcon } from '@heroicons/react/16/solid'
import { AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { TouchTarget } from '@/components/catalyst/button'
import { Link } from '@/components/catalyst/link'
import { MotionSpan } from '@/components/shared/motion'
import {
  buttonGroupFrameClassName,
  buttonGroupSegmentClassName,
} from '@/components/ui/button-group'
import { Tooltip } from '@/components/ui/tooltip'
import { useAppSearch, useSortedZones } from '@/hooks/use-app-search'
import { useUiMotion } from '@/hooks/use-ui-motion'
import { buildCalendarExport, downloadIcsFile } from '@/lib/calendar-export'
import { formatDstWarningLines, upcomingDstChanges } from '@/lib/dst'
import { useNowTimestamp } from '@/state/ui-store'

export function SelectedRangeCard() {
  const search = useAppSearch()
  const sortedZones = useSortedZones()
  const nowTimestamp = useNowTimestamp()
  const [copied, setCopied] = useState(false)
  const { duration } = useUiMotion()
  const meetingInput = {
    date: search.date,
    start: search.start,
    end: search.end,
    home: search.home,
    zones: sortedZones,
    hourFormat: search.hourFormat,
  }
  const calendarExport = buildCalendarExport(meetingInput)
  const copyText = calendarExport.description
  const changes = upcomingDstChanges(sortedZones, nowTimestamp)
  const copyHeadlineBreak = copyText.indexOf('\n')
  const copyHeadline = copyHeadlineBreak === -1 ? copyText : copyText.slice(0, copyHeadlineBreak)
  const copyBody = copyHeadlineBreak === -1 ? '' : copyText.slice(copyHeadlineBreak + 1)
  const dstBody = formatDstWarningLines(changes, nowTimestamp, search.home)

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
    <section
      aria-labelledby="selected-range-heading"
      className="flex w-full min-w-0 flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:gap-8"
    >
      <div className="flex min-w-0 flex-1 basis-0 items-start gap-3">
        <span className="flex h-6 shrink-0 items-center text-orange-600">
          <ClipboardDocumentIcon className="size-5 sm:size-4" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
          <p
            aria-label="Times by location"
            className="w-full min-w-0 cursor-text text-sm/6 whitespace-pre-line text-zinc-950"
          >
            <span className="font-semibold">{copyHeadline}</span>
            {copyBody ? `\n${copyBody}` : null}
          </p>
          <div className={buttonGroupFrameClassName()} role="group" aria-label="Share meeting">
            <Headless.Button
              type="button"
              className={buttonGroupSegmentClassName({ isFirst: true, isLast: false })}
              onClick={() => void copyTimes()}
            >
              <TouchTarget>
                <AnimatePresence mode="wait" initial={false}>
                  <MotionSpan
                    key={copied ? 'copied' : 'copy'}
                    className="inline-block"
                    initial={{ opacity: 0, scale: copied ? 0.96 : 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </MotionSpan>
                </AnimatePresence>
              </TouchTarget>
            </Headless.Button>
            <Link
              className={buttonGroupSegmentClassName({ isFirst: false, isLast: false })}
              href={calendarExport.googleCalendarUrl}
              rel="noreferrer"
              target="_blank"
            >
              <TouchTarget>Google Calendar</TouchTarget>
            </Link>
            <Tooltip
              className="-ml-px inline-flex"
              content="Opens in Outlook, Apple Calendar, and other calendar apps."
            >
              <Headless.Button
                type="button"
                className={buttonGroupSegmentClassName({ isFirst: false, isLast: true })}
                onClick={() => downloadIcsFile(calendarExport.icsText, calendarExport.icsFilename)}
              >
                <TouchTarget>iCal</TouchTarget>
              </Headless.Button>
            </Tooltip>
          </div>
        </div>
      </div>
      {changes.length > 0 && (
        <>
          <div
            className="h-px w-full bg-zinc-950/10 sm:h-auto sm:w-px sm:self-stretch"
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-1 basis-0 items-start gap-3">
            <span className="flex h-6 shrink-0 items-center text-orange-600">
              <SunIcon className="size-5 sm:size-4" aria-hidden="true" />
            </span>
            <p
              aria-label="Upcoming daylight saving"
              className="min-w-0 flex-1 cursor-text text-sm/6 whitespace-pre-line text-zinc-950"
            >
              <span className="font-semibold">Heads-up for daylight saving changes</span>
              {dstBody ? `\n${dstBody}` : null}
            </p>
          </div>
        </>
      )}
    </section>
  )
}
