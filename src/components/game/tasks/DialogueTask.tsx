import { useState } from 'react'
import { Flag } from 'lucide-react'
import type { DialogueTask as T } from '../../../types'
import { NAME_DEFINITE } from '../../../data/vocabulary'
import { clueNumber, getClue } from '../../../data/cases'
import { Button } from '../../common/Button'
import { Ar } from '../../common/RichText'
import { EntityGlyph } from '../EntityIcon'
import { FeedbackBanner } from '../FeedbackBanner'
import { TaskPrompt, useFb, useTaskActions } from './common'
import type { TaskProps } from './common'

export function DialogueTask({ task, def, solved, onSolved }: TaskProps<T>) {
  const { mistake, focus } = useTaskActions(task)
  const [marked, setMarked] = useState<Set<string>>(new Set())
  const [fb, setFb] = useFb()

  const toggle = (id: string) => {
    if (solved) return
    setMarked((m) => { const n = new Set(m); if (n.has(id)) n.delete(id); else n.add(id); return n })
    const c = getClue(def, id)
    if (c) focus(c.ar)
  }

  function submit() {
    if (marked.size === 0) { setFb({ kind: 'info', text: 'Tandai dulu kalimat yang menurutmu penting.' }); return }
    const wrong = task.statementIds.find((id) => marked.has(id) && !task.relevant.includes(id))
    const missed = task.statementIds.find((id) => !marked.has(id) && task.relevant.includes(id))
    if (!wrong && !missed) { onSolved(); return }
    const msg = wrong
      ? `Belum tepat. ${task.reasons[wrong] ?? 'Kalimat itu tidak menjawab pertanyaan.'}`
      : 'Masih ada kalimat penting yang belum kamu tandai. Cari kalimat lain yang menyebut tokoh beserta tempatnya.'
    mistake(msg, wrong ? getClue(def, wrong)?.vocab.slice(0, 2) : task.vocab.slice(0, 2))
    setFb({ kind: 'bad', text: msg })
  }

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <p className="paper mb-4 px-4 py-2 text-sm font-semibold">{task.question}</p>
      <ul className="flex flex-col gap-3">
        {task.statementIds.map((id) => {
          const c = getClue(def, id)!
          const on = marked.has(id)
          const ok = solved && task.relevant.includes(id)
          return (
            <li key={id} className="flex items-stretch gap-3">
              <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-ink-700 py-2">
                <EntityGlyph kind={c.speaker ?? 'officer'} size={40} />
                <Ar size="sm" className="text-cream-200 !leading-snug">{NAME_DEFINITE[c.speaker ?? 'officer']}</Ar>
              </div>
              <div className={`paper relative flex-1 p-3 ${on ? 'ring-4 ring-gold-400' : ''}`}>
                <span className="absolute -left-1.5 top-5 h-3 w-3 rotate-45 bg-cream-100" aria-hidden />
                <span className="text-[11px] font-semibold text-ink-600">الدَّلِيلُ #{clueNumber(def, id)}</span>
                <Ar size="md" className="block text-ink-900">{c.ar}</Ar>
                {solved && <span className="block text-xs text-ink-600">{c.note}{ok ? '' : ' — tidak relevan'}</span>}
                <button onClick={() => toggle(id)} aria-pressed={on} disabled={solved}
                  className={`tap mt-1 inline-flex items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${on ? 'bg-gold-500 text-ink-900' : 'bg-ink-800 text-cream-100'}`}>
                  <Flag size={15} /> {on ? 'Ditandai penting' : 'Tandai penting'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-3 flex flex-col gap-3">
        <FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} />
        {!solved && <Button variant="primary" onClick={submit}>Simpan catatan saksi</Button>}
      </div>
    </div>
  )
}
