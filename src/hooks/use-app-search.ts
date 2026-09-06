import { getRouteApi, useNavigate } from '@tanstack/react-router'
import type { AppSearch } from '@/lib/search'
import { appSearchSchema } from '@/lib/search'
import { sortZonesByOffset } from '@/lib/time'
import { markTimeRangeCommitted, useAutoAddedZone, useUiActions } from '@/state/ui-store'

const indexRouteApi = getRouteApi('/')

type SearchNavigateOptions = {
  replace?: boolean
  resetScroll?: boolean
}

/** In-place search writes: replace history and keep scroll (filters, date, drag). */
const filterSearchNavigateDefaults = {
  replace: true,
  resetScroll: false,
} satisfies SearchNavigateOptions

export function useAppSearch() {
  return indexRouteApi.useSearch()
}

export function useSortedZones() {
  const search = useAppSearch()
  return sortZonesByOffset(search.zones, search.home, search.date)
}

export function useSearchActions() {
  const navigate = useNavigate({ from: '/' })
  const search = useAppSearch()
  const autoAddedZone = useAutoAddedZone()
  const { dismissBrowserZoneAutoAdd } = useUiActions()

  function updateSearchPatch(patch: Partial<AppSearch>, options?: SearchNavigateOptions) {
    const { replace, resetScroll } = { ...filterSearchNavigateDefaults, ...options }

    if (patch.start !== undefined || patch.end !== undefined) {
      markTimeRangeCommitted()
    }

    void navigate({
      search: (prev: AppSearch) => {
        const next: Record<string, unknown> = { ...prev }

        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) {
            delete next[key]
          } else {
            next[key] = value
          }
        }

        return appSearchSchema.parse(next)
      },
      replace,
      resetScroll,
    })
  }

  function addZone(zone: string) {
    if (search.zones.includes(zone)) {
      return
    }

    updateSearchPatch({
      zones: [...search.zones, zone],
    })
  }

  function removeZone(zone: string) {
    if (search.zones.length <= 1) {
      return
    }

    if (zone === autoAddedZone) {
      dismissBrowserZoneAutoAdd()
    }

    const zones = search.zones.filter((entry) => entry !== zone)
    const home = zone === search.home ? (zones[0] ?? search.home) : search.home
    updateSearchPatch({ zones, home })
  }

  function setHome(zone: string) {
    updateSearchPatch({ home: zone })
  }

  return {
    updateSearchPatch,
    addZone,
    removeZone,
    setHome,
  }
}
