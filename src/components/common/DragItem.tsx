import { motion } from 'framer-motion'
import { useRef } from 'react'
import type { ReactNode } from 'react'

/** Find the data-drop id under the pointer when a drag ends. */
function dropTargetAt(e: MouseEvent | TouchEvent | PointerEvent, source: HTMLElement | null): string | null {
  let x = 0
  let y = 0
  if ('clientX' in e) { x = e.clientX; y = e.clientY }
  else if (e.changedTouches?.[0]) { x = e.changedTouches[0].clientX; y = e.changedTouches[0].clientY }
  const els = document.elementsFromPoint(x, y)
  for (const el of els) {
    // The dragged element sits under the pointer and lives inside its origin zone: ignore it, or every drop resolves to the origin.
    if (source && source.contains(el)) continue
    const z = (el as HTMLElement).closest?.('[data-drop]') as HTMLElement | null
    if (z?.dataset.drop) return z.dataset.drop
  }
  return null
}

interface Props {
  children: ReactNode
  label: string
  onDropOn: (dropId: string) => void
  onActivate?: () => void
  disabled?: boolean
  selected?: boolean
  className?: string
}

/** Draggable (mouse + touch) that also works as a tap/Enter "select" target — the accessible alternative to dragging. */
export function DragItem({ children, label, onDropOn, onActivate, disabled, selected, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <motion.div
      ref={ref}
      // Tap is handled by onTap/Enter; stop the click from also reaching a parent drop zone (it would select then immediately re-place).
      onClick={(e) => e.stopPropagation()}
      role="button" tabIndex={disabled ? -1 : 0} aria-label={label} aria-pressed={selected}
      drag={!disabled} dragSnapToOrigin dragMomentum={false} dragElastic={0.15}
      whileDrag={{ scale: 1.08, zIndex: 40 }}
      onDragEnd={(e) => { const id = dropTargetAt(e as PointerEvent, ref.current); if (id) onDropOn(id) }}
      onTap={() => { if (!disabled) onActivate?.() }}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) { e.preventDefault(); onActivate?.() } }}
      className={`touch-none cursor-grab active:cursor-grabbing ${selected ? 'ring-2 ring-gold-400' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
