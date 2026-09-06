import { useEffect } from 'react'
import { useAppSearch, useSearchActions } from '@/hooks/use-app-search'
import { resolveBrowserTimeZone } from '@/lib/browser-timezone'
import { useBrowserHomeApplied, useSkipBrowserZoneAutoAdd, useUiActions } from '@/state/ui-store'

export function useBrowserHomeZone() {
  const search = useAppSearch()
  const { updateSearchPatch } = useSearchActions()
  const skipBrowserZoneAutoAdd = useSkipBrowserZoneAutoAdd()
  const browserHomeApplied = useBrowserHomeApplied()
  const { markBrowserHomeApplied } = useUiActions()

  useEffect(
    function syncBrowserTimezoneHome() {
      if (skipBrowserZoneAutoAdd || browserHomeApplied) {
        return
      }

      const browserZone = resolveBrowserTimeZone()
      if (!browserZone) {
        markBrowserHomeApplied()
        return
      }

      const alreadyListed = search.zones.includes(browserZone)
      const shouldAdd = !alreadyListed
      const shouldSetHome = search.home !== browserZone

      if (!shouldAdd && !shouldSetHome) {
        markBrowserHomeApplied()
        return
      }

      markBrowserHomeApplied(shouldAdd ? browserZone : undefined)
      updateSearchPatch({
        zones: shouldAdd ? [...search.zones, browserZone] : search.zones,
        home: shouldSetHome ? browserZone : search.home,
      })
    },
    [
      browserHomeApplied,
      markBrowserHomeApplied,
      search.home,
      search.zones,
      skipBrowserZoneAutoAdd,
      updateSearchPatch,
    ],
  )
}
