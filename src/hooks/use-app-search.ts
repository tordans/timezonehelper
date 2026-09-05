import { useNavigate, useSearch } from "@tanstack/react-router"
import { useMemo } from "react"

import { normalizeSearch } from "../lib/search"
import { sortZonesByOffset } from "../lib/time"

export function useAppSearch() {
  const rawSearch = useSearch({ from: "/" })
  return normalizeSearch(rawSearch)
}

export function useSortedZones() {
  const search = useAppSearch()

  return useMemo(() => {
    if (search.sort !== "offset") {
      return search.zones
    }

    return sortZonesByOffset(search.zones, search.home, search.date)
  }, [search.date, search.home, search.sort, search.zones])
}

export function useSearchActions() {
  const navigate = useNavigate({ from: "/" })
  const search = useAppSearch()

  function updateSearchPatch(patch: Partial<typeof search>) {
    void navigate({
      search: (prev) => {
        const next = normalizeSearch({
          ...prev,
          ...patch,
        })

        if (next.sort === "offset") {
          next.zones = sortZonesByOffset(next.zones, next.home, next.date)
        }

        return next
      },
      replace: true,
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

    const zones = search.zones.filter((entry) => entry !== zone)
    const home = zone === search.home ? zones[0] : search.home
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
