import type { EntityKind } from '../../types'

const C = {
  navy: '#1E3A5F', red: '#C8453B', cream: '#F6EEDC', amber: '#F2B33D', teal: '#2E8B9A', steel: '#5C7A99',
  dark: '#0B1B2E', wood: '#B8844B', woodDark: '#6B4A27', orange: '#E8703A', skin: '#E8B98E', cyan: '#38BDF8',
}

/** Flat vector glyphs in a 64×64 box; ground line ≈ y 60. */
export function EntityShape({ kind }: { kind: EntityKind }) {
  switch (kind) {
    case 'ship':
      return (
        <g>
          <path d="M3 40 H61 L53 55 H13 Z" fill={C.navy} />
          <rect x="3" y="38" width="58" height="4" fill={C.red} />
          <rect x="8" y="30" width="10" height="8" fill={C.orange} /><rect x="19" y="30" width="9" height="8" fill={C.amber} />
          <rect x="30" y="25" width="22" height="13" fill={C.cream} /><rect x="35" y="15" width="14" height="10" fill={C.cream} />
          {[37, 41, 45].map((x) => <rect key={x} x={x} y="18" width="3" height="3" fill={C.cyan} />)}
          <rect x="37" y="9" width="6" height="7" fill={C.amber} /><rect x="37" y="9" width="6" height="2" fill={C.dark} />
          <path d="M2 57 q6-4 12 0 t12 0 t12 0 t12 0 t12 0" stroke={C.cyan} strokeWidth="2" fill="none" />
        </g>
      )
    case 'warehouse':
      return (
        <g>
          <path d="M6 28 L32 12 L58 28 V58 H6 Z" fill="#8B9BB0" />
          <path d="M3 29 L32 9 L61 29" stroke="#B9452F" strokeWidth="5" fill="none" strokeLinejoin="round" />
          <rect x="19" y="33" width="26" height="25" fill="#3F5876" />
          {[37, 41, 45, 49, 53].map((y) => <line key={y} x1="19" x2="45" y1={y} y2={y} stroke="#5C7A99" strokeWidth="1.2" />)}
          <rect x="26" y="21" width="12" height="5" fill={C.amber} />
        </g>
      )
    case 'crane':
      return (
        <g>
          <rect x="6" y="54" width="52" height="6" fill="#445B78" />
          <rect x="14" y="22" width="4" height="32" fill={C.amber} /><rect x="30" y="22" width="4" height="32" fill={C.amber} />
          <path d="M14 30 L34 44 M34 30 L14 44 M14 44 L34 54 M34 44 L14 54" stroke={C.amber} strokeWidth="1.6" />
          <path d="M8 18 H62 L58 25 H14 Z" fill={C.amber} />
          <rect x="18" y="8" width="12" height="10" fill={C.steel} /><rect x="21" y="11" width="6" height="4" fill={C.cyan} />
          <line x1="55" y1="25" x2="55" y2="42" stroke={C.dark} strokeWidth="1.6" />
          <path d="M55 42 v4 a3.5 3.5 0 1 1 -3.5 3.5" stroke={C.dark} strokeWidth="2" fill="none" />
        </g>
      )
    case 'officer':
      return (
        <g>
          <path d="M8 62 Q8 41 32 41 Q56 41 56 62 Z" fill={C.teal} />
          <path d="M28 41 L32 52 L36 41 Z" fill={C.cream} />
          <rect x="11" y="46" width="11" height="3.5" fill={C.amber} /><rect x="42" y="46" width="11" height="3.5" fill={C.amber} />
          <circle cx="32" cy="29" r="10" fill={C.skin} />
          <path d="M20 26 Q32 6 44 26 Z" fill={C.dark} /><rect x="19" y="25" width="26" height="4" fill={C.dark} />
          <rect x="29.5" y="16" width="5" height="5" fill={C.amber} />
        </g>
      )
    case 'captain':
      return (
        <g>
          <path d="M8 62 Q8 41 32 41 Q56 41 56 62 Z" fill={C.navy} />
          <circle cx="26" cy="50" r="1.8" fill={C.amber} /><circle cx="38" cy="50" r="1.8" fill={C.amber} /><circle cx="32" cy="56" r="1.8" fill={C.amber} />
          <circle cx="32" cy="29" r="10" fill="#D9A27A" />
          <path d="M23 33 Q32 46 41 33 Q32 39 23 33 Z" fill="#B7C0CB" />
          <path d="M19 26 Q32 5 45 26 Z" fill={C.cream} /><rect x="18" y="25" width="28" height="4.5" fill={C.dark} />
          <circle cx="32" cy="18" r="2.6" fill={C.amber} />
        </g>
      )
    case 'passengers':
      return (
        <g>
          <path d="M2 54 Q2 36 16 36 Q30 36 30 54 Z" fill={C.red} /><circle cx="16" cy="27" r="7" fill="#E0A98B" />
          <path d="M34 54 Q34 36 48 36 Q62 36 62 54 Z" fill={C.teal} /><circle cx="48" cy="27" r="7" fill="#C98E6B" />
          <path d="M16 56 Q16 32 32 32 Q48 32 48 56 Z" fill={C.amber} /><circle cx="32" cy="22" r="7.5" fill={C.skin} />
          <rect x="20" y="49" width="24" height="11" rx="2" fill={C.wood} stroke={C.woodDark} strokeWidth="1.5" />
          <path d="M28 49 v-3 h8 v3" stroke={C.woodDark} strokeWidth="1.6" fill="none" />
        </g>
      )
    case 'waitingHall':
      return (
        <g>
          <path d="M3 25 H61 L55 13 H9 Z" fill={C.teal} />
          <rect x="8" y="25" width="48" height="33" fill="#E6D9BD" />
          <rect x="12" y="30" width="14" height="16" fill={C.cyan} opacity=".85" /><rect x="38" y="30" width="14" height="16" fill={C.cyan} opacity=".85" />
          <rect x="27" y="36" width="10" height="22" fill="#7A5A35" />
          <rect x="11" y="50" width="16" height="3" fill="#7A5A35" /><rect x="37" y="50" width="16" height="3" fill="#7A5A35" />
        </g>
      )
    case 'cargo':
      return (
        <g>
          {[[4, 36], [33, 36], [18, 13]].map(([x, y], i) => (
            <g key={i}>
              <rect x={x} y={y} width="27" height="23" fill={C.wood} stroke={C.woodDark} strokeWidth="2" />
              <path d={`M${x} ${y} L${x + 27} ${y + 23} M${x + 27} ${y} L${x} ${y + 23}`} stroke={C.woodDark} strokeWidth="1.4" />
            </g>
          ))}
        </g>
      )
    case 'container':
      return (
        <g>
          <rect x="3" y="18" width="58" height="40" rx="2" fill={C.red} />
          {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={8 + i * 6} y="22" width="2.4" height="32" fill="#9E2F27" />)}
          <rect x="3" y="18" width="58" height="4" fill="#E26A5F" />
          <rect x="3" y="54" width="58" height="4" fill="#8A2A23" />
          <rect x="24" y="31" width="16" height="9" fill={C.cream} />
        </g>
      )
    case 'lifeboat':
      return (
        <g>
          <path d="M14 36 Q32 12 50 36 Z" fill="#F58B4C" />
          <rect x="24" y="26" width="5" height="5" fill={C.cyan} /><rect x="35" y="26" width="5" height="5" fill={C.cyan} />
          <path d="M3 37 Q32 62 61 37 L57 34 H7 Z" fill={C.orange} />
          <path d="M8 40 Q32 55 56 40" stroke="#fff" strokeWidth="2.4" fill="none" />
        </g>
      )
    case 'buoy':
      return (
        <g>
          <circle cx="32" cy="34" r="20" fill="none" stroke="#fff" strokeWidth="11" />
          <circle cx="32" cy="34" r="20" fill="none" stroke={C.red} strokeWidth="11" strokeDasharray="15.7 15.7" />
          <circle cx="32" cy="34" r="25.5" fill="none" stroke={C.dark} strokeWidth="1" opacity=".5" />
        </g>
      )
    case 'clipboard':
      return (
        <g>
          <rect x="14" y="8" width="36" height="50" rx="3" fill={C.cream} stroke={C.dark} strokeWidth="1.5" />
          <rect x="24" y="4" width="16" height="9" rx="2" fill="#445B78" />
          {[24, 31, 38, 45].map((y) => <rect key={y} x="20" y={y} width="24" height="2" fill="#7A8CA3" />)}
        </g>
      )
  }
}

export function EntityGlyph({ kind, size = 48, className = '' }: { kind: EntityKind; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden focusable="false">
      <EntityShape kind={kind} />
    </svg>
  )
}
