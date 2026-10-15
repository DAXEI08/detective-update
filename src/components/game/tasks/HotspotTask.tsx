import type { EntityKind, HotspotTask as T } from '../../../types'
import { getVocab } from '../../../data/vocabulary'
import { useGameStore } from '../../../stores/gameStore'
import { Ar } from '../../common/RichText'
import { FeedbackBanner } from '../FeedbackBanner'
import { HarborScene } from '../HarborScene'
import type { MarkState } from '../HarborScene'
import { TaskPrompt, useFb, useTaskActions } from './common'
import type { TaskProps } from './common'
import { XP } from '../../../engine/scoring'

export function HotspotTask({ task, def, solved, onSolved }: TaskProps<T>) {
  const { mistake, focus } = useTaskActions(task)
  const evidence = useGameStore((s) => s.session?.evidence ?? [])
  const collect = useGameStore((s) => s.collectEvidence)
  const [fb, setFb] = useFb()

  // entity → found? (derive from collected clues that are bound to an entity)
  const found = def.clues.filter((c) => c.entity && evidence.includes(c.id)).map((c) => c.entity as EntityKind)
  const marks: Partial<Record<EntityKind, MarkState>> = {}
  found.forEach((k) => { marks[k] = 'found' })
  if (solved) marks[task.target] = 'found'

  function pick(k: EntityKind) {
    focus(task.promptAr ?? '')
    if (task.bonus && k === task.bonus.entity) {
      const isNew = collect(task.bonus.clueId, XP.bonusEvidence)
      setFb(isNew
        ? { kind: 'info', text: `Kamu menemukan bukti tersembunyi! **الْبِضَاعَةُ فِي الْمِينَاءِ.** (+${XP.bonusEvidence} XP)` }
        : { kind: 'info', text: 'Bukti tersembunyi ini sudah kamu simpan.' })
      return
    }
    if (solved) return
    if (k === task.target) {
      onSolved()
      return
    }
    const v = getVocab(k)
    if (found.includes(k)) { setFb({ kind: 'info', text: `Benda itu sudah kamu temukan sebelumnya (${v?.ar}). Cari benda yang lain.` }); return }
    const msg = `Belum tepat. Itu **${v?.ar}** (${v?.idn}). Baca lagi perintahnya dan cari benda lain.`
    mistake(msg, [task.target])
    setFb({ kind: 'bad', text: msg })
  }

  return (
    <div>
      <TaskPrompt instruction={task.instruction} />
      <div className="paper mb-3 flex items-center justify-between gap-3 px-4 py-2" aria-live="polite">
        <span className="text-xs font-semibold text-ink-600">{task.titleId}</span>
        <Ar size="lg" className="text-ink-900">{task.promptAr}</Ar>
      </div>
      <HarborScene
        onSelect={pick} marks={marks} labeled={found}
        ariaLabelFor={(k, i) => (found.includes(k) ? `${getVocab(k)?.idn ?? 'Bukti'} (sudah ditemukan)` : `Objek ${i + 1}`)}
      />
      <div className="mt-3"><FeedbackBanner feedback={solved ? { kind: 'good', text: task.success } : fb} /></div>
    </div>
  )
}
