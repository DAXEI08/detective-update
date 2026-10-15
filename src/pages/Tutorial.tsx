import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Ar, RichText } from '../components/common/RichText'
import { TopBar } from '../components/common/TopBar'
import { EvidenceCard } from '../components/evidence/EvidenceCard'
import { HarborScene } from '../components/game/HarborScene'
import { DalilMark } from '../components/dalil/DalilPanel'
import { usePlayerStore } from '../stores/playerStore'
import type { Clue, EntityKind } from '../types'

const clue: Clue = { id: 'tut', ar: 'هَذِهِ حَاوِيَةٌ.', note: 'Ini kontainer.', entity: 'container', vocab: ['container'], isEvidence: true }
const STEPS = [
  { t: 'Baca petunjuk, cari bendanya', d: 'Baca perintah Arab, lalu ketuk benda yang dimaksud.' },
  { t: 'Simpan sebagai bukti', d: 'Bukti yang kamu temukan terkumpul di Catatan Kasus.' },
  { t: 'Butuh bantuan? Tanya Dalil', d: 'Dalil memberi petunjuk bertingkat, tidak langsung jawaban.' },
  { t: 'Selesaikan kasus', d: 'Susun kesimpulan dari bukti, lalu lanjut ke kasus berikutnya.' },
]

export function Tutorial() {
  const nav = useNavigate()
  const done = usePlayerStore((s) => s.markTutorialDone)
  const [step, setStep] = useState(0)
  const [wrong, setWrong] = useState('')
  const [hint, setHint] = useState(false)

  const finish = () => { done(); nav('/case/case-1') }
  const next = () => { setStep((s) => s + 1); setWrong('') }

  return (
    <>
      <TopBar title="Tutorial singkat" right={<Button size="sm" variant="ghost" onClick={finish}>Lewati</Button>} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <ol className="mb-5 flex gap-1.5" aria-label="Langkah tutorial">
          {STEPS.map((_, i) => <li key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-gold-500' : 'bg-ink-600'}`} />)}
        </ol>
        <h2 className="text-xl font-bold">{step + 1}. {STEPS[Math.min(step, 3)].t}</h2>
        <p className="mb-4 text-sm text-cream-300">{STEPS[Math.min(step, 3)].d}</p>

        {step === 0 && (
          <div>
            <div className="paper mb-3 flex items-center justify-between px-4 py-2"><span className="text-xs font-semibold text-ink-600">Perintah</span><Ar size="lg" className="text-ink-900">اِبْحَثْ عَنِ الْحَاوِيَةِ</Ar></div>
            <HarborScene entities={['container', 'ship', 'buoy', 'crane'] as EntityKind[]}
              onSelect={(k) => (k === 'container' ? next() : setWrong('Belum tepat — itu benda lain. Coba benda yang lain.'))} />
            <p className="mt-2 min-h-[1.25rem] text-sm text-bad" role="alert">{wrong}</p>
          </div>
        )}
        {step === 1 && (
          <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><EvidenceCard clue={clue} index={1} /></motion.div>
            <Button variant="primary" size="lg" onClick={next}>Simpan sebagai bukti</Button>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-3">
            <div className="flex items-start gap-3 rounded-xl border border-gold-500/30 bg-ink-800 p-3">
              <DalilMark size={44} />
              <div className="text-sm">{hint ? <RichText text="Petunjuk 1/3: Baca perintah dengan teliti. Setelah kata **عَنِ** ada kata benda yang dicari." /> : 'Halo, aku Dalil. Tekan tombol di bawah untuk mencoba.'}</div>
            </div>
            <Button icon={<DalilMark size={20} />} onClick={() => setHint(true)}>Beri petunjuk</Button>
            <Button variant="primary" disabled={!hint} onClick={next}>Lanjut</Button>
          </div>
        )}
        {step >= 3 && (
          <div className="grid gap-4">
            <div className="paper p-4"><p className="mb-1 text-xs font-semibold text-ink-600">Kesimpulanmu</p><p className="text-sm">Benda yang kamu temukan adalah <Ar size="md" className="font-semibold">الْحَاوِيَةُ</Ar> (kontainer).</p></div>
            <Button variant="primary" size="lg" onClick={finish}>Mulai Case 01</Button>
          </div>
        )}
      </main>
    </>
  )
}
