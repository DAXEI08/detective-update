import { useState } from 'react'
import type { AssignTask as T, EntityKind } from '../../../types'
import { NAME_DEFINITE } from '../../../data/vocabulary'
import { clueNumber, getClue } from '../../../data/cases'
import { Button } from '../../common/Button'
import { DragItem } from '../../common/DragItem'
import { Ar } from '../../common/RichText'
import { EvidenceCard } from '../../evidence/EvidenceCard'
import { EntityGlyph } from '../EntityIcon'
import { FeedbackBanner } from '../FeedbackBanner'
import { TaskPrompt, useFb, useTaskActions } from './common'
import type { TaskProps } from './common'

export function AssignTask({ task, def, solved, onSolved }: TaskProps<T>) {
  const { mistake, focus } = useTaskActions(task)
  const [assign, setAssign] = useState<Record<string, string | null>>(() => Object.fromEntries(task.items.map((i) => [i, null])))
  const [sel, setSel] = useState<EntityKind | null>(null)
  const [wrongItems, setWrongItems] = useState<string[]>([])
  const [fb, setFb] = useFb()

  const inZone = (z: string) => task.items.find((i) => assign[i] === z)

  function put(item: EntityKind, zone: string | null) {
    if (solved) return
    setAssign((a) => {
      const n = { ...a }
      if (zone) { const occ = task.items.find((i) => n[i] === zone); if (occ) n[occ] = null }
      n[item] = zone
      return n
    })
    setWrongItems([])
    setSel(null)
  }
  function drop(item: EntityKind, id: string) {
    if (id === 'tray') put(item, null)
    else if (id.startsWith('zone:')) put(item, id.slice(5))
  }

  function check() {
    if (task.items.some((i) => !assign[i])) { setFb({ kind: 'info', text: 'Tempatkan semua tokoh dulu.' }); return }
    const bad = task.items.filter((i) => assign[i] !== task.solution[i])
    setWrongItems(bad)
    if (bad.length === 0) { onSolved(); return }
    const msg = `Belum tepat untuk **${NAME_DEFINITE[bad[0]]}**. ${task.reasons[bad[0]] ?? ''}`
    mistake(msg, [bad[0], 'fi'])
    setFb({ kind: 'bad', text: msg })
  }
  const tray = task.items.filter((i) => !assign[i])

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-cream-300">Keterangan saksi</h3>
          {task.referenceIds.map((id) => (
            <EvidenceCard key={id} clue={getClue(def, id)!} index={clueNumber(def, id)} compact onClick={() => focus(getClue(def, id)!.ar)} note={solved} />
          ))}
        </div>
        <div>
          <div className="grid gap-2">
            {task.zones.map((z) => {
              const occ = inZone(z.id)
              return (
                <div key={z.id} data-drop={`zone:${z.id}`} onClick={() => sel && put(sel, z.id)}
                  className={`flex min-h-[72px] cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-2 ${occ && wrongItems.includes(occ) ? 'border-bad bg-bad/10' : occ ? 'border-gold-500/70 bg-ink-700' : 'border-ink-500 bg-ink-800/60'}`}
                  role="button" tabIndex={0} aria-label={`Tempat: ${z.ar}`}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && sel) { e.preventDefault(); put(sel, z.id) } }}>
                  <EntityGlyph kind={z.entity} size={44} />
                  <Ar size="md" className="flex-1 text-cream-100">{z.ar}</Ar>
                  {occ && (
                    <DragItem label={`Tokoh ${NAME_DEFINITE[occ]} di ${z.ar}`} disabled={solved} onActivate={() => setSel(sel === occ ? null : occ)} selected={sel === occ}
                      onDropOn={(id) => drop(occ, id)} className="tap flex items-center gap-1 rounded-lg bg-ink-950/60 px-2">
                      <EntityGlyph kind={occ} size={40} />
                    </DragItem>
                  )}
                </div>
              )
            })}
          </div>
          <div data-drop="tray" className="mt-3 flex min-h-[72px] flex-wrap items-center gap-2 rounded-xl border border-dashed border-ink-500 bg-ink-800/50 p-2">
            {tray.length === 0 && <span className="px-2 text-xs text-cream-400">Semua tokoh sudah ditempatkan.</span>}
            {tray.map((i) => (
              <DragItem key={i} label={`Tokoh ${NAME_DEFINITE[i]}`} selected={sel === i} disabled={solved} onActivate={() => setSel(sel === i ? null : i)}
                onDropOn={(id) => drop(i, id)} className="tap flex items-center gap-2 rounded-lg bg-ink-700 px-2 py-1.5">
                <EntityGlyph kind={i} size={40} /><Ar size="sm" className="text-cream-100">{NAME_DEFINITE[i]}</Ar>
              </DragItem>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} />
        {!solved && <Button variant="primary" onClick={check}>Periksa penempatan</Button>}
      </div>
    </div>
  )
}
