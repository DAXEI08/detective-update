import type { Cell, EntityKind, MapDef, SpatialConstraint } from '../types'

export type Positions = Partial<Record<EntityKind, Cell>>

/**
 * Spatial semantics on the "front-facing" map: every building/ship faces DOWN (toward the quay).
 *  أَمَامَ  = the cell directly below      خَلْفَ = the cell directly above
 *  بِجَانِبِ = left/right neighbour, same row  بَيْنَ = same row, strictly between the two anchors
 *  فِي      = same cell                   قُرْبَ = within 2 cells (not the same cell)
 */
export function relationHolds(rel: SpatialConstraint['rel'], s: Cell, o: Cell, o2?: Cell): boolean {
  switch (rel) {
    case 'amama': return s.col === o.col && s.row === o.row + 1
    case 'khalfa': return s.col === o.col && s.row === o.row - 1
    case 'bijanib': return s.row === o.row && Math.abs(s.col - o.col) === 1
    case 'bayna': {
      if (!o2) return false
      const lo = Math.min(o.col, o2.col)
      const hi = Math.max(o.col, o2.col)
      return s.row === o.row && s.row === o2.row && s.col > lo && s.col < hi
    }
    case 'fi': return s.col === o.col && s.row === o.row
    case 'qurba': {
      const d = Math.max(Math.abs(s.col - o.col), Math.abs(s.row - o.row))
      return d >= 1 && d <= 2
    }
  }
}

export function checkConstraint(c: SpatialConstraint, pos: Positions): boolean {
  const s = pos[c.subject]
  const o = pos[c.objects[0]]
  const o2 = c.objects[1] ? pos[c.objects[1]] : undefined
  if (!s || !o) return false
  if (c.objects.length > 1 && !o2) return false
  return relationHolds(c.rel, s, o, o2)
}

export function landmarkPositions(map: MapDef): Positions {
  const p: Positions = {}
  map.landmarks.forEach((l) => { p[l.kind] = { col: l.col, row: l.row } })
  return p
}

export const cellKey = (c: Cell) => `${c.col}:${c.row}`
