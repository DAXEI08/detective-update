import { CASES } from '../data/cases'
import { glossSentence } from '../data/lexicon'
import { labelOf } from '../data/vocabulary'
import { checkConstraint, landmarkPositions } from './spatial'
import type { Positions } from './spatial'
import type { Cell, CaseDefinition, EntityKind, PlacementTask } from '../types'

/** Static integrity + solvability checks for all authored content. Returns a list of problems (empty = OK). */
export function verifyContent(cases: CaseDefinition[] = CASES): string[] {
  const errs: string[] = []
  const ids = new Set<string>()
  const caseIds = new Set<string>()

  cases.forEach((def, i) => {
    if (caseIds.has(def.id)) errs.push(`duplicate case id ${def.id}`)
    caseIds.add(def.id)
    if (def.number !== i + 1) errs.push(`${def.id}: invalid case order (number ${def.number} at position ${i + 1})`)
  })

  for (const def of cases) {
    const clueIds = new Set(def.clues.map((c) => c.id))
    if (clueIds.size !== def.clues.length) errs.push(`${def.id}: duplicate clue ids`)

    // every Arabic word in every clue / prompt must be explainable by Dalil's lexicon
    const texts = [...def.clues.map((c) => c.ar), ...def.tasks.flatMap((t) => [t.promptAr, t.focusText].filter(Boolean) as string[])]
    for (const t of texts) for (const g of glossSentence(t)) if (!g.entry) errs.push(`${def.id}: no lexicon entry for "${g.surface}" in "${t}"`)

    const needClue = (id: string, where: string) => { if (!clueIds.has(id)) errs.push(`${def.id}: ${where} references missing clue ${id}`) }

    for (const task of def.tasks) {
      if (ids.has(task.id)) errs.push(`duplicate task id ${task.id}`)
      ids.add(task.id)
      task.collects?.forEach((c) => needClue(c, task.id))
      if (task.hints.some((h) => !h.trim())) errs.push(`${task.id}: empty hint`)
      switch (task.type) {
        case 'hotspot': needClue(task.clueId, task.id); if (task.bonus) needClue(task.bonus.clueId, task.id); break
        case 'scene-choice':
          if (!task.options.some((o) => o.id === task.correct)) errs.push(`${task.id}: correct option missing`)
          break
        case 'placement': if (!solvable(task)) errs.push(`${task.id}: placement is NOT solvable`); task.constraints.forEach((c) => needClue(c.clueId, task.id)); break
        case 'dialogue':
          task.statementIds.forEach((s) => needClue(s, task.id))
          task.relevant.forEach((s) => { if (!task.statementIds.includes(s)) errs.push(`${task.id}: relevant not in statements`) })
          task.statementIds.forEach((s) => { if (!task.reasons[s]) errs.push(`${task.id}: missing reason for ${s}`) })
          break
        case 'assign': {
          const z = new Set(task.zones.map((x) => x.id))
          task.items.forEach((i) => { if (!z.has(task.solution[i])) errs.push(`${task.id}: bad solution for ${i}`) })
          if (new Set(Object.values(task.solution)).size !== task.items.length) errs.push(`${task.id}: solution zones not unique`)
          task.referenceIds.forEach((r) => needClue(r, task.id))
          break
        }
        case 'board':
          task.cardIds.forEach((c) => needClue(c, task.id))
          task.relevant.forEach((c) => { if (!task.cardIds.includes(c)) errs.push(`${task.id}: relevant card not on board`) })
          if (task.phase === 'sort') task.cardIds.forEach((c) => { if (!task.reasons[c]) errs.push(`${task.id}: no reason for ${c}`) })
          task.requiredLinks?.forEach(([a, b]) => { if (!task.validLinks?.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) errs.push(`${task.id}: required link not valid`) })
          break
        case 'elimination': {
          const others = task.candidates.filter((c) => c.id !== task.answer)
          others.forEach((c) => { if (!task.eliminatedBy[c.id]?.length) errs.push(`${task.id}: ${c.id} cannot be eliminated`) })
          if (task.eliminatedBy[task.answer]) errs.push(`${task.id}: answer must not be eliminable`)
          task.evidenceIds.forEach((e) => needClue(e, task.id))
          break
        }
        case 'sequence':
          if ([...task.order].sort().join() !== [...task.eventIds].sort().join()) errs.push(`${task.id}: sequence ids mismatch`)
          if (task.order.join() === task.eventIds.join()) errs.push(`${task.id}: sequence starts already solved`)
          task.order.forEach((e) => needClue(e, task.id))
          break
        case 'inspect':
          task.entities.forEach((e) => { if (e.clueId) needClue(e.clueId, task.id); if (e.clueId && e.relevant === false && !e.why) errs.push(`${task.id}: ${e.entity} needs why`) })
          break
        case 'report':
          task.fields.forEach((f) => { if (!f.options.some((o) => o.id === f.correct)) errs.push(`${task.id}: ${f.key} correct missing`) })
          task.evidencePicker?.validIds.forEach((v) => needClue(v, task.id))
          break
      }
    }
    errs.push(...caseSpecific(def), ...structural(def))
  }
  return errs
}

