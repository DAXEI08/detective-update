import { create } from 'zustand'
import type { CaseDefinition, CaseResult, Task } from '../types'
import { loadJSON, saveJSON, SESSION_KEY, storage } from '../services/persistence/storage'
import { num } from '../services/persistence/schema'
import { computeStars, XP } from '../engine/scoring'
import { evidenceTotal } from '../data/cases'

export interface TaskStat { attempts: number; mistakes: number; hints: number; /** highest Dalil hint level served on this task (0-3) */ ladder: number; done: boolean }
export interface Session {
  playerId: string
  caseId: string
  stage: 'briefing' | 'play'
  taskIndex: number
  elapsedMs: number
  lastTick: number
  xp: number
  mistakes: number
  correct: number
  hints: number
  evidence: string[]
  revealed: string[]
  learned: string[]
  taskStats: Record<string, TaskStat>
  vocabC: Record<string, number>
  vocabW: Record<string, number>
}
export interface DalilMsg { id: number; role: 'user' | 'dalil'; text: string }
export interface LastMistake { taskId: string; message: string; vocab: string[] }

interface GameState {
  session: Session | null
  dalilLog: DalilMsg[]
  lastMistake: LastMistake | null
  focusText: string | null
  startCase: (playerId: string, caseId: string) => void
  resumeIfMatches: (playerId: string, caseId: string) => boolean
  setStage: (stage: Session['stage']) => void
  setFocus: (t: string | null) => void
  recordMistake: (taskId: string, message: string, vocab: string[]) => void
  collectEvidence: (clueId: string, bonusXp?: number) => boolean
  registerHint: (taskId: string, level?: number) => void
  completeTask: (task: Task) => { xpGain: number }
  advance: (def: CaseDefinition) => 'next' | 'finished'
  buildResult: (def: CaseDefinition) => Omit<CaseResult, 'firstClear'> | null
  clearSession: () => void
  pushDalil: (m: Omit<DalilMsg, 'id'>) => void
}

const emptyStat = (): TaskStat => ({ attempts: 0, mistakes: 0, hints: 0, ladder: 0, done: false })
let msgSeq = 1

function sanitizeSession(raw: unknown): Session | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.playerId !== 'string' || typeof r.caseId !== 'string') return null
  const arr = (x: unknown): string[] => (Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string') : [])
  const rec = (x: unknown): Record<string, number> => {
    const out: Record<string, number> = {}
    if (typeof x === 'object' && x !== null) Object.entries(x).forEach(([k, v]) => { out[k] = num(v) })
    return out
  }
  const stats: Record<string, TaskStat> = {}
  if (typeof r.taskStats === 'object' && r.taskStats !== null) {
    Object.entries(r.taskStats as Record<string, Record<string, unknown>>).forEach(([k, v]) => {
      stats[k] = { attempts: num(v?.attempts), mistakes: num(v?.mistakes), hints: num(v?.hints), ladder: Math.min(3, Math.max(0, num(v?.ladder))), done: v?.done === true }
    })
  }
  return {
    playerId: r.playerId, caseId: r.caseId, stage: r.stage === 'play' ? 'play' : 'briefing',
    taskIndex: Math.max(0, num(r.taskIndex)), elapsedMs: num(r.elapsedMs), lastTick: Date.now(),
    xp: num(r.xp), mistakes: num(r.mistakes), correct: num(r.correct), hints: num(r.hints),
    evidence: arr(r.evidence), revealed: arr(r.revealed), learned: arr(r.learned),
    taskStats: stats, vocabC: rec(r.vocabC), vocabW: rec(r.vocabW),
  }
}

const restored = sanitizeSession(loadJSON(SESSION_KEY))

