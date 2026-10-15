import type { CaseResult } from '../types'
import { labelOf } from '../data/vocabulary'

export interface VocabInsight { id: string; ar: string; idn: string; c: number; w: number }
export interface Recommendation { weak: VocabInsight[]; strong: VocabInsight[]; text: string }

const join = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join('، ')} dan ${xs[xs.length - 1]}`)

/** Deterministic study advice from one result. Same result → same sentence. No model involved. */
export function recommend(r: Pick<CaseResult, 'vocab' | 'hints' | 'mistakes'>): Recommendation {
  const rows: VocabInsight[] = Object.entries(r.vocab ?? {}).flatMap(([id, v]) => {
    const l = labelOf(id)
    return l ? [{ id, ar: l.ar, idn: l.idn, c: v.c, w: v.w }] : []
  })
  const weak = rows.filter((x) => x.w > 0).sort((a, b) => b.w / (b.c + b.w) - a.w / (a.c + a.w) || b.w - a.w || a.id.localeCompare(b.id)).slice(0, 2)
  const strong = rows.filter((x) => x.w === 0 && x.c > 0).sort((a, b) => b.c - a.c || a.id.localeCompare(b.id)).slice(0, 3)

  let text: string
  if (weak.length) text = `Perlu latihan lagi: ${join(weak.map((x) => x.ar))}.`
  else if (r.mistakes === 0 && r.hints === 0) text = 'Luar biasa! Kamu menyelesaikan kasus ini tanpa salah dan tanpa petunjuk.'
  else if (strong.length) text = `Kamu sudah kuat dalam mengenali: ${join(strong.map((x) => x.ar))}.`
  else text = 'Ulangi kasus ini untuk mengukur kemampuanmu tanpa bantuan.'
  if (r.hints >= 4) text += ' Coba lagi dengan lebih sedikit petunjuk Dalil.'
  return { weak, strong, text }
}
