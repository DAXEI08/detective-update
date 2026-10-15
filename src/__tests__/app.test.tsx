import { describe, expect, it, beforeEach } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { verifyContent } from '../engine/verifyContent'
import { glossSentence } from '../data/lexicon'
import { relationHolds } from '../engine/spatial'
import { sanitizeState } from '../services/persistence/schema'
import { usePlayerStore } from '../stores/playerStore'
import { useGameStore } from '../stores/gameStore'
import { CASES } from '../data/cases'
import { TaskView } from '../components/game/tasks'
import { askDalil } from '../services/dalil'
import { computeStars } from '../engine/scoring'

beforeEach(() => { cleanup(); window.localStorage.clear() })

describe('content', () => {
  it('is consistent and solvable', () => { expect(verifyContent()).toEqual([]) })
  it('glosses idafa phrases', () => {
    const g = glossSentence('الْعَوَّامَةُ بِجَانِبِ قَارِبِ النَّجَاةِ.')
    expect(g.map((x) => x.entry?.idn)).toEqual(['pelampung', 'di samping', 'sekoci'])
  })
})
describe('engine', () => {
  it('spatial relations', () => {
    expect(relationHolds('amama', { col: 1, row: 2 }, { col: 1, row: 1 })).toBe(true)
    expect(relationHolds('khalfa', { col: 1, row: 0 }, { col: 1, row: 1 })).toBe(true)
    expect(relationHolds('bayna', { col: 2, row: 1 }, { col: 0, row: 1 }, { col: 4, row: 1 })).toBe(true)
    expect(relationHolds('bijanib', { col: 3, row: 1 }, { col: 1, row: 1 })).toBe(false)
  })
  it('stars', () => { expect(computeStars(0.9, 2)).toBe(3); expect(computeStars(0.5, 0)).toBe(1) })
  it('repairs corrupted persisted state', () => {
    expect(sanitizeState('garbage').players).toEqual({})
    const s = sanitizeState({ players: { a: { name: 'X', progress: { 'case-1': { completed: 'yes', stars: 99 } } } }, activePlayerId: 'zzz' })
    expect(s.activePlayerId).toBeNull()
    expect(s.players.a.progress['case-1'].stars).toBe(3)
  })
  it('Dalil offline never throws and returns scaffolds', async () => {
    const def = CASES[1]
    const r = await askDalil('hint', { caseId: def.id, caseTitleId: '', taskId: def.tasks[1].id, taskType: 'placement', taskIndex: 1, taskCount: 4, instruction: '', hintLevel: 2, failedAttempts: 0, hintsUsedOnTask: 0, evidence: [], evidenceFound: 0, evidenceTotal: 7, authoredHints: def.tasks[1].hints })
    expect(r.text.length).toBeGreaterThan(10)
  })
})

describe('full playthrough state machine', () => {
  it('completes all five cases via the store and unlocks sequentially', () => {
    const ps = usePlayerStore.getState()
    ps.resetAll()
    const pid = usePlayerStore.getState().createPlayer('Tester', 'X')
    for (const def of CASES) {
      useGameStore.getState().startCase(pid, def.id)
      useGameStore.getState().setStage('play')
      for (const t of def.tasks) {
        useGameStore.getState().completeTask(t)
        useGameStore.getState().advance(def)
      }
      const res = useGameStore.getState().buildResult(def)!
      expect(res.evidenceFound).toBeGreaterThan(0)
      usePlayerStore.getState().recordResult(res, def)
    }
    const p = usePlayerStore.getState().players[pid]
    expect(Object.values(p.progress).filter((x) => x.completed)).toHaveLength(5)
    expect(p.achievements['skilled-reader']).toBeTruthy()
  })
})

describe('every task type renders', () => {
  it.each(CASES.flatMap((d) => d.tasks.map((t) => [d.id, t.id] as const)))('%s / %s', (cid, tid) => {
    const def = CASES.find((c) => c.id === cid)!
    const task = def.tasks.find((t) => t.id === tid)!
    const pid = usePlayerStore.getState().createPlayer('R', '')
    useGameStore.getState().startCase(pid, def.id)
    // pre-collect evidence so evidence-driven tasks have cards to show
    def.clues.filter((c) => c.isEvidence).forEach((c) => useGameStore.getState().collectEvidence(c.id))
    const { container } = render(<MemoryRouter><TaskView task={task} def={def} solved={false} onSolved={() => {}} /></MemoryRouter>)
    expect(container.textContent!.length).toBeGreaterThan(10)
    act(() => {})
  })
})
