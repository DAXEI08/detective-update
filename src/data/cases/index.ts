import type { CaseDefinition } from '../../types'
import { case1 } from './case1'
import { case2 } from './case2'
import { case3 } from './case3'
import { case4 } from './case4'
import { case5 } from './case5'

export const CASES: CaseDefinition[] = [case1, case2, case3, case4, case5]
export const getCase = (id: string | undefined): CaseDefinition | undefined => CASES.find((c) => c.id === id)
export const getClue = (def: CaseDefinition, id: string) => def.clues.find((c) => c.id === id)
export const evidenceTotal = (def: CaseDefinition) => def.clues.filter((c) => c.isEvidence).length
export const clueNumber = (def: CaseDefinition, id: string) => def.clues.findIndex((c) => c.id === id) + 1
