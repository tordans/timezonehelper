import { useSyncExternalStore } from 'react'

const FINE_HOVER_QUERY = '(hover: hover) and (pointer: fine)'

function subscribeToFineHover(onStoreChange: () => void) {
  const media = window.matchMedia(FINE_HOVER_QUERY)
  media.addEventListener('change', onStoreChange)
  return function unsubscribeFromFineHover() {
    media.removeEventListener('change', onStoreChange)
  }
}

function getFineHoverSnapshot() {
  return window.matchMedia(FINE_HOVER_QUERY).matches
}

function getFineHoverServerSnapshot() {
  return false
}

export function usePrefersFineHover() {
  return useSyncExternalStore(
    subscribeToFineHover,
    getFineHoverSnapshot,
    getFineHoverServerSnapshot,
  )
}
