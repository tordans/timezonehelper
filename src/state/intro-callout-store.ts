import { z } from 'zod'
import { create } from 'zustand'

const STORAGE_KEY = 'timezonehelper-intro-callout'

const introCalloutPersistSchema = z.object({
  state: z.object({
    dismissed: z.boolean(),
  }),
})

type IntroCalloutStore = {
  dismissed: boolean
  actions: {
    dismissIntroCallout: () => void
  }
}

function readDismissed(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === '1') {
      return true
    }

    if (!raw) {
      return false
    }

    const parsed = introCalloutPersistSchema.safeParse(JSON.parse(raw))
    return parsed.success && parsed.data.state.dismissed
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
