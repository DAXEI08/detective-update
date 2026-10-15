import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CASES } from '../data/cases'
import { verifyContent } from '../engine/verifyContent'
import { askDalil, CHARGED_ACTIONS, resolveHintLevel } from '../services/dalil'
import type { DalilContext } from '../services/dalil'
import { recommend } from '../engine/recommendation'
import { csvCell, attemptsToCsv, filterAttempts, readDetails } from '../engine/teacherView'
import { isCaseUnlocked, usePlayerStore } from '../stores/playerStore'
import { useGameStore } from '../stores/gameStore'
import { DragItem } from '../components/common/DragItem'
import { PlacementTask } from '../components/game/tasks/PlacementTask'
import { Results } from '../pages/Results'
import type { CaseDefinition, PlacementTask as PT } from '../types'
import type { TeacherAttempt } from '../services/cloud/supabase'

const SESSION_KEY = 'arabic-detective:v1:session'
const STATE_KEY = 'arabic-detective:v1:state'
beforeEach(() => { cleanup(); localStorage.clear(); usePlayerStore.getState().resetAll(); useGameStore.getState().clearSession() })

function play(pid: string, def: CaseDefinition, opts: { mistakes?: number; hints?: number } = {}) {
  const g = useGameStore.getState()
  g.startCase(pid, def.id); g.setStage('play')
  for (let i = 0; i < (opts.mistakes ?? 0); i++) g.recordMistake(def.tasks[0].id, 'x', def.tasks[0].vocab)
  for (let i = 0; i < (opts.hints ?? 0); i++) g.registerHint(def.tasks[0].id, 1)
  for (const t of def.tasks) { useGameStore.getState().completeTask(t); useGameStore.getState().advance(def) }
  const res = useGameStore.getState().buildResult(def)!
  const out = usePlayerStore.getState().recordResult(res, def)
  useGameStore.getState().clearSession()
  return out.result
}

describe('progression', () => {
  it('unlocks cases sequentially', () => {
    const pid = usePlayerStore.getState().createPlayer('Sinta', 'X')
    const st = () => ({ p: usePlayerStore.getState().players[pid], s: usePlayerStore.getState().settings })
    expect(CASES.map((c) => isCaseUnlocked(st().p, st().s, c))).toEqual([true, false, false, false, false])
    play(pid, CASES[0])
    expect(CASES.map((c) => isCaseUnlocked(st().p, st().s, c))).toEqual([true, true, false, false, false])
  })

  it('Mode Presentasi opens every case without touching real progress', () => {
    const pid = usePlayerStore.getState().createPlayer('Juri', '')
    usePlayerStore.getState().setSettings({ demoUnlock: true })
    const { p, s } = { p: usePlayerStore.getState().players[pid], s: usePlayerStore.getState().settings }
    expect(CASES.every((c) => isCaseUnlocked(p, s, c))).toBe(true)
    expect(Object.keys(p.progress)).toEqual([])
    usePlayerStore.getState().setSettings({ demoUnlock: false })
    expect(isCaseUnlocked(usePlayerStore.getState().players[pid], usePlayerStore.getState().settings, CASES[4])).toBe(false)
  })

  it('replay never lowers the best score', () => {
    const pid = usePlayerStore.getState().createPlayer('Budi', '')
    const best = play(pid, CASES[0])
    play(pid, CASES[0], { mistakes: 6, hints: 5 })
    const pr = usePlayerStore.getState().players[pid].progress[CASES[0].id]
    expect(pr.attempts).toBe(2)
    expect(pr.stars).toBe(best.stars)
    expect(pr.bestXp).toBeGreaterThanOrEqual(best.xp)
    expect(pr.bestAccuracy).toBeCloseTo(best.accuracy)
    expect(pr.lastResult!.mistakes).toBe(6)
  })

  it('full five-case run records five completions and sequential unlocks', () => {
    const pid = usePlayerStore.getState().createPlayer('Lengkap', '')
    CASES.forEach((def, i) => {
      expect(isCaseUnlocked(usePlayerStore.getState().players[pid], usePlayerStore.getState().settings, def)).toBe(true)
      play(pid, def)
      expect(Object.values(usePlayerStore.getState().players[pid].progress).filter((x) => x.completed)).toHaveLength(i + 1)
    })
  })
})

