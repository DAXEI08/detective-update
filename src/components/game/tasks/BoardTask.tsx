import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Link2, X } from 'lucide-react'
import type { BoardTask as T } from '../../../types'
import { clueNumber, getClue } from '../../../data/cases'
import { describePattern, glossSentence } from '../../../data/lexicon'
import { Button } from '../../common/Button'
import { DragItem } from '../../common/DragItem'
import { EvidenceCard } from '../../evidence/EvidenceCard'
import { FeedbackBanner } from '../FeedbackBanner'
import { TaskPrompt, useFb, useTaskActions } from './common'
import type { TaskProps } from './common'

type Zone = 'tray' | 'important' | 'discard'

export function BoardTask(props: TaskProps<T>) {
  return props.task.phase === 'sort' ? <SortBoard {...props} /> : <ConnectBoard {...props} />
}

function SortBoard({ task, def, solved, onSolved }: TaskProps<T>) {
  const { mistake, focus } = useTaskActions(task)
  const [zones, setZones] = useState<Record<string, Zone>>(() => Object.fromEntries(task.cardIds.map((id) => [id, 'tray' as Zone])))
  const [sel, setSel] = useState<string | null>(null)
  const [fb, setFb] = useFb()

  const move = (id: string, z: Zone) => { if (solved) return; setZones((s) => ({ ...s, [id]: z })); setSel(null); setFb(null) }
  const handleDrop = (id: string, dropId: string) => { if (dropId.startsWith('board:')) move(id, dropId.slice(6) as Zone) }

  function check() {
    if (task.cardIds.some((id) => zones[id] === 'tray')) { setFb({ kind: 'info', text: 'Masih ada kartu di baki. Pilah semuanya dulu.' }); return }
    const wrong = task.cardIds.find((id) => (zones[id] === 'important') !== task.relevant.includes(id))
    if (!wrong) { onSolved(); return }
    const msg = `Belum tepat. ${task.reasons[wrong] ?? ''}`
    mistake(msg, getClue(def, wrong)?.vocab.slice(0, 2))
    setFb({ kind: 'bad', text: msg })
  }

  const renderZone = (z: Zone, title: string, cls: string) => (
    <div data-drop={`board:${z}`} onClick={() => sel && move(sel, z)} role="button" tabIndex={0} aria-label={`Zona ${title}`}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && sel) { e.preventDefault(); move(sel, z) } }}
      className={`min-h-[120px] rounded-xl border-2 border-dashed p-2 ${cls}`}>
      <h3 className="mb-2 text-xs font-bold">{title}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {task.cardIds.filter((id) => zones[id] === z).map((id) => (
          <DragItem key={id} label={`Kartu bukti ${clueNumber(def, id)}`} selected={sel === id} disabled={solved}
            onActivate={() => { setSel(sel === id ? null : id); focus(getClue(def, id)!.ar) }} onDropOn={(d) => handleDrop(id, d)}>
            <EvidenceCard clue={getClue(def, id)!} index={clueNumber(def, id)} compact selected={sel === id} />
          </DragItem>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <div className="grid gap-3">
        {renderZone('tray', 'Baki bukti — seret kartu atau ketuk lalu ketuk zona', 'border-ink-500 bg-ink-800/50')}
        <div className="grid gap-3 md:grid-cols-2">
          {renderZone('important', 'Penting', 'border-good/60 bg-good/5')}
          {renderZone('discard', 'Singkirkan', 'border-bad/50 bg-bad/5')}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} />
        {!solved && <Button variant="primary" onClick={check}>Periksa papan</Button>}
      </div>
    </div>
  )
}

const pairKey = (a: string, b: string) => [a, b].sort().join('|')

