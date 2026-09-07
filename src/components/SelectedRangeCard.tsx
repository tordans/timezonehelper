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
      className="flex w-full min-w-0 items-start gap-3"
    >
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
        className="max-w-100 min-w-0 cursor-text text-sm/6 whitespace-pre-line text-zinc-950"
      >
        {copyText}
      </p>
      {changes.length > 0 && (
        <>
          <div className="w-px self-stretch bg-zinc-950/10" aria-hidden="true" />
          <div className="flex min-w-0 items-start gap-3">
            <SunIcon
              className="mt-2 size-5 shrink-0 text-orange-600 sm:mt-2.5 sm:size-4"
              aria-hidden="true"
            />
            <p
              aria-label="Upcoming daylight saving"
              className="max-w-100 min-w-0 text-sm/6 whitespace-pre-line text-zinc-950"
            >
              {formatDstWarningLines(changes, nowTimestamp, search.home)}
            </p>
          </div>
        </>
      )}
    </section>
  )
}
