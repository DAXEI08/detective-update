export type VocabId =
  | 'ship' | 'warehouse' | 'crane' | 'officer' | 'passengers' | 'captain'
  | 'waitingHall' | 'cargo' | 'container' | 'lifeboat' | 'buoy'
export type PrepId = 'amama' | 'khalfa' | 'bijanib' | 'bayna' | 'fi' | 'qurba'
export type EntityKind = VocabId | 'clipboard'

export interface VocabEntry { id: VocabId; ar: string; idn: string; cue: string }
export interface PrepEntry { id: PrepId; ar: string; idn: string }

/** A piece of written Arabic evidence. */
export interface Clue {
  id: string
  ar: string
  /** Indonesian note, revealed only after the task that uses the clue is solved. */
  note: string
  entity?: EntityKind
  speaker?: EntityKind
  vocab: string[]
  /** Counts toward "evidence found". Distractors have isEvidence = false. */
  isEvidence: boolean
  /** Hidden bonus evidence (unlocks the "Sharp Eye" achievement). */
  hidden?: boolean
}

export interface Cell { col: number; row: number }
export interface MapDef {
  cols: number
  rows: number
  landmarks: { kind: EntityKind; col: number; row: number }[]
}
export interface SpatialConstraint {
  clueId: string
  subject: EntityKind
  rel: PrepId
  objects: EntityKind[]
}
export interface MiniMapOption {
  id: string
  map: MapDef
  placed: { kind: EntityKind; col: number; row: number }[]
}

interface TaskBase {
  id: string
  titleId: string
  instruction: string
  promptAr?: string
  /** Arabic sentence that Dalil explains by default for this task. */
  focusText?: string
  /** Vocabulary / preposition ids this task trains (used for analytics). */
  vocab: string[]
  /** Three scaffolded hint levels (general → specific → linguistic). Never the final answer. */
  hints: [string, string, string]
  /** Clue ids collected when the task is solved. */
  collects?: string[]
  /** Contextual feedback shown on success. */
  success: string
}

export interface HotspotTask extends TaskBase {
  type: 'hotspot'
  target: EntityKind
  clueId: string
  bonus?: { entity: EntityKind; clueId: string }
}
export interface SceneChoiceTask extends TaskBase {
  type: 'scene-choice'
  clueId: string
  options: MiniMapOption[]
  correct: string
  wrongNotes: Record<string, string>
}
export interface PlacementTask extends TaskBase {
  type: 'placement'
  map: MapDef
  movables: EntityKind[]
  constraints: SpatialConstraint[]
}
export interface DialogueTask extends TaskBase {
  type: 'dialogue'
  question: string
  statementIds: string[]
  relevant: string[]
  reasons: Record<string, string>
}
export interface AssignTask extends TaskBase {
  type: 'assign'
  items: EntityKind[]
  zones: { id: string; ar: string; entity: EntityKind }[]
  solution: Record<string, string>
  reasons: Record<string, string>
  referenceIds: string[]
}
export interface BoardTask extends TaskBase {
  type: 'board'
  phase: 'sort' | 'connect'
  cardIds: string[]
  relevant: string[]
  reasons: Record<string, string>
  validLinks?: [string, string][]
  requiredLinks?: [string, string][]
}
export interface EliminationTask extends TaskBase {
  type: 'elimination'
  question: string
  candidates: { id: string; ar: string; entity: EntityKind }[]
  answer: string
  eliminatedBy: Record<string, string[]>
  evidenceIds: string[]
  wrongHint: string
}
export interface SequenceTask extends TaskBase {
  type: 'sequence'
  eventIds: string[]
  order: string[]
  note: string
}
export interface InspectTask extends TaskBase {
  type: 'inspect'
  entities: { entity: EntityKind; clueId?: string; relevant?: boolean; why?: string }[]
}
export interface ReportOption { id: string; ar: string; entity?: EntityKind; map?: MiniMapOption }
export interface ReportField {
  key: string
  labelAr: string
  labelId: string
  options: ReportOption[]
  correct: string
  wrongNote: Record<string, string>
}
export interface ReportTask extends TaskBase {
  type: 'report'
  fields: ReportField[]
  evidencePicker?: { validIds: string[]; min: number; invalidNote: string }
}

export type Task =
  | HotspotTask | SceneChoiceTask | PlacementTask | DialogueTask | AssignTask
  | BoardTask | EliminationTask | SequenceTask | InspectTask | ReportTask

export interface CaseDefinition {
  id: string
  number: number
  titleAr: string
  titleId: string
  description: string
  story: string
  difficulty: number
  learningLevel: string
  mechanic: string
  objectives: string[]
  vocabulary: string[]
  showVocabMeaning: boolean
  clues: Clue[]
  tasks: Task[]
  solution: { summary: string; evidenceIds: string[] }
  reveal?: { lines: { ar: string; id: string }[]; conclusion: string }
}

/* ---------------- persistence / player data ---------------- */

export interface VocabStat { c: number; w: number }

export interface CaseResult {
  caseId: string
  at: number
  accuracy: number
  xp: number
  stars: number
  correct: number
  mistakes: number
  hints: number
  evidenceFound: number
  evidenceTotal: number
  timeMs: number
  vocab: Record<string, VocabStat>
  firstClear: boolean
}

export interface CaseProgress {
  caseId: string
  completed: boolean
  stars: number
  bestXp: number
  bestAccuracy: number
  bestTimeMs: number | null
  attempts: number
  lastPlayedAt: number
  lastResult: CaseResult | null
}

export interface PlayerProfile {
  id: string
  name: string
  className: string
  createdAt: number
  tutorialDone: boolean
  progress: Record<string, CaseProgress>
  vocabStats: Record<string, VocabStat>
  totals: { attempts: number; correct: number; mistakes: number; hints: number; timeMs: number }
  achievements: Record<string, number>
  results: CaseResult[]
}

export interface Settings { reduceMotion: boolean; demoUnlock: boolean }

export interface PersistedState {
  version: 1
  activePlayerId: string | null
  players: Record<string, PlayerProfile>
  settings: Settings
}