describe('persistence & recovery', () => {
  it('restores an in-progress session after a reload', async () => {
    const pid = usePlayerStore.getState().createPlayer('Reload', '')
    const def = CASES[1]
    useGameStore.getState().startCase(pid, def.id); useGameStore.getState().setStage('play')
    useGameStore.getState().completeTask(def.tasks[0]); useGameStore.getState().advance(def)
    vi.resetModules()
    const fresh = (await import('../stores/gameStore')).useGameStore.getState().session!
    expect(fresh.caseId).toBe(def.id)
    expect(fresh.taskIndex).toBe(1)
    expect(fresh.taskStats[def.tasks[0].id].done).toBe(true)
    expect(fresh.stage).toBe('play')
  })

  it('survives corrupt session and corrupt app state', async () => {
    localStorage.setItem(SESSION_KEY, '{broken json')
    localStorage.setItem(STATE_KEY, '[[[')
    vi.resetModules()
    expect((await import('../stores/gameStore')).useGameStore.getState().session).toBeNull()
    expect((await import('../stores/playerStore')).usePlayerStore.getState().players).toEqual({})

    localStorage.setItem(SESSION_KEY, JSON.stringify({ playerId: 'p', caseId: 'case-1', taskIndex: -5, taskStats: { a: null, b: 5 }, evidence: 'nope', xp: 'x' }))
    vi.resetModules()
    const s = (await import('../stores/gameStore')).useGameStore.getState().session!
    expect(s.taskIndex).toBe(0)
    expect(s.evidence).toEqual([])
    expect(s.xp).toBe(0)
  })
})

describe('Dalil (deterministic scaffolding)', () => {
  const def = CASES[1]; const task = def.tasks[1]
  const ctx = (level: 1 | 2 | 3, over: Partial<DalilContext> = {}): DalilContext => ({
    caseId: def.id, caseTitleId: '', taskId: task.id, taskType: task.type, taskIndex: 1, taskCount: 4, instruction: '', hintLevel: level,
    failedAttempts: 0, hintsUsedOnTask: 0, evidence: [], evidenceFound: 0, evidenceTotal: 7, authoredHints: task.hints, ...over,
  })

  it('same input gives the same output', () => {
    for (const a of ['hint', 'explainSentence', 'explainWord', 'whyWrong', 'analyzeEvidence'] as const) {
      const c = ctx(2, { focusText: 'الْحَاوِيَةُ أَمَامَ الْمَخْزَنِ.', word: 'أَمَامَ' })
      expect(askDalil(a, c)).toEqual(askDalil(a, c))
    }
  })

  it('serves the authored hint for each level and never an empty answer', () => {
    for (const d of CASES) for (const t of d.tasks) for (const lvl of [1, 2, 3] as const) {
      const r = askDalil('hint', ctx(lvl, { authoredHints: t.hints }))
      expect(r.level).toBe(lvl)
      expect(r.text).toContain(t.hints[lvl - 1])
    }
  })

  it('hint ladder: 1 → 2 → 3, repeats level 3 for free, jumps to 2 after 3 failures', () => {
    expect(resolveHintLevel(0, 0)).toEqual({ level: 1, repeat: false })
    expect(resolveHintLevel(1, 0)).toEqual({ level: 2, repeat: false })
    expect(resolveHintLevel(2, 0)).toEqual({ level: 3, repeat: false })
    expect(resolveHintLevel(3, 0)).toEqual({ level: 3, repeat: true })
    expect(resolveHintLevel(0, 3)).toEqual({ level: 2, repeat: false })
    expect(CHARGED_ACTIONS.whyWrong).toBe(false)
    expect(CHARGED_ACTIONS.hint).toBe(true)
  })

  it('store records ladder per task and clamps it', () => {
    const pid = usePlayerStore.getState().createPlayer('H', '')
    useGameStore.getState().startCase(pid, def.id)
    useGameStore.getState().registerHint(task.id, 2)
    useGameStore.getState().registerHint(task.id, 1)
    useGameStore.getState().registerHint(task.id, 99)
    const st = useGameStore.getState().session!.taskStats[task.id]
    expect(st.ladder).toBe(3); expect(st.hints).toBe(3)
  })

  it('explains words and sentences from the lexicon', () => {
    expect(askDalil('explainWord', ctx(1, { word: 'بِجَانِبِ' })).text).toContain('di samping')
    expect(askDalil('explainSentence', ctx(1, { focusText: 'الْعَوَّامَةُ بِجَانِبِ قَارِبِ النَّجَاةِ.' })).text).toContain('pelampung')
  })
})

