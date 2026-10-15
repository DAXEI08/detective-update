import type { PlayerProfile } from '../types'
import { CASES } from '../data/cases'
import { labelOf } from '../data/vocabulary'

export const totalXp = (p: PlayerProfile) => Object.values(p.progress).reduce((a, c) => a + c.bestXp, 0)
export const completedCount = (p: PlayerProfile) => Object.values(p.progress).filter((c) => c.completed).length
export const starsTotal = (p: PlayerProfile) => Object.values(p.progress).reduce((a, c) => a + c.stars, 0)
export function overallAccuracy(p: PlayerProfile): number | null {
  const { correct, mistakes } = p.totals
  const n = correct + mistakes
  return n === 0 ? null : correct / n
}

export interface VocabRow { id: string; ar: string; idn: string; c: number; w: number; accuracy: number }

/** Aggregate vocabulary accuracy across the given players, hardest first. */
export function vocabDifficulty(players: PlayerProfile[]): VocabRow[] {
  const agg = new Map<string, { c: number; w: number }>()
  players.forEach((p) => {
    Object.entries(p.vocabStats).forEach(([id, s]) => {
      const cur = agg.get(id) ?? { c: 0, w: 0 }
      cur.c += s.c
      cur.w += s.w
      agg.set(id, cur)
    })
  })
  const rows: VocabRow[] = []
  agg.forEach((s, id) => {
    const l = labelOf(id)
    if (!l || s.c + s.w === 0) return
    rows.push({ id, ar: l.ar, idn: l.idn, c: s.c, w: s.w, accuracy: s.c / (s.c + s.w) })
  })
  return rows.sort((a, b) => a.accuracy - b.accuracy || b.w - a.w)
}

export function caseStats(players: PlayerProfile[]) {
  return CASES.map((def) => {
    const done = players.filter((p) => p.progress[def.id]?.completed)
    const acc = done.length ? done.reduce((a, p) => a + (p.progress[def.id].bestAccuracy || 0), 0) / done.length : null
    return { def, completedBy: done.length, avgAccuracy: acc }
  })
}

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export function playersToCsv(players: PlayerProfile[]): string {
  const head = ['Nama', 'Kelas', 'Kasus selesai', 'Akurasi (%)', 'Hint Dalil', 'XP', 'Bintang', 'Waktu total (detik)']
  const rows = players.map((p) => {
    const acc = overallAccuracy(p)
    return [p.name, p.className, `${completedCount(p)}/${CASES.length}`, acc === null ? '' : Math.round(acc * 100), p.totals.hints, totalXp(p), starsTotal(p), Math.round(p.totals.timeMs / 1000)]
  })
  return [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
}
