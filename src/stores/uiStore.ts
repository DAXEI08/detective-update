import { create } from 'zustand'

export interface Toast { id: number; kind: 'info' | 'success' | 'achievement'; title: string; body?: string; ar?: string }
interface UiState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
}
let seq = 1
export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = seq++
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }))
    window.setTimeout(() => get().dismiss(id), t.kind === 'achievement' ? 6000 : 3800)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))
