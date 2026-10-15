import { useEffect, useState } from 'react'
import { Ban } from 'lucide-react'
import type { EliminationTask as T } from '../../../types'
import { clueNumber, getClue } from '../../../data/cases'
import { useGameStore } from '../../../stores/gameStore'
import { Button } from '../../common/Button'
import { Ar } from '../../common/RichText'
import { EvidenceCard } from '../../evidence/EvidenceCard'
import { EntityGlyph } from '../EntityIcon'
import { FeedbackBanner } from '../FeedbackBanner'
import { TaskPrompt, useFb, useTaskActions } from './common'
import type { TaskProps } from './common'

export function EliminationTask({ task, def, solved, onSolved }: TaskProps<T>) {
  const { mistake, focus } = useTaskActions(task)
  const collected = useGameStore((s) => s.session?.evidence ?? [])
  const [out, setOut] = useState<Record<string, string>>({})
  const [cand, setCand] = useState<string | null>(null)
  const [ev, setEv] = useState<string | null>(null)
  const [fb, setFb] = useFb()

  const pool = task.evidenceIds.filter((id) => collected.includes(id))
  const remaining = task.candidates.filter((c) => !out[c.id])

  useEffect(() => {
    if (!cand || !ev) return
    const c = task.candidates.find((x) => x.id === cand)!
    const ok = task.eliminatedBy[cand]?.includes(ev)
    if (ok) {
      setOut((o) => ({ ...o, [cand]: ev }))
      setFb({ kind: 'info', text: `**${c.ar}** disingkirkan oleh dalil #${clueNumber(def, ev)}.` })
    } else {
      const msg = `Belum tepat. Dalil itu tidak menyingkirkan **${c.ar}**. ${task.wrongHint}`
      mistake(msg, [c.entity])
      setFb({ kind: 'bad', text: msg })
    }
    setCand(null); setEv(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cand, ev])

  const final = remaining.length === 1 ? remaining[0] : null

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <p className="paper mb-4 px-4 py-2 text-sm font-semibold">{task.question}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-semibold text-cream-300">1 · Pilih kemungkinan</h3>
          <div className="grid gap-2">
            {task.candidates.map((c) => {
              const gone = Boolean(out[c.id])
              return (
                <button key={c.id} disabled={gone || solved} aria-pressed={cand === c.id} onClick={() => setCand(cand === c.id ? null : c.id)}
                  className={`tap relative flex items-center gap-3 rounded-xl border p-2 text-left ${cand === c.id ? 'border-gold-400 bg-ink-700 shadow-glow' : 'border-ink-600 bg-ink-800'} ${gone ? 'opacity-50' : ''}`}>
                  <EntityGlyph kind={c.entity} size={44} />
                  <Ar size="md" className={`flex-1 ${gone ? 'line-through' : ''}`}>{c.ar}</Ar>
                  {gone && <span className="chip"><Ban size={12} /> tersingkir · #{clueNumber(def, out[c.id])}</span>}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold text-cream-300">2 · Pilih bukti penyingkir</h3>
          <div className="grid gap-2">
            {pool.map((id) => (
              <EvidenceCard key={id} clue={getClue(def, id)!} index={clueNumber(def, id)} compact selected={ev === id}
                onClick={() => { if (solved) return; focus(getClue(def, id)!.ar); setEv(ev === id ? null : id) }} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} />
        {!solved && final && (
          <Button variant="primary" onClick={() => onSolved()}>Tetapkan kesimpulan: <Ar size="sm">{final.ar}</Ar></Button>
        )}
      </div>
    </div>
  )
}
