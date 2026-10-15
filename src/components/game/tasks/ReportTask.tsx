import { useState } from 'react'
import type { ReportTask as T } from '../../../types'
import { clueNumber, getClue } from '../../../data/cases'
import { useGameStore } from '../../../stores/gameStore'
import { Button } from '../../common/Button'
import { Ar } from '../../common/RichText'
import { EvidenceCard } from '../../evidence/EvidenceCard'
import { EntityGlyph } from '../EntityIcon'
import { FeedbackBanner } from '../FeedbackBanner'
import { GridMap } from '../GridMap'
import { TaskPrompt, useFb, useTaskActions } from './common'
import type { TaskProps } from './common'

export function ReportTask({ task, def, solved, onSolved }: TaskProps<T>) {
  const { mistake, focus } = useTaskActions(task)
  const collected = useGameStore((s) => s.session?.evidence ?? [])
  const [vals, setVals] = useState<Record<string, string>>({})
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [fb, setFb] = useFb()
  const pool = def.clues.filter((c) => c.isEvidence && collected.includes(c.id))

  function submit() {
    const empty = task.fields.find((f) => !vals[f.key])
    if (empty) { setFb({ kind: 'info', text: `Lengkapi bagian "${empty.labelId}" dulu.` }); return }
    const wrong = task.fields.find((f) => vals[f.key] !== f.correct)
    if (wrong) {
      const msg = `Belum tepat untuk "${wrong.labelId}". ${wrong.wrongNote[vals[wrong.key]] ?? 'Cocokkan dengan bukti yang sudah kamu kumpulkan.'}`
      mistake(msg, task.vocab.slice(0, 2))
      setFb({ kind: 'bad', text: msg })
      return
    }
    const ep = task.evidencePicker
    if (ep) {
      const ids = Array.from(picked)
      const invalid = ids.some((i) => !ep.validIds.includes(i))
      if (invalid || ids.length < ep.min) {
        const msg = invalid ? ep.invalidNote : `Pilih minimal ${ep.min} bukti yang mendukung kesimpulanmu.`
        mistake(msg, task.vocab.slice(0, 2))
        setFb({ kind: 'bad', text: msg })
        return
      }
    }
    onSolved()
  }

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <div className="grid gap-4">
        {task.fields.map((f) => (
          <fieldset key={f.key} className="panel p-3" disabled={solved}>
            <legend className="px-1 text-sm"><Ar size="md" className="text-gold-400">{f.labelAr}</Ar> <span className="ml-2 text-xs text-cream-300">{f.labelId}</span></legend>
            <div className="mt-1 grid grid-cols-3 gap-2" role="radiogroup" aria-label={f.labelId}>
              {f.options.map((o) => (
                <button key={o.id} role="radio" aria-checked={vals[f.key] === o.id} onClick={() => { setVals((v) => ({ ...v, [f.key]: o.id })); focus(o.ar) }}
                  className={`tap flex flex-col items-center gap-1 rounded-xl border p-2 ${vals[f.key] === o.id ? 'border-gold-400 bg-ink-700 shadow-glow' : 'border-ink-600 bg-ink-800 hover:border-ink-400'}`}>
                  {o.entity && <EntityGlyph kind={o.entity} size={44} />}
                  {o.map && <GridMap map={o.map.map} items={o.map.placed} small />}
                  <Ar size="sm" className="text-cream-100">{o.ar}</Ar>
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        {task.evidencePicker && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Pilih bukti yang mendukung kesimpulan (minimal {task.evidencePicker.min})</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {pool.map((c) => (
                <EvidenceCard key={c.id} clue={c} index={clueNumber(def, c.id)} compact selected={picked.has(c.id)}
                  onClick={() => { if (solved) return; focus(c.ar); setPicked((p) => { const n = new Set(p); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n }) }} />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} />
        {!solved && <Button variant="primary" onClick={submit}>Ajukan kesimpulan</Button>}
      </div>
    </div>
  )
}
