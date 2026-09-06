import { ClipboardDocumentIcon } from '@heroicons/react/16/solid'
import { AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/catalyst/button'
import { MotionSpan } from '@/components/shared/motion'
import { useAppSearch, useSortedZones } from '@/hooks/use-app-search'
import { useUiMotion } from '@/hooks/use-ui-motion'
import { formatMeetingCopy } from '@/lib/meeting-copy'

export function SelectedRangeCard() {
  const search = useAppSearch()
  const sortedZones = useSortedZones()
  const [copied, setCopied] = useState(false)
  const { duration } = useUiMotion()
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
        color="indigo"
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
    </section>
  )
}
