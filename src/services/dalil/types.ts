export type DalilAction = 'hint' | 'explainSentence' | 'explainWord' | 'whyWrong' | 'analyzeEvidence'
export type HintLevel = 1 | 2 | 3

/**
 * Everything Dalil is allowed to know. Deliberately contains NO solution data
 * (no correct answers, no solution maps), so a scaffold can never leak the answer.
 */
export interface DalilContext {
  caseId: string
  caseTitleId: string
  taskId: string
  taskType: string
  taskIndex: number
  taskCount: number
  instruction: string
  promptAr?: string
  focusText?: string
  /** Hint level to serve for a 'hint' action (1–3). Resolved by `resolveHintLevel`. */
  hintLevel: HintLevel
  /** True when this level was already served for this task (replay, no new information). */
  hintRepeat?: boolean
  failedAttempts: number
  hintsUsedOnTask: number
  evidence: { id: string; ar: string }[]
  evidenceFound: number
  evidenceTotal: number
  lastMistake?: { message: string; vocab: string[] }
  word?: string
  /** Authored 3-level scaffold for the task. */
  authoredHints: [string, string, string]
}

export interface DalilReply {
  text: string
  /** Set for 'hint' replies: which authored level was served. */
  level?: HintLevel
}
