import type { CaseDefinition, CaseResult, PlayerProfile } from '../types'
import { CASES } from '../data/cases'

/** Returns the ids of achievements newly earned after `result` was applied to `player`. */
export function evaluateAchievements(player: PlayerProfile, result: CaseResult, def: CaseDefinition): string[] {
  const earned: string[] = []
  const has = (id: string) => Boolean(player.achievements[id])
  const hasHidden = def.clues.some((c) => c.hidden)

  if (!has('sharp-eye') && hasHidden && result.evidenceTotal > 0 && result.evidenceFound >= result.evidenceTotal) earned.push('sharp-eye')
  if (!has('skilled-reader') && result.hints === 0) earned.push('skilled-reader')
  if (!has('location-expert') && result.caseId === 'case-2' && result.accuracy >= 0.9) earned.push('location-expert')
  if (!has('golden-detective') && CASES.every((c) => (player.progress[c.id]?.stars ?? 0) >= 3)) earned.push('golden-detective')
  return earned
}
