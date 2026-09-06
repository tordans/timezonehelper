import { create } from 'zustand'

const STORAGE_KEY = 'timezonehelper-intro-callout'

type IntroCalloutStore = {
  dismissed: boolean
  actions: {
    dismissIntroCallout: () => void
  }
}

function readDismissed() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed() {
  try {
    window.localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // Private mode or quota — keep the in-memory dismiss anyway.
  }
}

const useIntroCalloutStore = create<IntroCalloutStore>()((set) => ({
  dismissed: readDismissed(),
  actions: {
    dismissIntroCallout: () => {
      writeDismissed()
      set({ dismissed: true })
    },
  },
}))

export const useIntroCalloutDismissed = () => useIntroCalloutStore((state) => state.dismissed)
export const useIntroCalloutActions = () => useIntroCalloutStore((state) => state.actions)
