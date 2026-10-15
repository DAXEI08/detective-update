import { useState } from 'react'
import { Reorder } from 'framer-motion'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import type { SequenceTask as T } from '../../../types'
import { getClue } from '../../../data/cases'
import { Button } from '../../common/Button'
import { Ar } from '../../common/RichText'
import { EntityGlyph } from '../EntityIcon'
import { FeedbackBanner } from '../FeedbackBanner'
import { TaskPrompt, useFb, useTaskActions } from './common'
import type { TaskProps } from './common'

export function SequenceTask({ task, def, solved, onSolved }: TaskProps<T>) {
  const { mistake, focus } = useTaskActions(task)
  const [order, setOrder] = useState<string[]>(task.eventIds)
  const [fb, setFb] = useFb()

  const move = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= order.length || solved) return
    const n = [...order]; [n[i], n[j]] = [n[j], n[i]]
    setOrder(n)
  }
  function check() {
    const wrong = order.findIndex((id, i) => id !== task.order[i])
    if (wrong === -1) { onSolved(); return }
    const msg = `Urutan ke-${wrong + 1} belum tepat. Pikirkan lagi kejadian apa yang harus terjadi lebih dulu sebelum kalimat itu.`
    mistake(msg, getClue(def, order[wrong])?.vocab.slice(0, 2))
    setFb({ kind: 'bad', text: msg })
  }

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <p className="panel mb-3 px-3 py-2 text-xs text-cream-300">{task.note}</p>
      <Reorder.Group axis="y" values={order} onReorder={(v) => !solved && setOrder(v)} className="flex flex-col gap-2">
        {order.map((id, i) => {
          const c = getClue(def, id)!
          return (
            <Reorder.Item key={id} value={id} dragListener={!solved} className="paper flex items-center gap-3 p-2 pr-1">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-900 text-sm font-bold text-gold-400">{i + 1}</span>
              <GripVertical size={18} className="text-ink-500" aria-hidden />
              <Ar size="md" className="flex-1 text-ink-900">{c.ar}</Ar>
              {c.vocab[0] && <EntityGlyph kind={c.vocab[0] as never} size={28} />}
              <span className="flex flex-col">
                <button aria-label="Naikkan" disabled={solved || i === 0} onClick={() => { focus(c.ar); move(i, -1) }} className="tap grid h-[22px] place-items-center text-ink-700 disabled:opacity-30"><ArrowUp size={18} /></button>
                <button aria-label="Turunkan" disabled={solved || i === order.length - 1} onClick={() => { focus(c.ar); move(i, 1) }} className="tap grid h-[22px] place-items-center text-ink-700 disabled:opacity-30"><ArrowDown size={18} /></button>
              </span>
            </Reorder.Item>
          )
        })}
      </Reorder.Group>
      <div className="mt-3 flex flex-col gap-3">
        <FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} />
        {!solved && <Button variant="primary" onClick={check}>Periksa urutan</Button>}
      </div>
    </div>
  )
}
