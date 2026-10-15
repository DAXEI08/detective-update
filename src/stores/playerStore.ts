import { create } from 'zustand'
import type { CaseDefinition, CaseProgress, CaseResult, PersistedState, PlayerProfile, Settings } from '../types'
import { emptyPlayer, emptyState, sanitizeState } from '../services/persistence/schema'
import { loadJSON, saveJSON, STATE_KEY, storage, SESSION_KEY } from '../services/persistence/storage'
import { evaluateAchievements } from '../engine/achievementsEngine'
import { uid } from '../utils/format'
import { CASES } from '../data/cases'

interface PlayerState extends PersistedState {
  createPlayer: (name: string, className: string) => string
  selectPlayer: (id: string) => void
  signOut: () => void
  deletePlayer: (id: string) => void
  markTutorialDone: () => void
  recordResult: (result: Omit<CaseResult, 'firstClear'>, def: CaseDefinition) => { result: CaseResult; newAchievements: string[] }
  setSettings: (s: Partial<Settings>) => void
  resetAll: () => void
  resetActiveProgress: () => void
}

const initial = sanitizeState(loadJSON(STATE_KEY))

function snapshot(s: PlayerState): PersistedState {
  return { version: 1, activePlayerId: s.activePlayerId, players: s.players, settings: s.settings }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initial,

  createPlayer: (name, className) => {
    const id = uid('p')
    const p = emptyPlayer(id, name.trim().slice(0, 40), className.trim().slice(0, 20))
    set((s) => ({ players: { ...s.players, [id]: p }, activePlayerId: id }))
    return id
  },
  selectPlayer: (id) => { if (get().players[id]) set({ activePlayerId: id }) },
  signOut: () => set({ activePlayerId: null }),
  deletePlayer: (id) =>
    set((s) => {
      const players = { ...s.players }
      delete players[id]
      return { players, activePlayerId: s.activePlayerId === id ? null : s.activePlayerId }
    }),
  markTutorialDone: () =>
    set((s) => {
      const id = s.activePlayerId
      if (!id || !s.players[id]) return s
      return { players: { ...s.players, [id]: { ...s.players[id], tutorialDone: true } } }
    }),

  recordResult: (partial, def) => {
    const s = get()
    const id = s.activePlayerId
    const player = id ? s.players[id] : undefined
    if (!id || !player) return { result: { ...partial, firstClear: false }, newAchievements: [] }

    const prev: CaseProgress | undefined = player.progress[def.id]
    const result: CaseResult = { ...partial, firstClear: !prev?.completed }
    const progress: CaseProgress = {
      caseId: def.id,
      completed: true,
      stars: Math.max(prev?.stars ?? 0, result.stars),
      bestXp: Math.max(prev?.bestXp ?? 0, result.xp),
      bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, result.accuracy),
      bestTimeMs: prev?.bestTimeMs == null ? result.timeMs : Math.min(prev.bestTimeMs, result.timeMs),
      attempts: (prev?.attempts ?? 0) + 1,
      lastPlayedAt: result.at,
      lastResult: result,
    }
    const vocabStats = { ...player.vocabStats }
    Object.entries(result.vocab).forEach(([k, v]) => {
      const cur = vocabStats[k] ?? { c: 0, w: 0 }
      vocabStats[k] = { c: cur.c + v.c, w: cur.w + v.w }
    })
    const next: PlayerProfile = {
      ...player,
      progress: { ...player.progress, [def.id]: progress },
      vocabStats,
      totals: {
        attempts: player.totals.attempts + 1,
        correct: player.totals.correct + result.correct,
        mistakes: player.totals.mistakes + result.mistakes,
        hints: player.totals.hints + result.hints,
        timeMs: player.totals.timeMs + result.timeMs,
      },
      results: [...player.results, result].slice(-100),
    }
    const newAchievements = evaluateAchievements(next, result, def)
    newAchievements.forEach((a) => { next.achievements = { ...next.achievements, [a]: Date.now() } })
    set({ players: { ...s.players, [id]: next } })
    return { result, newAchievements }
  },

  setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  resetAll: () => {
    storage.remove(SESSION_KEY)
    set({ ...emptyState() })
  },
  resetActiveProgress: () =>
    set((s) => {
      const id = s.activePlayerId
      const p = id ? s.players[id] : undefined
      if (!id || !p) return s
      storage.remove(SESSION_KEY)
      const fresh = emptyPlayer(p.id, p.name, p.className)
      fresh.tutorialDone = p.tutorialDone
      return { players: { ...s.players, [id]: fresh } }
    }),
}))

usePlayerStore.subscribe((s) => saveJSON(STATE_KEY, snapshot(s)))

export function useActivePlayer(): PlayerProfile | null {
  return usePlayerStore((s) => (s.activePlayerId ? s.players[s.activePlayerId] ?? null : null))
}

/** Case n is unlocked when n == 1, the previous case is completed, or demo-unlock is on. */
export function isCaseUnlocked(player: PlayerProfile | null, settings: Settings, def: CaseDefinition): boolean {
  if (settings.demoUnlock) return true
  if (def.number === 1) return true
  const prev = CASES[def.number - 2]
  return Boolean(player && prev && player.progress[prev.id]?.completed)
}
