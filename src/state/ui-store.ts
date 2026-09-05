import { create } from "zustand"

export type DragMode = "create" | "resize-start" | "resize-end"

export type DragState = {
  mode: DragMode
  anchor: number
}

type UiStore = {
  query: string
  dragState: DragState | null
  nowTimestamp: number
  setQuery: (query: string) => void
  setDragState: (dragState: DragState | null) => void
  setNowTimestamp: (timestamp: number) => void
}

export const useUiStore = create<UiStore>((set) => ({
  query: "",
  dragState: null,
  nowTimestamp: Date.now(),
  setQuery: (query) => set({ query }),
  setDragState: (dragState) => set({ dragState }),
  setNowTimestamp: (nowTimestamp) => set({ nowTimestamp }),
}))
