import { AnimatePresence } from 'motion/react'
import { useState, type KeyboardEvent } from 'react'
import { MotionLi, MotionP, MotionUl } from '@/components/shared/motion'
import { useAppSearch, useSearchActions } from '@/hooks/use-app-search'
import { useUiMotion } from '@/hooks/use-ui-motion'
import { cn } from '@/lib/cn'
import { useTimezoneSearch } from '@/lib/timezone-search'
import { useSearchQuery, useUiActions } from '@/state/ui-store'

const LISTBOX_ID = 'zone-search-results'

const resultButtonClassName =
  'flex min-h-11 w-full cursor-pointer touch-manipulation select-none items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-sm active:bg-indigo-100 hover-fine:bg-indigo-50 disabled:pointer-events-none disabled:opacity-50'

export function ZoneSearchCard() {
  const query = useSearchQuery()
  const { setQuery } = useUiActions()
  const results = useTimezoneSearch(query)
  const search = useAppSearch()
  const { addZone } = useSearchActions()
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const { duration, prefersReducedMotion } = useUiMotion()
  const trimmedQuery = query.trim()
  const showHint = trimmedQuery.length === 1
  const showResults = trimmedQuery.length >= 2
  const listOpen = showHint || showResults
  const addedZones = new Set(search.zones)
  const activeIndex = results.length === 0 ? 0 : Math.min(highlightedIndex, results.length - 1)
  const activeOptionId =
    showResults && results[activeIndex] ? `zone-option-${activeIndex}` : undefined

  function addZoneAndResetQuery(zone: string) {
    if (addedZones.has(zone)) {
      return
    }

    addZone(zone)
    setQuery('')
    setHighlightedIndex(0)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setHighlightedIndex(0)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      if (results.length === 0) {
        return
      }

      event.preventDefault()
      setHighlightedIndex((current) => (current + 1) % results.length)
      return
    }

    if (event.key === 'ArrowUp') {
      if (results.length === 0) {
        return
      }

      event.preventDefault()
      setHighlightedIndex((current) => (current - 1 + results.length) % results.length)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const candidate = results[activeIndex] ?? results[0]
      if (!candidate || addedZones.has(candidate.zone)) {
        return
      }

      addZoneAndResetQuery(candidate.zone)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setQuery('')
      setHighlightedIndex(0)
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="grid w-full gap-1 text-sm font-medium text-slate-800">
        Add timezone
        <input
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-base"
          type="text"
          role="combobox"
          value={query}
          placeholder="City, abbreviation, or IANA zone"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={showResults ? LISTBOX_ID : undefined}
          aria-activedescendant={activeOptionId}
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </label>

      <AnimatePresence mode="wait">
        {showHint ? (
          <MotionP
            key="hint"
            className="mt-3 text-sm text-slate-500"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1], y: [6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
          >
            Type at least 2 characters
          </MotionP>
        ) : showResults ? (
          <MotionUl
            key="results"
            className="mt-3 grid max-h-64 gap-1.5 overflow-auto"
            role="listbox"
            id={LISTBOX_ID}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1], y: [6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
          >
            <AnimatePresence>
              {results.length === 0 && (
                <MotionLi
                  key="empty"
                  className="text-slate-500"
                  role="presentation"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: [0, 1], y: [6, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration }}
                >
                  No matches found
                </MotionLi>
              )}
              {results.map((result, index) => {
                const alreadyAdded = addedZones.has(result.zone)
                const isHighlighted = index === activeIndex

                return (
                  <MotionLi
                    key={result.zone}
                    role="presentation"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: [0, 1], y: [8, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration,
                      delay: prefersReducedMotion ? 0 : Math.min(index, 6) * 0.04,
                    }}
                  >
                    <button
                      className={cn(resultButtonClassName, isHighlighted && 'bg-indigo-50')}
                      type="button"
                      role="option"
                      id={`zone-option-${index}`}
                      aria-selected={isHighlighted}
                      aria-disabled={alreadyAdded}
                      disabled={alreadyAdded}
                      onPointerMove={() => setHighlightedIndex(index)}
                      onClick={() => addZoneAndResetQuery(result.zone)}
                    >
                      <span>{result.label}</span>
                      <span className="text-xs text-slate-500">
                        {alreadyAdded ? 'Added' : result.zone}
                      </span>
                    </button>
                  </MotionLi>
                )
              })}
            </AnimatePresence>
          </MotionUl>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