function ConnectBoard({ task, def, solved, onSolved }: TaskProps<T>) {
  const { mistake, focus } = useTaskActions(task)
  const [links, setLinks] = useState<string[]>([])
  const [sel, setSel] = useState<string | null>(null)
  const [pins, setPins] = useState<Set<string>>(new Set())
  const [fb, setFb] = useFb()
  const wrap = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<{ k: string; x1: number; y1: number; x2: number; y2: number }[]>([])

  const valid = new Set((task.validLinks ?? []).map(([a, b]) => pairKey(a, b)))
  const required = (task.requiredLinks ?? []).map(([a, b]) => pairKey(a, b))

  const measure = useCallback(() => {
    const w = wrap.current
    if (!w) return
    const base = w.getBoundingClientRect()
    const center = (id: string) => {
      const el = w.querySelector<HTMLElement>(`[data-cid="${id}"]`)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 }
    }
    setLines(links.flatMap((k) => {
      const [a, b] = k.split('|')
      const pa = center(a); const pb = center(b)
      return pa && pb ? [{ k, x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y }] : []
    }))
  }, [links])
  useLayoutEffect(measure, [measure])
  useEffect(() => {
    const w = wrap.current
    if (!w) return
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    ro?.observe(w)
    window.addEventListener('resize', measure)
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure) }
  }, [measure])

  function tap(id: string) {
    if (solved) return
    focus(getClue(def, id)!.ar)
    if (!sel) { setSel(id); return }
    if (sel === id) { setSel(null); return }
    const k = pairKey(sel, id)
    if (links.includes(k)) { setLinks((l) => l.filter((x) => x !== k)); setSel(null); return }
    if (!valid.has(k)) {
      const a = getClue(def, sel)!; const b = getClue(def, id)!
      const wa = glossSentence(a.ar).filter((g) => g.entry?.kind === 'noun').map((g) => g.entry!.key)
      const shared = glossSentence(b.ar).filter((g) => g.entry?.kind === 'noun' && wa.includes(g.entry.key))
      const msg = shared.length
        ? 'Dua petunjuk ini punya kata yang sama, tetapi isinya belum saling menguatkan. Cek lagi: apakah keduanya menyingkirkan lokasi, atau menunjuk lokasi yang sama?'
        : 'Dua petunjuk ini belum berhubungan: tidak ada pola atau tempat yang sama. Cari pasangan lain.'
      mistake(msg, [...a.vocab.slice(0, 1), ...b.vocab.slice(0, 1)])
      setFb({ kind: 'bad', text: msg })
      setSel(null)
      return
    }
    setLinks((l) => [...l, k]); setSel(null); setFb({ kind: 'info', text: `Garis dibuat. ${describePattern(getClue(def, id)!.ar)}` })
  }

  function check() {
    const missing = required.filter((k) => !links.includes(k))
    if (missing.length === 0) { onSolved(); return }
    const msg = `Masih ada ${missing.length} hubungan penting yang belum kamu garis. Cari pasangan kartu yang saling menguatkan.`
    mistake(msg, task.vocab.slice(0, 2))
    setFb({ kind: 'bad', text: msg })
  }

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <div ref={wrap} className="relative">
        <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden>
          {lines.map((l) => (
            <motion.line key={l.k} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#F5BF4F" strokeWidth="4" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
          ))}
        </svg>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 p-2 sm:gap-x-24">
          {task.cardIds.map((id) => (
            <div key={id} data-cid={id}>
              <EvidenceCard clue={getClue(def, id)!} index={clueNumber(def, id)} compact selected={sel === id}
                onClick={() => tap(id)} pinned={pins.has(id)} onPin={() => setPins((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })} className="relative z-0" />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-cream-400">Ketuk kartu pertama, lalu kartu kedua untuk membuat garis. Ketuk pasangan yang sama lagi untuk menghapusnya.</p>
      {links.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Daftar hubungan">
          {links.map((k) => {
            const [a, b] = k.split('|')
            return (
              <li key={k} className="chip"><Link2 size={12} /> #{clueNumber(def, a)} ↔ #{clueNumber(def, b)}
                {!solved && <button aria-label={`Hapus hubungan ${clueNumber(def, a)} dan ${clueNumber(def, b)}`} onClick={() => setLinks((l) => l.filter((x) => x !== k))} className="tap -my-2 grid place-items-center"><X size={14} /></button>}
              </li>
            )
          })}
        </ul>
      )}
      <div className="mt-3 flex flex-col gap-3">
        <FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} />
        {!solved && <Button variant="primary" icon={<CheckCircle2 size={18} />} onClick={check}>Periksa hubungan</Button>}
      </div>
    </div>
  )
}
