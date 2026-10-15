import type { ReactNode } from 'react'
import type { Cell, EntityKind, MapDef } from '../../types'
import { EntityGlyph } from './EntityIcon'

interface Props {
  map: MapDef
  items?: { kind: EntityKind; col: number; row: number }[]
  /** Interactive content (draggable movables) rendered inside a cell. */
  cellExtra?: (cell: Cell) => ReactNode
  onCellClick?: (cell: Cell) => void
  selectedCell?: Cell | null
  small?: boolean
  label?: string
}

/** Front-facing harbor map. Buildings face DOWN (toward the quay). Cells are drop zones (data-drop). */
export function GridMap({ map, items = [], cellExtra, onCellClick, small, label = 'Peta dermaga' }: Props) {
  const interactive = Boolean(onCellClick)
  return (
    <div className={`w-full ${small ? 'max-w-[190px]' : ''}`}>
      <div className="grid gap-1 rounded-xl border border-ink-600 bg-ink-950/60 p-1.5" role="grid" aria-label={label}
        style={{ gridTemplateColumns: `repeat(${map.cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: map.rows * map.cols }).map((_, i) => {
          const col = i % map.cols
          const row = Math.floor(i / map.cols)
          const lm = map.landmarks.find((l) => l.col === col && l.row === row)
          const placed = items.filter((it) => it.col === col && it.row === row)
          return (
            <div
              key={i} role="gridcell" data-drop={`cell:${col}:${row}`}
              tabIndex={interactive ? 0 : -1}
              aria-label={`Baris ${row + 1}, kolom ${col + 1}`}
              onClick={() => onCellClick?.({ col, row })}
              onKeyDown={(e) => { if (interactive && (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onCellClick?.({ col, row }) } }}
              className={`relative aspect-square rounded-md border ${lm ? 'border-ink-500 bg-ink-700' : 'border-ink-700 bg-ink-800/80'} ${interactive ? 'cursor-pointer hover:border-gold-500/70' : ''}`}
            >
              {lm && <div className="absolute inset-0 grid place-items-center p-[10%]"><EntityGlyph kind={lm.kind} size={small ? 34 : 56} className="h-full w-full" /></div>}
              {placed.map((p, k) => (
                <div key={p.kind} className="absolute grid place-items-center rounded-md bg-ink-950/70 ring-1 ring-gold-500"
                  style={lm ? { right: 2, bottom: 2, width: '48%', height: '48%', zIndex: 2 + k } : { inset: '8%' }}>
                  <EntityGlyph kind={p.kind} className="h-full w-full p-0.5" size={small ? 26 : 44} />
                </div>
              ))}
              {cellExtra?.({ col, row })}
            </div>
          )
        })}
      </div>
      <p className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-cream-400" aria-hidden>▼ dermaga · semua bangunan menghadap ke bawah</p>
    </div>
  )
}