describe('Results recommendation', () => {
  it('names the weakest vocabulary', () => {
    const r = recommend({ hints: 0, mistakes: 3, vocab: { bijanib: { c: 1, w: 3 }, khalfa: { c: 1, w: 2 }, amama: { c: 3, w: 0 } } })
    expect(r.text).toBe('Perlu latihan lagi: بِجَانِبِ dan خَلْفَ.')
    expect(r.strong.map((x) => x.id)).toEqual(['amama'])
  })
  it('praises a clean run and strong vocabulary, and is deterministic', () => {
    expect(recommend({ hints: 0, mistakes: 0, vocab: { amama: { c: 2, w: 0 } } }).text).toMatch(/tanpa salah/)
    const strong = { hints: 1, mistakes: 1, vocab: { amama: { c: 2, w: 0 }, fi: { c: 1, w: 0 } } }
    expect(recommend(strong).text).toMatch(/^Kamu sudah kuat dalam mengenali/)
    expect(recommend(strong)).toEqual(recommend(strong))
  })
  it('handles empty and unknown vocabulary', () => {
    expect(() => recommend({ hints: 0, mistakes: 1, vocab: { nope: { c: 0, w: 4 } } })).not.toThrow()
    expect(recommend({ hints: 5, mistakes: 1, vocab: {} }).text).toMatch(/lebih sedikit petunjuk/)
  })
  it('renders on the Results page', () => {
    const pid = usePlayerStore.getState().createPlayer('Hasil', 'X')
    play(pid, CASES[0], { mistakes: 2 })
    render(<MemoryRouter initialEntries={[`/results/${CASES[0].id}`]}><Routes><Route path="/results/:id" element={<Results />} /></Routes></MemoryRouter>)
    expect(screen.getByTestId('recommendation').textContent!.length).toBeGreaterThan(10)
    expect(screen.getByText(/Tersimpan di perangkat/)).toBeTruthy()
  })
})

describe('teacher data helpers', () => {
  const row = (over: Partial<TeacherAttempt> = {}): TeacherAttempt => ({
    id: '1', client_attempt_id: 'a', case_id: 'case-2', case_number: 2, case_title: 'Where Is It?', attempt_number: 1, score: 80, accuracy: 0.8,
    correct_count: 8, mistake_count: 2, hint_count: 1, xp: 400, stars: 2, evidence_found: 5, evidence_total: 7, duration_ms: 90000,
    started_at: '2026-01-01T00:00:00Z', finished_at: '2026-01-01T00:01:30Z',
    details: { vocab: { bijanib: { c: 1, w: 3 } }, session: { taskStats: { 'c2-t2': { mistakes: 2, hints: 1 } }, learned: ['a'] } },
    students: { id: 's', name: '=HYPERLINK("x")', class_name: 'X TKJ', client_id: 'c' }, ...over,
  })
  it('neutralises spreadsheet formulas and quotes properly', () => {
    expect(csvCell('=1+1')).toBe("'=1+1")
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('he said "hi"')).toBe('"he said ""hi"""')
    expect(csvCell(-5)).toBe('-5')
    expect(attemptsToCsv([row()]).split('\r\n')[1]).toContain("'=HYPERLINK")
  })
  it('reads details defensively and filters', () => {
    expect(readDetails(null)).toEqual({ vocab: [], issues: [], learned: 0 })
    expect(readDetails('x').vocab).toEqual([])
    expect(readDetails(row().details).vocab[0].id).toBe('bijanib')
    const rows = [row(), row({ id: '2', case_id: 'case-1', students: { id: 's2', name: 'Dewi', class_name: 'XI', client_id: 'd' } })]
    expect(filterAttempts(rows, { query: 'dewi', className: 'all', caseId: 'all' })).toHaveLength(1)
    expect(filterAttempts(rows, { query: '', className: 'X TKJ', caseId: 'all' })).toHaveLength(1)
    expect(filterAttempts(rows, { query: '', className: 'all', caseId: 'case-1' })).toHaveLength(1)
  })
})

