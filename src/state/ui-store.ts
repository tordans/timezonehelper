import { z } from 'zod'
import { create } from 'zustand'

const urlTimeRangeSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
})

type DragMode = 'create' | 'resize-start' | 'resize-end'

type DragState = {
  mode: DragMode
  anchor: number
}

type UiStore = {
  query: string
  dragState: DragState | null
  nowTimestamp: number
  autoAddedZone: string | null
  skipBrowserZoneAutoAdd: boolean
  browserHomeApplied: boolean
  hasCommittedTimeRange: boolean
  actions: {
    setQuery: (query: string) => void
    setDragState: (dragState: DragState | null) => void
    setNowTimestamp: (timestamp: number) => void
    markBrowserHomeApplied: (autoAddedZone?: string) => void
    dismissBrowserZoneAutoAdd: () => void
    markTimeRangeCommitted: () => void
  }
}

const useUiStore = create<UiStore>()((set) => ({
  query: '',
  dragState: null,
  nowTimestamp: Date.now(),
  autoAddedZone: null,
  skipBrowserZoneAutoAdd: false,
  browserHomeApplied: false,
  hasCommittedTimeRange: false,
  actions: {
    setQuery: (query) => set({ query }),
    setDragState: (dragState) => set({ dragState }),
    setNowTimestamp: (nowTimestamp) => set({ nowTimestamp }),
    markBrowserHomeApplied: (autoAddedZone) =>
      set((state) => ({
        browserHomeApplied: true,
        autoAddedZone: autoAddedZone ?? state.autoAddedZone,
      })),
    dismissBrowserZoneAutoAdd: () =>
      set({
        skipBrowserZoneAutoAdd: true,
        autoAddedZone: null,
      }),
    markTimeRangeCommitted: () =>
      set((state) => (state.hasCommittedTimeRange ? state : { hasCommittedTimeRange: true })),
  },
}))

export const useSearchQuery = () => useUiStore((state) => state.query)
export const useDragState = () => useUiStore((state) => state.dragState)
export const useNowTimestamp = () => useUiStore((state) => state.nowTimestamp)
export const useAutoAddedZone = () => useUiStore((state) => state.autoAddedZone)
export const useSkipBrowserZoneAutoAdd = () => useUiStore((state) => state.skipBrowserZoneAutoAdd)
export const useBrowserHomeApplied = () => useUiStore((state) => state.browserHomeApplied)
export const useUiActions = () => useUiStore((state) => state.actions)

export function shouldSerializeTimeRange() {
  return useUiStore.getState().hasCommittedTimeRange
}

export function markTimeRangeCommitted() {
  useUiStore.getState().actions.markTimeRangeCommitted()
}

export function rememberTimeRangeFromUrl(search: unknown) {
  const parsed = urlTimeRangeSchema.safeParse(search)
  if (!parsed.success) {
    return
  }

  if (parsed.data.start !== undefined || parsed.data.end !== undefined) {
    markTimeRangeCommitted()
  }
}

export function resetTimeRangeCommitForTests() {
  useUiStore.setState({ hasCommittedTimeRange: false })
}
