import { Sheet } from '../common/Sheet'
import { Ar } from '../common/RichText'
import { EvidenceCard } from './EvidenceCard'
import { getVocab, getPrep } from '../../data/vocabulary'
import { clueNumber, evidenceTotal } from '../../data/cases'
import { useGameStore } from '../../stores/gameStore'
import type { CaseDefinition } from '../../types'
import { Button } from '../common/Button'

export function NotesSheet({ open, onClose, def, onRestart }: { open: boolean; onClose: () => void; def: CaseDefinition; onRestart: () => void }) {
  const s = useGameStore((x) => x.session)
  const evidence = def.clues.filter((c) => c.isEvidence && s?.evidence.includes(c.id))
  const learned = (s?.learned ?? []).map((id) => getVocab(id) ?? getPrep(id)).filter((x): x is NonNullable<typeof x> => Boolean(x))
  return (
    <Sheet open={open} onClose={onClose} title="Catatan kasus"
      footer={<Button variant="ghost" size="sm" onClick={onRestart}>Ulangi kasus dari awal</Button>}>
      <section className="mb-5">
        <h3 className="mb-1 text-sm font-semibold">CASE {def.number} · <Ar size="sm" className="text-gold-400">{def.titleAr}</Ar></h3>
        <p className="mb-2 text-xs text-cream-300">{def.story}</p>
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-cream-200">{def.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
      </section>
      <section className="mb-5">
        <h3 className="mb-2 text-sm font-semibold">Bukti terkumpul ({evidence.length}/{evidenceTotal(def)})</h3>
        {evidence.length === 0 ? <p className="text-xs text-cream-300">Belum ada bukti. Selesaikan tugas untuk mengumpulkannya.</p> : (
          <div className="grid gap-2">{evidence.map((c) => <EvidenceCard key={c.id} clue={c} index={clueNumber(def, c.id)} compact note={s?.revealed.includes(c.id)} />)}</div>
        )}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Kosakata yang sudah kamu pelajari</h3>
        {learned.length === 0 ? <p className="text-xs text-cream-300">Muncul setelah kamu menyelesaikan tugas.</p> : (
          <ul className="grid gap-1.5">
            {learned.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded-lg bg-ink-700/60 px-3 py-1.5"><Ar size="sm">{v.ar}</Ar><span className="text-xs text-cream-300">{v.idn}</span></li>
            ))}
          </ul>
        )}
      </section>
    </Sheet>
  )
}
