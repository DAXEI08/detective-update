import { useEffect, useRef, useState } from 'react'
import { BookOpenText, Lightbulb, MessageCircleQuestion, ScanSearch, Languages } from 'lucide-react'
import { Sheet } from '../common/Sheet'
import { RichText, Ar } from '../common/RichText'
import { Button } from '../common/Button'
import { askDalil, CHARGED_ACTIONS, resolveHintLevel } from '../../services/dalil'
import type { DalilAction, DalilContext, HintLevel } from '../../services/dalil'
import { useGameStore } from '../../stores/gameStore'
import { glossSentence } from '../../data/lexicon'
import { evidenceTotal, getClue } from '../../data/cases'
import type { CaseDefinition, Task } from '../../types'

export function DalilMark({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden>
      <circle cx="24" cy="24" r="23" fill="#11263F" stroke="#F5BF4F" strokeWidth="2" />
      <circle cx="22" cy="22" r="9" fill="none" stroke="#F5BF4F" strokeWidth="3.5" />
      <path d="M29 29 L38 38" stroke="#F5BF4F" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M17 22 q5-6 10 0" stroke="#38BDF8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

interface Props { open: boolean; onClose: () => void; def: CaseDefinition; task: Task }

function buildContext(def: CaseDefinition, task: Task, level: HintLevel, repeat: boolean): DalilContext {
  const g = useGameStore.getState()
  const s = g.session
  const st = s?.taskStats[task.id]
  const ev = (s?.evidence ?? []).map((id) => getClue(def, id)).filter((c): c is NonNullable<typeof c> => Boolean(c && c.isEvidence))
  return {
    caseId: def.id, caseTitleId: def.titleId, taskId: task.id, taskType: task.type,
    taskIndex: s?.taskIndex ?? 0, taskCount: def.tasks.length, instruction: task.instruction, promptAr: task.promptAr,
    focusText: g.focusText ?? task.focusText ?? task.promptAr, hintLevel: level, hintRepeat: repeat,
    failedAttempts: st?.mistakes ?? 0, hintsUsedOnTask: st?.hints ?? 0,
    evidence: ev.map((c) => ({ id: c.id, ar: c.ar })), evidenceFound: ev.length, evidenceTotal: evidenceTotal(def),
    lastMistake: g.lastMistake && g.lastMistake.taskId === task.id ? { message: g.lastMistake.message, vocab: g.lastMistake.vocab } : undefined,
    authoredHints: task.hints,
  }
}

const ACTIONS: { id: DalilAction | 'pickWord'; label: string; ar: string; icon: React.ReactNode }[] = [
  { id: 'hint', label: 'Beri petunjuk', ar: 'تَلْمِيحٌ', icon: <Lightbulb size={16} /> },
  { id: 'explainSentence', label: 'Jelaskan kalimat', ar: 'اِشْرَحِ الْجُمْلَةَ', icon: <BookOpenText size={16} /> },
  { id: 'pickWord', label: 'Jelaskan kata', ar: 'اِشْرَحِ الْكَلِمَةَ', icon: <Languages size={16} /> },
  { id: 'whyWrong', label: 'Kenapa jawabanku salah?', ar: 'لِمَاذَا أَخْطَأْتُ؟', icon: <MessageCircleQuestion size={16} /> },
  { id: 'analyzeEvidence', label: 'Bantu analisis bukti', ar: 'حَلِّلِ الْأَدِلَّةَ', icon: <ScanSearch size={16} /> },
]

export function DalilPanel({ open, onClose, def, task }: Props) {
  const log = useGameStore((s) => s.dalilLog)
  const push = useGameStore((s) => s.pushDalil)
  const registerHint = useGameStore((s) => s.registerHint)
  const focusText = useGameStore((s) => s.focusText)
  const stat = useGameStore((s) => s.session?.taskStats[task.id])
  const [wordMode, setWordMode] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [log.length, open])

  const hintsUsed = Math.min(3, stat?.ladder ?? 0)
  const sentence = focusText ?? task.focusText ?? task.promptAr
  const words = sentence ? glossSentence(sentence).map((g) => g.surface) : []

  function run(action: DalilAction, userText: string, word?: string) {
    setWordMode(false)
    push({ role: 'user', text: userText })
    const st = useGameStore.getState().session?.taskStats[task.id]
    const { level, repeat } = resolveHintLevel(st?.ladder ?? 0, st?.mistakes ?? 0)
    const reply = askDalil(action, { ...buildContext(def, task, level, repeat), word })
    // A hint only costs something when it gives new information; reflective help is free.
    const charged = CHARGED_ACTIONS[action] && !(action === 'hint' && repeat)
    if (charged) registerHint(task.id, action === 'hint' ? level : undefined)
    push({ role: 'dalil', text: reply.text })
  }

  const onAction = (id: (typeof ACTIONS)[number]) => {
    if (id.id === 'pickWord') {
      if (!sentence) { push({ role: 'dalil', text: 'Belum ada kalimat yang sedang kamu baca. Ketuk sebuah petunjuk dulu.' }); return }
      setWordMode((w) => !w)
      return
    }
    void run(id.id, id.label)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Asisten Dalil — petunjuk bertingkat"
      footer={
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <Button key={a.id} size="sm" className="!min-h-[44px]" icon={a.icon} onClick={() => onAction(a)}>{a.label}</Button>
          ))}
        </div>
      }>
      <div className="mb-3 flex items-center gap-3">
        <DalilMark size={44} />
        <div>
          <p className="ar text-xl leading-none text-gold-400" lang="ar">دَلِيل</p>
          <p className="text-xs text-cream-300">Petunjuk bertingkat · tersusun sebelumnya · tanpa internet</p>
        </div>
        <div className="ml-auto flex items-center gap-1" aria-label={`Tingkat petunjuk dipakai ${hintsUsed} dari 3`}>
          {[0, 1, 2].map((i) => <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < hintsUsed ? 'bg-gold-500' : 'bg-ink-600'}`} />)}
        </div>
      </div>
      <p className="mb-3 rounded-lg bg-ink-700/60 px-3 py-2 text-xs text-cream-300">
        Dalil memberi petunjuk bertingkat (umum, spesifik, lalu bahasa) dan tidak pernah memberi jawaban akhir. Petunjuk baru dan penjelasan kata sedikit mengurangi bintang; 'Kenapa jawabanku salah?' dan analisis bukti gratis.
      </p>
      <ul className="flex flex-col gap-3" aria-live="polite">
        {log.length === 0 && <li className="text-sm text-cream-300">Halo, Detektif. Ketuk salah satu tombol di bawah kalau kamu butuh bantuan.</li>}
        {log.map((m) => (
          <li key={m.id} className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto bg-ink-600' : 'mr-auto border border-gold-500/30 bg-ink-900'}`}>
            <RichText text={m.text} />
          </li>
        ))}
        <div ref={endRef} />
      </ul>
      {wordMode && (
        <div className="mt-4 rounded-xl border border-ink-500 p-3">
          <p className="mb-2 text-xs text-cream-300">Pilih kata yang ingin dijelaskan:</p>
          <div className="flex flex-wrap gap-2">
            {words.map((w, i) => (
              <button key={i} onClick={() => run('explainWord', `Jelaskan kata: ${w}`, w)} className="tap rounded-lg bg-cream-100 px-3 text-ink-900"><Ar size="sm">{w}</Ar></button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  )
}
