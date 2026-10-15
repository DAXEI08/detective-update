import { motion } from 'framer-motion'
import { Target } from 'lucide-react'
import type { CaseDefinition } from '../../types'
import { getPrep, getVocab } from '../../data/vocabulary'
import { Button } from '../common/Button'
import { Ar } from '../common/RichText'

export function Briefing({ def, onStart, onBack }: { def: CaseDefinition; onStart: () => void; onBack: () => void }) {
  const vocab = def.vocabulary.map((v) => getVocab(v) ?? getPrep(v)).filter((x): x is NonNullable<typeof x> => Boolean(x))
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="paper relative overflow-hidden p-5 sm:p-8">
          <span className="absolute right-4 top-4 rotate-6 rounded border-2 border-coral px-2 py-0.5 text-xs font-bold text-coral">BERKAS KASUS</span>
          <p className="text-sm font-semibold text-ink-600">CASE {String(def.number).padStart(2, '0')}</p>
          <Ar size="xl" className="block text-ink-900">{def.titleAr}</Ar>
          <p className="text-lg font-bold text-ink-800">{def.titleId}</p>
          <p className="mt-4 text-sm leading-relaxed text-ink-800">{def.story}</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold"><Target size={15} /> Tujuan belajar</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-800">{def.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
              <p className="mt-3 text-xs text-ink-600">Level: {def.learningLevel}<br />Mekanik: {def.mechanic}</p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-bold">Kata kunci kasus</h3>
              <ul className="flex flex-wrap gap-2">
                {vocab.map((v) => (
                  <li key={v.id} className="rounded-lg bg-ink-900 px-2.5 py-1 text-cream-100">
                    <Ar size="sm">{v.ar}</Ar>
                    {def.showVocabMeaning && <span className="ml-2 text-xs text-cream-300">{v.idn}</span>}
                  </li>
                ))}
              </ul>
              {!def.showVocabMeaning && <p className="mt-2 text-xs text-ink-600">Artinya akan terungkap saat kamu menemukan bukti.</p>}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={onBack}>Kembali</Button>
          <Button variant="primary" size="lg" onClick={onStart}>Mulai penyelidikan</Button>
        </div>
      </motion.div>
    </div>
  )
}
