export const XP = { correct: 100, noHint: 30, complete: 150, star: 50, bonusEvidence: 50 }

export function computeStars(accuracy: number, hints: number): number {
  if (accuracy >= 0.85 && hints <= 3) return 3
  if (accuracy >= 0.6) return 2
  return 1
}

export interface Rank { id: string; ar: string; idn: string; min: number }
export const RANKS: Rank[] = [
  { id: 'junior', ar: 'مُحَقِّقٌ مُبْتَدِئٌ', idn: 'Junior Investigator', min: 0 },
  { id: 'investigator', ar: 'مُحَقِّقٌ', idn: 'Investigator', min: 1500 },
  { id: 'expert', ar: 'مُحَقِّقٌ خَبِيرٌ', idn: 'Expert Investigator', min: 3500 },
]
export function getRank(totalXp: number): { rank: Rank; next: Rank | null; progress: number } {
  let idx = 0
  RANKS.forEach((r, i) => { if (totalXp >= r.min) idx = i })
  const rank = RANKS[idx]
  const next = RANKS[idx + 1] ?? null
  const progress = next ? (totalXp - rank.min) / (next.min - rank.min) : 1
  return { rank, next, progress: Math.max(0, Math.min(1, progress)) }
}