function caseSpecific(def: CaseDefinition): string[] {
  const out: string[] = []
  // all evidence must be reachable: collected by a task, or hotspot/inspect bonus
  const reachable = new Set<string>()
  def.tasks.forEach((t) => {
    t.collects?.forEach((c) => reachable.add(c))
    if (t.type === 'hotspot' && t.bonus) reachable.add(t.bonus.clueId)
    if (t.type === 'inspect') t.entities.forEach((e) => e.relevant && e.clueId && reachable.add(e.clueId))
  })
  def.clues.filter((c) => c.isEvidence).forEach((c) => { if (!reachable.has(c.id)) out.push(`${def.id}: evidence ${c.id} is unreachable`) })
  return out
}

/** Brute-force: does at least one placement of the movables satisfy every constraint (distinct free cells)? */
export function solvable(task: PlacementTask): boolean {
  const base = landmarkPositions(task.map)
  const cells: Cell[] = []
  for (let r = 0; r < task.map.rows; r++) for (let c = 0; c < task.map.cols; c++) cells.push({ col: c, row: r })
  const rec = (i: number, pos: Positions, used: Set<string>): boolean => {
    if (i === task.movables.length) return task.constraints.every((c) => checkConstraint(c, pos))
    const m: EntityKind = task.movables[i]
    for (const cell of cells) {
      const k = `${cell.col}:${cell.row}`
      if (used.has(k)) continue
      used.add(k)
      if (rec(i + 1, { ...pos, [m]: cell }, used)) return true
      used.delete(k)
    }
    return false
  }
  return rec(0, base, new Set())
}

/** Every clue id a task refers to, however the task type spells it. */
function clueRefs(t: CaseDefinition['tasks'][number]): string[] {
  const r: string[] = [...(t.collects ?? [])]
  switch (t.type) {
    case 'hotspot': r.push(t.clueId); if (t.bonus) r.push(t.bonus.clueId); break
    case 'scene-choice': r.push(t.clueId); break
    case 'placement': t.constraints.forEach((c) => r.push(c.clueId)); break
    case 'dialogue': r.push(...t.statementIds); break
    case 'assign': r.push(...t.referenceIds); break
    case 'board': r.push(...t.cardIds); break
    case 'elimination': r.push(...t.evidenceIds); break
    case 'sequence': r.push(...t.eventIds); break
    case 'inspect': t.entities.forEach((e) => e.clueId && r.push(e.clueId)); break
    case 'report': r.push(...(t.evidencePicker?.validIds ?? [])); break
  }
  return r
}

/** Checks that go beyond per-task wiring: references, learning-flow and hint hygiene. */
function structural(def: CaseDefinition): string[] {
  const out: string[] = []
  const clueIds = new Set(def.clues.map((c) => c.id))

  def.clues.forEach((c) => c.vocab.forEach((v) => { if (!labelOf(v)) out.push(`${def.id}: clue ${c.id} references unknown vocabulary "${v}"`) }))
  def.vocabulary.forEach((v) => { if (!labelOf(v)) out.push(`${def.id}: case vocabulary "${v}" does not exist`) })
  def.solution.evidenceIds.forEach((e) => { if (!clueIds.has(e)) out.push(`${def.id}: solution references missing evidence ${e}`) })

  const used = new Set<string>()
  const collectedBefore = new Set<string>()
  def.tasks.forEach((t) => {
    t.vocab.forEach((v) => { if (!labelOf(v)) out.push(`${t.id}: task references unknown vocabulary "${v}"`) })
    if (!Array.isArray(t.hints) || t.hints.length !== 3) out.push(`${t.id}: needs exactly 3 hint levels`)
    if (t.type === 'sequence' && t.hints.some((h) => h.includes('→'))) out.push(`${t.id}: a hint spells out the sequence (would leak the answer)`)
    clueRefs(t).forEach((c) => used.add(c))

    // evidence must already be in the student's hands when a task asks them to use it
    const needs = t.type === 'elimination' ? t.evidenceIds : t.type === 'report' ? (t.evidencePicker?.validIds ?? []) : []
    needs.forEach((e) => { if (!collectedBefore.has(e)) out.push(`${t.id}: uses evidence ${e} before any earlier task collects it (dead end)`) })
    ;(t.collects ?? []).forEach((c) => collectedBefore.add(c))
    if (t.type === 'hotspot' && t.bonus) collectedBefore.add(t.bonus.clueId)
    if (t.type === 'inspect') t.entities.forEach((e) => e.relevant && e.clueId && collectedBefore.add(e.clueId))

    if (t.type === 'placement') {
      const known = new Set<string>([...t.movables, ...t.map.landmarks.map((l) => l.kind)])
      t.constraints.forEach((c) => [c.subject, ...c.objects].forEach((k) => { if (!known.has(k)) out.push(`${t.id}: constraint ${c.clueId} refers to ${k}, which is neither movable nor a landmark`) }))
      if (new Set(t.movables).size !== t.movables.length) out.push(`${t.id}: duplicate movable`)
    }
    if (t.type === 'scene-choice' && new Set(t.options.map((o) => o.id)).size !== t.options.length) out.push(`${t.id}: duplicate option ids`)
    if (t.type === 'report') t.fields.forEach((f) => { if (new Set(f.options.map((o) => o.id)).size !== f.options.length) out.push(`${t.id}: duplicate option ids in ${f.key}`) })
  })

  def.clues.forEach((c) => {
    if (!used.has(c.id)) out.push(`${def.id}: clue ${c.id} is never used by any task`)
  })
  return out
}
