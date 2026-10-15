import type { CaseProgress, CaseResult, PersistedState, PlayerProfile, Settings, VocabStat } from '../../types'

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
export const num = (x: unknown, d = 0): number => (typeof x === 'number' && Number.isFinite(x) ? x : d)
export const str = (x: unknown, d = ''): string => (typeof x === 'string' ? x : d)
const bool = (x: unknown, d = false): boolean => (typeof x === 'boolean' ? x : d)

export function defaultSettings(): Settings {
  return { reduceMotion: false, demoUnlock: false }
}
export function emptyState(): PersistedState {
  return { version: 1, activePlayerId: null, players: {}, settings: defaultSettings() }
}
export function emptyPlayer(id: string, name: string, className: string): PlayerProfile {
  return {
    id, name, className, createdAt: Date.now(), tutorialDone: false, progress: {}, vocabStats: {},
    totals: { attempts: 0, correct: 0, mistakes: 0, hints: 0, timeMs: 0 }, achievements: {}, results: [],
  }
}

function vocabMap(x: unknown): Record<string, VocabStat> {
  const out: Record<string, VocabStat> = {}
  if (isObj(x)) Object.entries(x).forEach(([k, v]) => { if (isObj(v)) out[k] = { c: Math.max(0, num(v.c)), w: Math.max(0, num(v.w)) } })
  return out
}

function sanitizeResult(x: unknown): CaseResult | null {
  if (!isObj(x) || typeof x.caseId !== 'string') return null
  return {
    caseId: x.caseId, at: num(x.at), accuracy: Math.min(1, Math.max(0, num(x.accuracy))), xp: Math.max(0, num(x.xp)),
    stars: Math.min(3, Math.max(0, Math.round(num(x.stars)))), correct: num(x.correct), mistakes: num(x.mistakes),
    hints: num(x.hints), evidenceFound: num(x.evidenceFound), evidenceTotal: num(x.evidenceTotal), timeMs: num(x.timeMs),
    vocab: vocabMap(x.vocab), firstClear: bool(x.firstClear),
  }
}

function sanitizeProgress(x: unknown, caseId: string): CaseProgress | null {
  if (!isObj(x)) return null
  return {
    caseId, completed: bool(x.completed), stars: Math.min(3, Math.max(0, Math.round(num(x.stars)))),
    bestXp: Math.max(0, num(x.bestXp)), bestAccuracy: Math.min(1, Math.max(0, num(x.bestAccuracy))),
    bestTimeMs: x.bestTimeMs === null || x.bestTimeMs === undefined ? null : num(x.bestTimeMs),
    attempts: Math.max(0, num(x.attempts)), lastPlayedAt: num(x.lastPlayedAt), lastResult: sanitizeResult(x.lastResult),
  }
}

function sanitizePlayer(id: string, x: unknown): PlayerProfile | null {
  if (!isObj(x)) return null
  const name = str(x.name).trim()
  if (!name) return null
  const p = emptyPlayer(id, name.slice(0, 40), str(x.className).slice(0, 20))
  p.createdAt = num(x.createdAt, Date.now())
  p.tutorialDone = bool(x.tutorialDone)
  if (isObj(x.progress)) Object.entries(x.progress).forEach(([cid, v]) => { const s = sanitizeProgress(v, cid); if (s) p.progress[cid] = s })
  p.vocabStats = vocabMap(x.vocabStats)
  if (isObj(x.totals)) {
    p.totals = { attempts: num(x.totals.attempts), correct: num(x.totals.correct), mistakes: num(x.totals.mistakes), hints: num(x.totals.hints), timeMs: num(x.totals.timeMs) }
  }
  if (isObj(x.achievements)) Object.entries(x.achievements).forEach(([k, v]) => { p.achievements[k] = num(v, Date.now()) })
  if (Array.isArray(x.results)) p.results = x.results.map(sanitizeResult).filter((r): r is CaseResult => r !== null).slice(-100)
  return p
}

/** Tolerant loader: anything malformed is repaired or dropped, never thrown. */
export function sanitizeState(raw: unknown): PersistedState {
  const state = emptyState()
  if (!isObj(raw)) return state
  if (isObj(raw.players)) {
    Object.entries(raw.players).forEach(([id, v]) => { const p = sanitizePlayer(id, v); if (p) state.players[id] = p })
  }
  const active = str(raw.activePlayerId)
  state.activePlayerId = active && state.players[active] ? active : null
  if (isObj(raw.settings)) state.settings = { reduceMotion: bool(raw.settings.reduceMotion), demoUnlock: bool(raw.settings.demoUnlock) }
  return state
}
