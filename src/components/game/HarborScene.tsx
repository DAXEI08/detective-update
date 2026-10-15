import type { EntityKind } from '../../types'
import { getVocab } from '../../data/vocabulary'
import { EntityShape } from './EntityIcon'
import { useNarrow } from './useNarrow'

interface Place { cx: number; by: number; s: number }
const WIDE: Record<EntityKind, Place> = {
  warehouse: { cx: 110, by: 345, s: 190 }, waitingHall: { cx: 300, by: 345, s: 135 }, crane: { cx: 440, by: 345, s: 170 },
  ship: { cx: 665, by: 318, s: 245 }, captain: { cx: 705, by: 262, s: 50 },
  cargo: { cx: 80, by: 442, s: 88 }, officer: { cx: 170, by: 442, s: 74 }, container: { cx: 278, by: 442, s: 118 },
  passengers: { cx: 385, by: 442, s: 84 }, buoy: { cx: 470, by: 440, s: 54 }, lifeboat: { cx: 578, by: 442, s: 118 },
  clipboard: { cx: 745, by: 442, s: 40 },
}
const TALL: Record<EntityKind, Place> = {
  ship: { cx: 262, by: 292, s: 210 }, captain: { cx: 296, by: 218, s: 46 },
  warehouse: { cx: 85, by: 402, s: 150 }, waitingHall: { cx: 225, by: 402, s: 112 }, crane: { cx: 345, by: 402, s: 124 },
  cargo: { cx: 62, by: 505, s: 80 }, officer: { cx: 140, by: 505, s: 70 }, container: { cx: 258, by: 505, s: 110 }, buoy: { cx: 352, by: 500, s: 50 },
  passengers: { cx: 82, by: 596, s: 84 }, lifeboat: { cx: 222, by: 596, s: 112 }, clipboard: { cx: 340, by: 590, s: 38 },
}
const ORDER: EntityKind[] = ['ship', 'warehouse', 'waitingHall', 'crane', 'captain', 'cargo', 'officer', 'container', 'passengers', 'buoy', 'lifeboat', 'clipboard']

export type MarkState = 'found' | 'saved' | 'ignored' | 'selected'
interface Props {
  entities?: EntityKind[]
  marks?: Partial<Record<EntityKind, MarkState>>
  /** Which entities show their Arabic label (after being found). */
  labeled?: EntityKind[]
  onSelect: (k: EntityKind) => void
  disabled?: boolean
  ariaLabelFor?: (k: EntityKind, i: number) => string
  hideBonus?: boolean
}

export function HarborScene({ entities, marks = {}, labeled = [], onSelect, disabled, ariaLabelFor, hideBonus }: Props) {
  const narrow = useNarrow(640)
  const L = narrow ? TALL : WIDE
  const W = narrow ? 400 : 800
  const H = narrow ? 620 : 460
  const seaTop = narrow ? 150 : 215
  const seaBot = narrow ? 300 : 335
  const quay = narrow ? 300 : 335
  const list = ORDER.filter((k) => (entities ? entities.includes(k) : true))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-hidden rounded-xl border border-ink-600" role="group" aria-label="Pemandangan pelabuhan">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0E2540" /><stop offset="1" stopColor="#3B5F7F" /></linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1C5F7C" /><stop offset="1" stopColor="#123F58" /></linearGradient>
        <linearGradient id="quay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4B5D72" /><stop offset="1" stopColor="#35465A" /></linearGradient>
      </defs>
      <rect width={W} height={seaTop} fill="url(#sky)" />
      <circle cx={narrow ? 70 : 120} cy={narrow ? 70 : 85} r="26" fill="#F2B33D" opacity=".85" />
      <path d={`M0 ${seaTop} L40 ${seaTop - 30} L80 ${seaTop - 12} L130 ${seaTop - 40} L190 ${seaTop - 10} L${W} ${seaTop - 18} L${W} ${seaTop} Z`} fill="#0B1B2E" opacity=".55" />
      <rect y={seaTop} width={W} height={seaBot - seaTop} fill="url(#sea)" />
      {Array.from({ length: 6 }).map((_, i) => (
        <path key={i} d={`M${20 + i * (W / 6)} ${seaTop + 22 + (i % 2) * 30} q10 -6 20 0 t20 0 t20 0`} stroke="#7DD3FC" strokeWidth="1.6" fill="none" opacity=".45" />
      ))}
      <rect y={quay} width={W} height={H - quay} fill="url(#quay)" />
      <rect y={quay} width={W} height="8" fill="#6B7F96" />
      {Array.from({ length: 9 }).map((_, i) => <line key={i} x1="0" x2={W} y1={quay + 40 + i * ((H - quay) / 9)} y2={quay + 40 + i * ((H - quay) / 9)} stroke="#2A3A4D" strokeWidth="1" opacity=".6" />)}

      {list.map((kind, idx) => {
        if (kind === 'clipboard' && hideBonus) return null
        const p = L[kind]
        const x = p.cx - p.s / 2
        const y = p.by - p.s + (p.s * 4) / 64
        const mark = marks[kind]
        const label = ariaLabelFor ? ariaLabelFor(kind, idx) : `Objek ${idx + 1}`
        const showLabel = labeled.includes(kind) && getVocab(kind)
        return (
          <g
            key={kind} className="hotspot" role="button" tabIndex={disabled ? -1 : 0} aria-label={label}
            aria-disabled={disabled} onClick={() => !disabled && onSelect(kind)}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); onSelect(kind) } }}
            opacity={mark === 'ignored' ? 0.45 : 1}
          >
            <g transform={`translate(${x} ${y}) scale(${p.s / 64})`}><EntityShape kind={kind} /></g>
            <rect className="hs-ring" x={x - 2} y={y - 2} width={p.s + 4} height={p.s + 4} rx="8" fill="rgba(245,191,79,.08)" stroke="#F5BF4F" strokeWidth="2.5" strokeDasharray="6 4" />
            {mark === 'selected' && <rect x={x - 2} y={y - 2} width={p.s + 4} height={p.s + 4} rx="8" fill="none" stroke="#38BDF8" strokeWidth="3" />}
            {(mark === 'found' || mark === 'saved') && (
              <g transform={`translate(${x + p.s - 6} ${y + 6})`}>
                <circle r="11" fill="#34D399" stroke="#0B1B2E" strokeWidth="2" />
                <path d="M-5 0 L-1.5 4 L5 -4" stroke="#0B1B2E" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
            {showLabel && (
              <text x={p.cx} y={p.by + 16} textAnchor="middle" fontSize="17" fill="#F6EEDC" stroke="#0B1B2E" strokeWidth="4" paintOrder="stroke" style={{ fontFamily: "'Noto Naskh Arabic', Amiri, serif" }}>
                {getVocab(kind)!.ar}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
