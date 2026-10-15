import { useState } from 'react'
import type { Cell, EntityKind, PlacementTask as T } from '../../../types'
import { checkConstraint, landmarkPositions } from '../../../engine/spatial'
import type { Positions } from '../../../engine/spatial'
import { getPrep, NAME_DEFINITE } from '../../../data/vocabulary'
import { clueNumber, getClue } from '../../../data/cases'
import { Button } from '../../common/Button'
import { DragItem } from '../../common/DragItem'
import { EvidenceCard } from '../../evidence/EvidenceCard'
import { EntityGlyph } from '../EntityIcon'
import { FeedbackBanner } from '../FeedbackBanner'
import { GridMap } from '../GridMap'
import { Ar } from '../../common/RichText'
import { TaskPrompt, useFb, useTaskActions } from './common'
import type { TaskProps } from './common'

export function PlacementTask({ task, def, solved, onSolved }: TaskProps<T>) {
  const { mistake, focus } = useTaskActions(task)
  const [placed, setPlaced] = useState<Record<string, Cell | null>>(() => Object.fromEntries(task.movables.map((m) => [m, null])))
  const [selected, setSelected] = useState<EntityKind | null>(null)
  const [status, setStatus] = useState<Record<string, boolean>>({})
  const [fb, setFb] = useFb()

  const occupant = (c: Cell) => task.movables.find((m) => placed[m] && placed[m]!.col === c.col && placed[m]!.row === c.row)

  function place(kind: EntityKind, cell: Cell) {
    const occ = occupant(cell)
    if (occ && occ !== kind) { setFb({ kind: 'info', text: 'Kotak itu sudah terisi. Satu kotak hanya untuk satu benda.' }); return }
    setPlaced((p) => ({ ...p, [kind]: cell }))
    setStatus({})
    setFb(null)
  }
  const unplace = (kind: EntityKind) => { setPlaced((p) => ({ ...p, [kind]: null })); setStatus({}) }

  function handleDrop(kind: EntityKind, dropId: string) {
    if (solved) return
    if (dropId === 'tray') { unplace(kind); return }
    const m = /^cell:(\d+):(\d+)$/.exec(dropId)
    if (m) place(kind, { col: Number(m[1]), row: Number(m[2]) })
  }
  function onCellClick(cell: Cell) {
    if (solved) return
    if (selected) { place(selected, cell); setSelected(null); return }
    const occ = occupant(cell)
    if (occ) setSelected(occ)
  }

  function check() {
    const missing = task.movables.filter((m) => !placed[m])
    if (missing.length) { setFb({ kind: 'info', text: 'Letakkan semua benda di peta dulu, baru periksa.' }); return }
    const pos: Positions = { ...landmarkPositions(task.map) }
    task.movables.forEach((m) => { pos[m] = placed[m]! })
    const res: Record<string, boolean> = {}
    task.constraints.forEach((c) => { res[c.clueId] = checkConstraint(c, pos) })
    setStatus(res)
    const bad = task.constraints.find((c) => !res[c.clueId])
    if (!bad) { onSolved(); return }
    const prep = getPrep(bad.rel)
    const clue = getClue(def, bad.clueId)
    const msg = `Belum tepat. Perhatikan kata **${prep?.ar}** pada petunjuk: **${clue?.ar}** Cek lagi posisi **${NAME_DEFINITE[bad.subject] ?? ''}**.`
    mistake(msg, [bad.rel])
    setFb({ kind: 'bad', text: msg })
  }

  const items = task.movables.filter((m) => placed[m]).map((m) => ({ kind: m, col: placed[m]!.col, row: placed[m]!.row }))
  const tray = task.movables.filter((m) => !placed[m])

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-cream-300">Petunjuk tertulis</h3>
          {task.constraints.map((c) => {
            const clue = getClue(def, c.clueId)!
            return (
              <EvidenceCard key={c.clueId} clue={clue} index={clueNumber(def, c.clueId)} compact
                note={solved} onClick={() => focus(clue.ar)}
                badge={status[c.clueId] === undefined ? undefined : status[c.clueId] ? '✓ cocok' : '✗ belum'} />
            )
          })}
        </div>
        <div>
          <GridMap map={task.map} items={items} onCellClick={onCellClick}
            cellExtra={(cell) => {
              const occ = occupant(cell)
              if (!occ) return null
              return (
                <DragItem label={`Benda di baris ${cell.row + 1} kolom ${cell.col + 1}`} selected={selected === occ} disabled={solved}
                  onActivate={() => onCellClick(cell)} onDropOn={(id) => handleDrop(occ, id)} className="absolute inset-0 z-10 rounded-md">
                  <span className="block h-full w-full" />
                </DragItem>
              )
            }} />
          <div data-drop="tray" onClick={() => { if (selected && placed[selected]) { unplace(selected); setSelected(null) } }}
            className="mt-3 flex min-h-[72px] flex-wrap items-center gap-2 rounded-xl border border-dashed border-ink-500 bg-ink-800/50 p-2" aria-label="Benda yang belum diletakkan">
            {tray.length === 0 && <span className="px-2 text-xs text-cream-400">Semua benda sudah di peta. Ketuk benda di peta lalu ketuk kotak lain untuk memindahkan.</span>}
            {tray.map((m) => (
              <DragItem key={m} label={`Benda ${NAME_DEFINITE[m]}`} selected={selected === m} disabled={solved}
                onActivate={() => setSelected(selected === m ? null : m)} onDropOn={(id) => handleDrop(m, id)}
                className="tap flex items-center gap-2 rounded-lg bg-ink-700 px-2 py-1.5">
                <EntityGlyph kind={m} size={36} /><Ar size="sm" className="text-cream-100">{NAME_DEFINITE[m]}</Ar>
              </DragItem>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} />
        {!solved && <Button variant="primary" onClick={check}>Periksa posisi</Button>}
      </div>
    </div>
  )
}
