import { useState } from 'react'
import type { SceneChoiceTask as T } from '../../../types'
import { Button } from '../../common/Button'
import { Ar } from '../../common/RichText'
import { FeedbackBanner } from '../FeedbackBanner'
import { GridMap } from '../GridMap'
import { TaskPrompt, useFb, useTaskActions } from './common'
import type { TaskProps } from './common'

export function SceneChoiceTask({ task, solved, onSolved }: TaskProps<T>) {
  const { mistake } = useTaskActions(task)
  const [sel, setSel] = useState<string | null>(null)
  const [fb, setFb] = useFb()
  const letters = ['A', 'B', 'C', 'D']

  function submit() {
    if (!sel) { setFb({ kind: 'info', text: 'Pilih salah satu gambar dulu.' }); return }
    if (sel === task.correct) { onSolved(); return }
    const msg = `Belum tepat. ${task.wrongNotes[sel] ?? 'Cocokkan kata tempat pada petunjuk dengan posisi di gambar.'}`
    mistake(msg, ['bijanib', 'khalfa', 'amama'])
    setFb({ kind: 'bad', text: msg })
  }

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <div className="paper mb-4 px-4 py-3 text-center"><Ar size="lg" className="text-ink-900">{task.promptAr}</Ar></div>
      <div className="grid grid-cols-3 gap-2 sm:gap-4" role="radiogroup" aria-label="Pilihan gambar">
        {task.options.map((o, i) => (
          <button key={o.id} role="radio" aria-checked={sel === o.id} disabled={solved} onClick={() => setSel(o.id)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-2 sm:p-3 ${sel === o.id ? 'border-gold-400 bg-ink-700 shadow-glow' : 'border-ink-600 bg-ink-800 hover:border-ink-400'}`}>
            <GridMap map={o.map} items={o.placed} small label={`Gambar ${letters[i]}`} />
            <span className="text-sm font-semibold">Gambar {letters[i]}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} />
        {!solved && <Button variant="primary" onClick={submit}>Ajukan gambar ini</Button>}
      </div>
    </div>
  )
}
