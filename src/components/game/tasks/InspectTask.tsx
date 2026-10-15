import { useState } from 'react'
import { Check, Eraser } from 'lucide-react'
import type { EntityKind, InspectTask as T } from '../../../types'
import { clueNumber, getClue } from '../../../data/cases'
import { useGameStore } from '../../../stores/gameStore'
import { Button } from '../../common/Button'
import { EvidenceCard } from '../../evidence/EvidenceCard'
import { FeedbackBanner } from '../FeedbackBanner'
import { HarborScene } from '../HarborScene'
import type { MarkState } from '../HarborScene'
import { TaskPrompt, useFb, useTaskActions } from './common'
import type { TaskProps } from './common'

export function InspectTask({ task, def, solved, onSolved }: TaskProps<T>) {
  const { mistake, focus } = useTaskActions(task)
  const collect = useGameStore((s) => s.collectEvidence)
  const [cur, setCur] = useState<EntityKind | null>(null)
  const [dec, setDec] = useState<Partial<Record<EntityKind, 'saved' | 'ignored'>>>({})
  const [fb, setFb] = useFb()

  const relevantEntities = task.entities.filter((e) => e.relevant)
  const savedCount = relevantEntities.filter((e) => dec[e.entity] === 'saved').length

  const marks: Partial<Record<EntityKind, MarkState>> = {}
  Object.entries(dec).forEach(([k, v]) => { marks[k as EntityKind] = v === 'saved' ? 'saved' : 'ignored' })
  if (cur) marks[cur] = marks[cur] ?? 'selected'

  const info = task.entities.find((e) => e.entity === cur)
  const clue = info?.clueId ? getClue(def, info.clueId) : undefined

  function select(k: EntityKind) {
    setCur(k)
    const e = task.entities.find((x) => x.entity === k)
    if (!e?.clueId) { setFb({ kind: 'info', text: 'Tidak ada petunjuk tertulis pada benda ini.' }); return }
    setFb(null)
    focus(getClue(def, e.clueId)!.ar)
  }

  function save() {
    if (!info || !clue) return
    if (info.relevant) {
      collect(clue.id)
      const next = { ...dec, [info.entity]: 'saved' as const }
      setDec(next)
      setFb({ kind: 'info', text: `Dalil #${clueNumber(def, clue.id)} tersimpan.` })
      if (relevantEntities.every((e) => next[e.entity] === 'saved')) onSolved()
    } else {
      const msg = `Belum tepat. ${info.why ?? 'Kalimat ini tidak membantu penyelidikan.'}`
      mistake(msg, clue.vocab.slice(0, 2))
      setFb({ kind: 'bad', text: msg })
      setDec((d) => ({ ...d, [info.entity]: 'ignored' }))
    }
  }
  function ignore() {
    if (!info || !clue) return
    if (info.relevant) {
      const msg = 'Petunjuk ini sebenarnya penting. Baca ulang kalimatnya: apakah menyebut barang, gudang, atau lokasi tokoh?'
      mistake(msg, clue.vocab.slice(0, 2))
      setFb({ kind: 'bad', text: msg })
    } else {
      setDec((d) => ({ ...d, [info.entity]: 'ignored' }))
      setFb({ kind: 'info', text: 'Petunjuk diabaikan.' })
    }
  }

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <HarborScene entities={task.entities.map((e) => e.entity)} marks={marks} hideBonus onSelect={select} disabled={solved}
        ariaLabelFor={(k, i) => `Benda nomor ${i + 1}${dec[k] ? ` (${dec[k] === 'saved' ? 'disimpan' : 'diabaikan'})` : ''}`} />
      <p className="mt-2 text-xs text-cream-300">Bukti penting tersimpan: {savedCount}/{relevantEntities.length}</p>
      {clue && !solved && (
        <div className="mt-3 grid items-center gap-3 sm:grid-cols-[1fr_auto]">
          <EvidenceCard clue={clue} index={clueNumber(def, clue.id)} />
          {!dec[info!.entity] && (
            <div className="flex gap-2 sm:flex-col">
              <Button variant="primary" icon={<Check size={18} />} onClick={save}>Simpan sebagai bukti</Button>
              <Button icon={<Eraser size={18} />} onClick={ignore}>Abaikan</Button>
            </div>
          )}
        </div>
      )}
      <div className="mt-3"><FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} /></div>
    </div>
  )
}
