import { create } from 'zustand'

type DragMode = 'create' | 'resize-start' | 'resize-end'

type DragState = {
  mode: DragMode
  anchor: number
}

type UiStore = {
  query: string
  dragState: DragState | null
  nowTimestamp: number
  actions: {
    setQuery: (query: string) => void
    setDragState: (dragState: DragState | null) => void
    setNowTimestamp: (timestamp: number) => void
  }
}

const useUiStore = create<UiStore>()((set) => ({
  query: '',
  dragState: null,
  nowTimestamp: Date.now(),
  actions: {
    setQuery: (query) => set({ query }),
    setDragState: (dragState) => set({ dragState }),
    setNowTimestamp: (nowTimestamp) => set({ nowTimestamp }),
  },
}))

export const useSearchQuery = () => useUiStore((state) => state.query)
export const useDragState = () => useUiStore((state) => state.dragState)
export const useNowTimestamp = () => useUiStore((state) => state.nowTimestamp)
export const useUiActions = () => useUiStore((state) => state.actions)
