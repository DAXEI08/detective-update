/**
 * Persistence abstraction. Today: localStorage with an in-memory fallback (private mode, quota, SSR/tests).
 * To move to IndexedDB later, only this module needs to change (keep the same read/write/remove surface).
 */
const memory = new Map<string, string>()
let cached: Storage | null | undefined

function ls(): Storage | null {
  if (cached !== undefined) return cached
  try {
    const t = '__ad_probe__'
    window.localStorage.setItem(t, t)
    window.localStorage.removeItem(t)
    cached = window.localStorage
  } catch {
    cached = null
  }
  return cached
}

export const storage = {
  get(key: string): string | null {
    try {
      const s = ls()
      return s ? s.getItem(key) : memory.get(key) ?? null
    } catch {
      return memory.get(key) ?? null
    }
  },
  set(key: string, value: string): void {
    try {
      const s = ls()
      if (s) s.setItem(key, value)
      else memory.set(key, value)
    } catch {
      memory.set(key, value)
    }
  },
  remove(key: string): void {
    try {
      ls()?.removeItem(key)
    } catch { /* ignore */ }
    memory.delete(key)
  },
}

export function loadJSON(key: string): unknown {
  const raw = storage.get(key)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    storage.remove(key) // corrupted → drop it instead of crashing
    return null
  }
}
export function saveJSON(key: string, value: unknown): void {
  try {
    storage.set(key, JSON.stringify(value))
  } catch { /* quota / serialisation errors are non-fatal */ }
}
export const STATE_KEY = 'arabic-detective:v1:state'
export const SESSION_KEY = 'arabic-detective:v1:session'
