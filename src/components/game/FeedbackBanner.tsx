import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CircleAlert, Info } from 'lucide-react'
import { RichText } from '../common/RichText'

export interface Feedback { kind: 'good' | 'bad' | 'info'; text: string; key?: number }
const GOOD = ['أَحْسَنْتَ!', 'مُمْتَازٌ!', 'رَائِعٌ!']
let n = 0

export function FeedbackBanner({ feedback }: { feedback: Feedback | null }) {
  return (
    <div aria-live="polite" className="min-h-[3.5rem]">
      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div key={feedback.key ?? feedback.text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className={`flex gap-3 rounded-xl border p-3 ${feedback.kind === 'good' ? 'border-good/50 bg-good/10' : feedback.kind === 'bad' ? 'border-bad/50 bg-bad/10' : 'border-signal-400/40 bg-signal-400/10'}`}>
            {feedback.kind === 'good' ? <CheckCircle2 className="mt-0.5 shrink-0 text-good" /> : feedback.kind === 'bad' ? <CircleAlert className="mt-0.5 shrink-0 text-bad" /> : <Info className="mt-0.5 shrink-0 text-signal-400" />}
            <div className="min-w-0 text-sm leading-relaxed">
              {feedback.kind === 'good' && <span lang="ar" dir="rtl" className="ar mb-0.5 block text-xl leading-normal text-good">{GOOD[n++ % GOOD.length]}</span>}
              {feedback.kind === 'bad' && <span lang="ar" dir="rtl" className="ar mb-0.5 block text-lg leading-normal text-bad">حَاوِلْ مَرَّةً أُخْرَى</span>}
              <RichText text={feedback.text} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
