import { respond } from './provider'
import type { DalilAction, DalilContext, DalilReply, HintLevel } from './types'

export type { DalilAction, DalilContext, DalilReply, HintLevel } from './types'

/**
 * Dalil is a deterministic, pre-authored scaffolding system ("Petunjuk Bertingkat").
 * Same input → same output. No network, no randomness, no model.
 */
export function askDalil(action: DalilAction, ctx: DalilContext): DalilReply {
  return respond(action, ctx)
}

/** Which actions cost a hint. Reflective help ("why wrong", "analyse evidence") is free so students are not punished for learning from mistakes. */
export const CHARGED_ACTIONS: Record<DalilAction, boolean> = {
  hint: true,
  explainSentence: true,
  explainWord: true,
  whyWrong: false,
  analyzeEvidence: false,
}

/**
 * Hint ladder. `served` = highest level already given on this task (0 = none).
 * Next level is served+1; after 3 failed attempts the ladder starts at level 2.
 * Once level 3 was served, asking again repeats level 3 (free, no new information).
 */
export function resolveHintLevel(served: number, failedAttempts: number): { level: HintLevel; repeat: boolean } {
  const floor = failedAttempts >= 3 ? 2 : 1
  const wanted = Math.max(served + 1, floor)
  const level = Math.min(3, wanted) as HintLevel
  return { level, repeat: level <= served }
}