export const useGameStore = create<GameState>((set, get) => {
  /** Apply a mutation to the session, keep the clock honest (idle time capped), and persist. */
  const mutate = (fn: (s: Session) => Session) => {
    const cur = get().session
    if (!cur) return
    const now = Date.now()
    const ticked: Session = { ...cur, elapsedMs: cur.elapsedMs + Math.min(now - cur.lastTick, 120000), lastTick: now }
    const next = fn(ticked)
    saveJSON(SESSION_KEY, next)
    set({ session: next })
  }
  const bump = (rec: Record<string, number>, keys: string[]) => {
    const out = { ...rec }
    keys.forEach((k) => { out[k] = (out[k] ?? 0) + 1 })
    return out
  }
  const withStat = (s: Session, id: string, patch: Partial<TaskStat>): Record<string, TaskStat> => ({
    ...s.taskStats,
    [id]: { ...(s.taskStats[id] ?? emptyStat()), ...patch },
  })

  return {
    session: restored,
    dalilLog: [],
    lastMistake: null,
    focusText: null,

    startCase: (playerId, caseId) => {
      const s: Session = {
        playerId, caseId, stage: 'briefing', taskIndex: 0, elapsedMs: 0, lastTick: Date.now(), xp: 0, mistakes: 0,
        correct: 0, hints: 0, evidence: [], revealed: [], learned: [], taskStats: {}, vocabC: {}, vocabW: {},
      }
      saveJSON(SESSION_KEY, s)
      set({ session: s, dalilLog: [], lastMistake: null, focusText: null })
    },
    resumeIfMatches: (playerId, caseId) => {
      const s = get().session
      return Boolean(s && s.playerId === playerId && s.caseId === caseId)
    },
    setStage: (stage) => mutate((s) => ({ ...s, stage })),
    setFocus: (t) => set({ focusText: t }),

    recordMistake: (taskId, message, vocab) => {
      mutate((s) => {
        const st = s.taskStats[taskId] ?? emptyStat()
        return {
          ...s,
          mistakes: s.mistakes + 1,
          taskStats: withStat(s, taskId, { mistakes: st.mistakes + 1, attempts: st.attempts + 1 }),
          vocabW: bump(s.vocabW, vocab),
        }
      })
      set({ lastMistake: { taskId, message, vocab } })
    },

    collectEvidence: (clueId, bonusXp = 0) => {
      const s = get().session
      if (!s || s.evidence.includes(clueId)) return false
      mutate((x) => ({ ...x, evidence: [...x.evidence, clueId], xp: x.xp + bonusXp }))
      return true
    },

    registerHint: (taskId, level) =>
      mutate((s) => {
        const st = s.taskStats[taskId] ?? emptyStat()
        return {
          ...s, hints: s.hints + 1,
          taskStats: withStat(s, taskId, { hints: st.hints + 1, ladder: level ? Math.max(st.ladder, Math.min(3, level)) : st.ladder }),
        }
      }),

    completeTask: (task) => {
      const s = get().session
      if (!s) return { xpGain: 0 }
      const st = s.taskStats[task.id] ?? emptyStat()
      if (st.done) return { xpGain: 0 }
      const xpGain = XP.correct + (st.hints === 0 ? XP.noHint : 0)
      mutate((x) => {
        const evidence = [...x.evidence]
        ;(task.collects ?? []).forEach((c) => { if (!evidence.includes(c)) evidence.push(c) })
        return {
          ...x,
          xp: x.xp + xpGain,
          correct: x.correct + 1,
          evidence,
          revealed: Array.from(new Set([...x.revealed, ...(task.collects ?? []), ...evidence])),
          learned: Array.from(new Set([...x.learned, ...task.vocab])),
          taskStats: withStat(x, task.id, { done: true, attempts: st.attempts + 1 }),
          vocabC: bump(x.vocabC, task.vocab),
        }
      })
      return { xpGain }
    },

    advance: (def) => {
      const s = get().session
      if (!s) return 'finished'
      const nextIndex = s.taskIndex + 1
      if (nextIndex >= def.tasks.length) return 'finished'
      mutate((x) => ({ ...x, taskIndex: nextIndex }))
      set({ lastMistake: null, focusText: null })
      return 'next'
    },

    buildResult: (def) => {
      const s = get().session
      if (!s) return null
      const total = Math.max(1, s.correct + s.mistakes)
      const accuracy = s.correct / total
      const stars = computeStars(accuracy, s.hints)
      const xp = s.xp + XP.complete + stars * XP.star
      const vocab: CaseResult['vocab'] = {}
      new Set([...Object.keys(s.vocabC), ...Object.keys(s.vocabW)]).forEach((k) => {
        vocab[k] = { c: s.vocabC[k] ?? 0, w: s.vocabW[k] ?? 0 }
      })
      const found = def.clues.filter((c) => c.isEvidence && s.evidence.includes(c.id)).length
      return {
        caseId: def.id, at: Date.now(), accuracy, xp, stars, correct: s.correct, mistakes: s.mistakes, hints: s.hints,
        evidenceFound: found, evidenceTotal: evidenceTotal(def),
        timeMs: s.elapsedMs + Math.min(Date.now() - s.lastTick, 120000), vocab,
      }
    },

    clearSession: () => {
      storage.remove(SESSION_KEY)
      set({ session: null, dalilLog: [], lastMistake: null, focusText: null })
    },
    pushDalil: (m) => set((s) => ({ dalilLog: [...s.dalilLog, { ...m, id: msgSeq++ }] })),
  }
})
