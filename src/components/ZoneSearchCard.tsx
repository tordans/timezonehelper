import { MagnifyingGlassIcon } from '@heroicons/react/16/solid'
import { AnimatePresence } from 'motion/react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { Input, InputGroup } from '@/components/catalyst/input'
import { MotionDiv, MotionLi, MotionUl } from '@/components/shared/motion'
import { useAppSearch, useSearchActions } from '@/hooks/use-app-search'
import { useUiMotion } from '@/hooks/use-ui-motion'
import { cn } from '@/lib/cn'
import { useTimezoneSearch } from '@/lib/timezone-search'
import { useSearchQuery, useUiActions } from '@/state/ui-store'

const LISTBOX_ID = 'zone-search-results'

const resultButtonClassName =
  'group/option grid w-full cursor-pointer grid-cols-[1fr_auto] items-baseline gap-x-2 rounded-lg py-2.5 pr-2 pl-3.5 text-left text-base/6 touch-manipulation select-none disabled:cursor-default sm:py-1.5 sm:pr-2 sm:pl-3 sm:text-sm/6'

export function ZoneSearchField() {
  const query = useSearchQuery()
  const { setQuery } = useUiActions()
  const results = useTimezoneSearch(query)
  const search = useAppSearch()
  const { addZone } = useSearchActions()
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
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
    <div className="relative">
      <InputGroup>
        <MagnifyingGlassIcon data-slot="icon" />
        <Input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          placeholder="Add timezone"
          autoComplete="off"
          aria-label="Add timezone"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={showResults ? LISTBOX_ID : undefined}
          aria-activedescendant={activeOptionId}
          className={
            query
              ? '[&_input]:pr-[calc(--spacing(10)-1px)] sm:[&_input]:pr-[calc(--spacing(9)-1px)]'
              : undefined
          }
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
        >
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              className="group absolute inset-y-0 right-0 flex cursor-pointer items-center rounded-r-lg px-2 focus:outline-hidden"
              onClick={() => {
                setQuery('')
                setHighlightedIndex(0)
                inputRef.current?.focus()
              }}
            >
              <svg
                className="size-5 stroke-zinc-500 group-hover:stroke-zinc-700 sm:size-4"
                viewBox="0 0 16 16"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M5 5L11 11M11 5L5 11"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </Input>
      </InputGroup>

      <AnimatePresence mode="wait">
        {showHint ? (
          <MotionDiv
            key="hint"
            className="absolute top-full left-0 z-50 mt-1 w-max max-w-80 rounded-lg bg-white px-3 py-2 text-xs/5 text-zinc-500 shadow-lg ring-1 ring-zinc-950/10"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
          >
            Type at least 2 characters
          </MotionDiv>
        ) : showResults ? (
          <MotionUl
            key="results"
            className="absolute top-full left-0 z-50 mt-1 max-h-64 w-[32rem] max-w-[min(32rem,calc(100vw-3rem))] overflow-y-auto overscroll-contain rounded-xl bg-white p-1 shadow-lg ring-1 ring-zinc-950/10"
            role="listbox"
            id={LISTBOX_ID}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
          >
            <AnimatePresence>
              {results.length === 0 && (
                <MotionLi
                  key="empty"
                  className="px-3.5 py-2.5 text-sm/6 text-zinc-500"
                  role="presentation"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
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
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration,
                      delay: prefersReducedMotion ? 0 : Math.min(index, 6) * 0.04,
                    }}
                  >
                    <button
                      className={cn(
                        resultButtonClassName,
                        isHighlighted
                          ? 'bg-blue-500 text-white'
                          : 'text-zinc-950 active:bg-zinc-950/5',
                        alreadyAdded && 'opacity-50',
                      )}
                      type="button"
                      role="option"
                      id={`zone-option-${index}`}
                      aria-selected={isHighlighted}
                      aria-disabled={alreadyAdded}
                      disabled={alreadyAdded}
                      onPointerMove={() => setHighlightedIndex(index)}
                      onClick={() => addZoneAndResetQuery(result.zone)}
                    >
                      <span className="min-w-0 truncate">{result.label}</span>
                      <span
                        className={cn('text-xs', isHighlighted ? 'text-white/80' : 'text-zinc-500')}
                      >
                        {alreadyAdded ? 'In list' : result.zone}
                      </span>
                    </button>
                  </MotionLi>
                )
              })}
            </AnimatePresence>
          </MotionUl>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
