import { Pin, PinOff } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Clue } from '../../types'
import { toArabicIndic, pad2 } from '../../utils/arabic'
import { EntityGlyph } from '../game/EntityIcon'
import { Ar } from '../common/RichText'

interface Props {
  clue: Clue
  index: number
  note?: boolean
  selected?: boolean
  muted?: boolean
  pinned?: boolean
  onPin?: () => void
  onClick?: () => void
  compact?: boolean
  badge?: string
  className?: string
}

/** Paper evidence card: "الدَّلِيلُ ٠٣" + Arabic clue + icon + optional Indonesian note. */
export function EvidenceCard({ clue, index, note, selected, muted, pinned, onPin, onClick, compact, badge, className = '' }: Props) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: muted ? 0.55 : 1, y: 0 }} className={`relative ${className}`}>
      <Tag
        {...(onClick ? { onClick, type: 'button' as const, 'aria-pressed': selected } : {})}
        className={`paper block w-full p-3 text-left ${compact ? '' : 'sm:p-4'} ${selected ? 'ring-4 ring-gold-400' : ''} ${onClick ? 'tap hover:-translate-y-0.5 transition-transform' : ''}`}
      >
        <span className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-ink-600">
          <span lang="ar" dir="rtl" className="ar text-sm leading-none text-ink-700">الدَّلِيلُ {toArabicIndic(pad2(index))}</span>
          <span className="flex items-center gap-1.5">
            {badge && <span className="rounded bg-ink-900 px-1.5 py-0.5 text-[10px] text-gold-400">{badge}</span>}
            {clue.entity && <EntityGlyph kind={clue.entity} size={22} />}
          </span>
        </span>
        <Ar size={compact ? 'sm' : 'md'} className="block text-ink-900">{clue.ar}</Ar>
        {note && <span className="mt-1 block text-xs text-ink-600">{clue.note}</span>}
      </Tag>
      {onPin && (
        <button onClick={onPin} aria-pressed={pinned} aria-label={pinned ? 'Lepas sematan' : 'Sematkan bukti kunci'}
          className={`tap absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full border shadow ${pinned ? 'border-gold-400 bg-gold-500 text-ink-900' : 'border-ink-500 bg-ink-800 text-cream-200'}`}>
          {pinned ? <Pin size={16} /> : <PinOff size={16} />}
        </button>
      )}
    </motion.div>
  )
}