describe('content verifier catches broken content', () => {
  const clone = () => structuredClone(CASES) as CaseDefinition[]
  it('passes on real content', () => { expect(verifyContent()).toEqual([]) })
  it('flags structural problems', () => {
    const c = clone()
    c[1].clues.push({ ...c[1].clues[0] })                      // duplicate clue id
    c[2].clues.push({ id: 'orphan', ar: 'هَذِهِ حَاوِيَةٌ.', note: '', vocab: ['nope'], isEvidence: false }) // unknown vocab + unused
    ;(c[0].tasks[0] as { clueId: string }).clueId = 'missing'  // invalid clue reference
    c[0].tasks[1].hints = ['a', '', 'c']                        // empty hint
    c[1].tasks[1].hints = ['a', 'b'] as unknown as [string, string, string] // task without 3 hints
    c[4].number = 9                                             // invalid order
    const errs = verifyContent(c).join('\n')
    for (const m of ['duplicate clue ids', 'missing clue', 'empty hint', 'exactly 3 hint', 'invalid case order', 'unknown vocabulary "nope"', 'never used']) expect(errs).toContain(m)
  })
  it('flags impossible placement, dead-end evidence and answer-leaking sequence hints', () => {
    const c = clone()
    const place = c[1].tasks.find((t) => t.type === 'placement') as PT
    place.constraints.push({ ...place.constraints[0], rel: place.constraints[0].rel === 'amama' ? 'khalfa' : 'amama' }) // contradictory
    const elim = c[3].tasks.find((t) => t.type === 'elimination')!
    c[3].tasks = [elim, ...c[3].tasks.filter((t) => t !== elim)]  // used before earlier tasks collect evidence
    const seq = c[4].tasks.find((t) => t.type === 'sequence')!
    seq.hints[1] = 'a → b → c'
    const errs = verifyContent(c).join('\n')
    expect(errs).toContain('NOT solvable')
    expect(errs).toContain('dead end')
    expect(errs).toContain('spells out the sequence')
  })
})

describe('tap alternative to drag', () => {
  it('DragItem activates with keyboard and does not leak the click to a parent drop zone', () => {
    const activate = vi.fn(); const parent = vi.fn()
    render(<div onClick={parent}><DragItem label="item" onDropOn={() => {}} onActivate={activate}>x</DragItem></div>)
    const el = screen.getByRole('button', { name: 'item' })
    fireEvent.keyDown(el, { key: 'Enter' })
    expect(activate).toHaveBeenCalledTimes(1)
    fireEvent.click(el)
    expect(parent).not.toHaveBeenCalled()
  })

  it('Placement can be completed (move an item) with select → tap cell, no drag', () => {
    const def = CASES[1]
    const task = def.tasks.find((t) => t.type === 'placement') as PT
    const pid = usePlayerStore.getState().createPlayer('Tap', '')
    useGameStore.getState().startCase(pid, def.id)
    render(<MemoryRouter><PlacementTask task={task} def={def} solved={false} onSolved={() => {}} /></MemoryRouter>)
    const tray = () => screen.queryAllByRole('button', { name: /^Benda ال/ })
    const before = tray().length
    fireEvent.keyDown(tray()[0], { key: 'Enter' })                       // select from tray
    expect(tray()[0].getAttribute('aria-pressed')).toBe('true')
    const free = screen.getAllByRole('gridcell').find((c) => !c.querySelector('svg'))!
    fireEvent.click(free)                                                  // tap a free cell
    expect(tray().length).toBe(before - 1)
    const placed = screen.getAllByRole('button', { name: /^Benda di baris/ })[0]
    fireEvent.keyDown(placed, { key: 'Enter' })                           // select again on the map (keyboard)
    expect(placed.getAttribute('aria-pressed')).toBe('true')
  })
})
