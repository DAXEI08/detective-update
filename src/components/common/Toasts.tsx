import { AnimatePresence, motion } from 'framer-motion'
import { Award, CheckCircle2, Info } from 'lucide-react'
import { useUiStore } from '../../stores/uiStore'
import { Ar } from './RichText'

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismiss)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-3" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button key={t.id} layout onClick={() => dismiss(t.id)}
            initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-left shadow-xl ${t.kind === 'achievement' ? 'border-gold-500 bg-ink-800 shadow-glow' : 'border-ink-500 bg-ink-800'}`}>
            {t.kind === 'achievement' ? <Award className="text-gold-500" /> : t.kind === 'success' ? <CheckCircle2 className="text-good" /> : <Info className="text-signal-400" />}
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{t.title}</span>
              {t.ar && <Ar size="sm" className="block text-gold-300">{t.ar}</Ar>}
              {t.body && <span className="block text-xs text-cream-300">{t.body}</span>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
