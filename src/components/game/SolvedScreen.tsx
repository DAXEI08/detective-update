import { motion } from 'framer-motion'
import { useState } from 'react'
import type { CaseDefinition } from '../../types'
import { Button } from '../common/Button'
import { Ar } from '../common/RichText'
import { EntityGlyph } from './EntityIcon'

/** Stamp → (final case only) story reveal → results. */
export function SolvedScreen({ def, onContinue }: { def: CaseDefinition; onContinue: () => void }) {
  const [step, setStep] = useState(0)
  const reveal = def.reveal
  return (
    <div className="grid min-h-[80vh] place-items-center px-4 py-10">
      {step === 0 ? (
        <div className="text-center">
          <motion.div initial={{ scale: 2.2, rotate: -14, opacity: 0 }} animate={{ scale: 1, rotate: -6, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="mx-auto inline-block rounded-xl border-4 border-good px-8 py-5 text-good">
            <p className="text-3xl font-extrabold tracking-tight sm:text-5xl">CASE SOLVED</p>
            <Ar size="xl" className="block">تَمَّ حَلُّ الْقَضِيَّةِ</Ar>
          </motion.div>
          <p className="mt-6 text-cream-200">CASE {String(def.number).padStart(2, '0')} · {def.titleId}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-cream-300">{def.solution.summary}</p>
          <Button variant="primary" size="lg" className="mt-6" onClick={() => (reveal ? setStep(1) : onContinue())}>{reveal ? 'Lihat pengungkapan' : 'Lihat hasil'}</Button>
        </div>
      ) : (
        <div className="w-full max-w-xl">
          <h2 className="mb-4 text-center text-xl font-bold">Pengungkapan akhir</h2>
          <ol className="space-y-3">
            {reveal!.lines.map((l, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 * i }} className="paper flex items-center gap-3 p-3">
                <EntityGlyph kind={['container', 'officer', 'warehouse', 'cargo'][i] as 'container'} size={40} />
                <div><Ar size="md" className="block text-ink-900">{l.ar}</Ar><span className="text-xs text-ink-600">{l.id}</span></div>
              </motion.li>
            ))}
          </ol>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 * reveal!.lines.length + 0.2 }} className="mt-5 rounded-xl border border-gold-500/40 bg-ink-800 p-4 text-sm leading-relaxed">{reveal!.conclusion}</motion.p>
          <div className="mt-5 text-center"><Button variant="primary" size="lg" onClick={onContinue}>Lihat hasil akhir</Button></div>
        </div>
      )}
    </div>
  )
}
