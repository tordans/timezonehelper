import { useEffect } from "react"

import { useUiStore } from "../state/ui-store"

export function useClockTick() {
  const setNowTimestamp = useUiStore((state) => state.setNowTimestamp)

  useEffect(
    function synchronizeClockTick() {
      const intervalId = window.setInterval(() => {
        setNowTimestamp(Date.now())
      }, 30_000)

      return () => window.clearInterval(intervalId)
    },
    [setNowTimestamp],
  )
}
