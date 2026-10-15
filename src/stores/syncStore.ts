import { create } from 'zustand'

/** Lightweight, non-persisted view of cloud-sync health for the UI. */
export interface SyncStatus {
  pending: number
  failed: number
  flushing: boolean
  online: boolean
  lastError: string
  set: (p: Partial<Omit<SyncStatus, 'set'>>) => void
}

export const useSyncStore = create<SyncStatus>((set) => ({
  pending: 0,
  failed: 0,
  flushing: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  lastError: '',
  set: (p) => set(p),
}))
