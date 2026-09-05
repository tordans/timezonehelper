import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"

import { useAppSearch, useSortedZones } from "./use-app-search"

export function useAutosortSync() {
  const navigate = useNavigate({ from: "/" })
  const search = useAppSearch()
  const sortedZones = useSortedZones()

  useEffect(
    function synchronizeAutosortedZonesInUrl() {
      const current = search.zones.join(",")
      const expected = sortedZones.join(",")

      if (current === expected) {
        return
      }

      void navigate({
        search: (prev) => ({
          ...prev,
          zones: sortedZones,
        }),
        replace: true,
      })
    },
    [navigate, search.zones, sortedZones],
  )
}
