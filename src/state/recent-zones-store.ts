import { create } from 'zustand'
import { parseRecentZones, rememberRecentZone, RECENT_ZONES_STORAGE_KEY } from '@/lib/recent-zones'

type RecentZonesStore = {
  zones: string[]
  actions: {
    rememberZone: (zone: string) => void
  }
}

function readRecentZones() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    return parseRecentZones(window.localStorage.getItem(RECENT_ZONES_STORAGE_KEY))
  } catch {
    return []
  }
}

function writeRecentZones(zones: string[]) {
  try {
    window.localStorage.setItem(RECENT_ZONES_STORAGE_KEY, JSON.stringify(zones))
  } catch {
    // Private mode or quota. Keep the in-memory list anyway.
  }
}

const useRecentZonesStore = create<RecentZonesStore>()((set) => ({
  zones: readRecentZones(),
  actions: {
    rememberZone: (zone) => {
      set((state) => {
        const zones = rememberRecentZone(state.zones, zone)
        if (zones === state.zones) {
          return state
        }

        writeRecentZones(zones)
        return { zones }
      })
    },
  },
}))

export const useRecentZones = () => useRecentZonesStore((state) => state.zones)
export const useRecentZonesActions = () => useRecentZonesStore((state) => state.actions)

export function clearLocalSiteData() {
  try {
    window.localStorage.clear()
  } catch {
    // Private mode.
  }

  useRecentZonesStore.setState({ zones: [] })
}
