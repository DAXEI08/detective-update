import { useCallback, useState } from 'react'
import type { CaseDefinition, Task } from '../../../types'
import { useGameStore } from '../../../stores/gameStore'
import type { Feedback } from '../FeedbackBanner'

export interface TaskProps<T extends Task> {
  task: T
  def: CaseDefinition
  solved: boolean
  onSolved: (text?: string) => void
}

let fbKey = 1
export function useFb() {
  const [fb, set] = useState<Feedback | null>(null)
  const setFb = useCallback((f: Omit<Feedback, 'key'> | null) => set(f ? { ...f, key: fbKey++ } : null), [])
  return [fb, setFb] as const
}

export function useTaskActions(task: Task) {
  const recordMistake = useGameStore((s) => s.recordMistake)
  const setFocus = useGameStore((s) => s.setFocus)
  return {
    mistake: (message: string, vocab: string[] = task.vocab) => recordMistake(task.id, message, vocab),
    focus: (t: string) => setFocus(t),
  }
}

export function TaskPrompt({ instruction, children }: { instruction: string; children?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-sm text-cream-300">{instruction}</p>
      {children}
    </div>
  )
}
