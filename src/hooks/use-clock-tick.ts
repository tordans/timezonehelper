import { useEffect } from 'react'
import { useUiActions } from '@/state/ui-store'

export function useClockTick() {
  const { setNowTimestamp } = useUiActions()

  useEffect(
    function synchronizeClockTick() {
      const intervalId = window.setInterval(() => {
        setNowTimestamp(Date.now())
      }, 30_000)

      return function stopClockTick() {
        window.clearInterval(intervalId)
      }
    },
    [setNowTimestamp],
  )
}
