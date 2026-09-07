import { ClipboardDocumentIcon, SunIcon } from '@heroicons/react/16/solid'
import { AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/catalyst/button'
import { MotionSpan } from '@/components/shared/motion'
import { useAppSearch, useSortedZones } from '@/hooks/use-app-search'
import { useUiMotion } from '@/hooks/use-ui-motion'
import { formatDstWarningLines, upcomingDstChanges } from '@/lib/dst'
import { formatMeetingCopy } from '@/lib/meeting-copy'
import { useNowTimestamp } from '@/state/ui-store'

export function SelectedRangeCard() {
  const search = useAppSearch()
  const sortedZones = useSortedZones()
  const nowTimestamp = useNowTimestamp()
  const [copied, setCopied] = useState(false)
  const { duration } = useUiMotion()
  const changes = upcomingDstChanges(sortedZones, nowTimestamp)
  const copyText = formatMeetingCopy({
    date: search.date,
    start: search.start,
    end: search.end,
    home: search.home,
    zones: sortedZones,
    hourFormat: search.hourFormat,
  })
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
        <Button
          color="orange"
          type="button"
          className="w-fit shrink-0"
          onClick={() => void copyTimes()}
        >
          <ClipboardDocumentIcon data-slot="icon" />
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
        </Button>
        <p
          aria-label="Times by location"
          className="min-w-0 flex-1 cursor-text text-sm/6 whitespace-pre-line text-zinc-950"
        >
          <span className="font-semibold">{copyHeadline}</span>
          {copyBody ? `\n${copyBody}` : null}
        </p>
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
