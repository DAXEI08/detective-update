import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Notebook, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CaseDefinition } from '../../types'
import { evidenceTotal } from '../../data/cases'
import { Button } from '../common/Button'
import { Ar } from '../common/RichText'
import { DalilPanel, DalilMark } from '../dalil/DalilPanel'
import { NotesSheet } from '../evidence/NotesSheet'
import { useGameStore } from '../../stores/gameStore'
import { TaskView } from './tasks'
import { FeedbackBanner } from './FeedbackBanner'

interface Props { def: CaseDefinition; onFinish: () => void; onRestart: () => void }

export function CaseRunner({ def, onFinish, onRestart }: Props) {
  const nav = useNavigate()
  const session = useGameStore((s) => s.session)!
  const completeTask = useGameStore((s) => s.completeTask)
  const advance = useGameStore((s) => s.advance)
  const [dalil, setDalil] = useState(false)
  const [notes, setNotes] = useState(false)
  const [gain, setGain] = useState<{ xp: number; key: number } | null>(null)
  const [msg, setMsg] = useState<string | undefined>()

  const idx = Math.min(session.taskIndex, def.tasks.length - 1)
  const task = def.tasks[idx]
  const solved = Boolean(session.taskStats[task.id]?.done)
  const last = idx === def.tasks.length - 1

  function onSolved(text?: string) {
    const { xpGain } = completeTask(task)
    setMsg(text)
    if (xpGain > 0) setGain({ xp: xpGain, key: Date.now() })
  }
  function next() {
    setGain(null); setMsg(undefined)
    if (advance(def) === 'finished') onFinish()
  }

  return (
    <div className="mx-auto max-w-5xl px-3 pb-28 pt-3 sm:px-4">
      <header className="sticky top-0 z-30 -mx-3 mb-4 border-b border-ink-700 bg-ink-900/92 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => nav('/cases')} className="tap rounded-lg px-2 text-sm text-cream-300 hover:bg-ink-700" aria-label="Keluar ke daftar kasus">Kasus</button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-cream-300">CASE {String(def.number).padStart(2, '0')} · {def.titleId}</p>
            <div className="mt-1 flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={def.tasks.length} aria-valuenow={idx + (solved ? 1 : 0)} aria-label="Kemajuan kasus">
              {def.tasks.map((t, i) => (
                <span key={t.id} className={`h-1.5 flex-1 rounded-full ${i < idx || (i === idx && solved) ? 'bg-gold-500' : i === idx ? 'bg-signal-400' : 'bg-ink-600'}`} />
              ))}
            </div>
          </div>
          <span className="chip" title="XP kasus ini"><Sparkles size={12} className="text-gold-400" />{session.xp} XP</span>
          <span className="chip hidden sm:inline-flex" title="Bukti"><Search size={12} />{session.evidence.filter((id) => def.clues.find((c) => c.id === id)?.isEvidence).length}/{evidenceTotal(def)}</span>
          <button onClick={() => setNotes(true)} className="tap grid place-items-center rounded-lg bg-ink-700 hover:bg-ink-600" aria-label="Buka catatan kasus"><Notebook size={20} /></button>
          <button onClick={() => setDalil(true)} className="tap grid place-items-center rounded-full" aria-label="Buka Dalil, asisten investigasi"><DalilMark size={40} /></button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.section key={task.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold sm:text-xl">{task.titleId}</h2>
            <span className="text-xs text-cream-400">Tugas {idx + 1} / {def.tasks.length}</span>
          </div>
          <TaskView task={task} def={def} solved={solved} onSolved={onSolved} />
          {solved && msg && <div className="mt-3"><FeedbackBanner feedback={{ kind: 'good', text: msg }} /></div>}
        </motion.section>
      </AnimatePresence>

      <AnimatePresence>
        {solved && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-500/40 bg-ink-900/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <div>
                <p lang="ar" dir="rtl" className="ar text-xl leading-none text-good">أَحْسَنْتَ!</p>
                {gain && (
                  <motion.p key={gain.key} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-sm font-bold text-gold-400">
                    +{gain.xp} XP {gain.xp > 100 && <span className="text-xs font-normal text-cream-300">(bonus tanpa petunjuk)</span>}
                  </motion.p>
                )}
              </div>
              <Button variant="primary" size="lg" onClick={next} icon={<ArrowRight size={20} />}>{last ? 'Selesaikan kasus' : 'Lanjut'}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DalilPanel open={dalil} onClose={() => setDalil(false)} def={def} task={task} />
      <NotesSheet open={notes} onClose={() => setNotes(false)} def={def} onRestart={() => { setNotes(false); onRestart() }} />
    </div>
  )
}

export { Ar }
