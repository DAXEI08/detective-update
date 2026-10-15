import { motion } from 'framer-motion'
import { Award, BookOpenCheck, Eye, MapPin, Trophy } from 'lucide-react'
import { TopBar } from '../components/common/TopBar'
import { Ar } from '../components/common/RichText'
import { ACHIEVEMENTS } from '../data/achievements'
import { totalXp } from '../engine/analytics'
import { RANKS, getRank } from '../engine/scoring'
import { useActivePlayer } from '../stores/playerStore'

const ICONS = { eye: Eye, book: BookOpenCheck, map: MapPin, trophy: Trophy }

export function Achievements() {
  const player = useActivePlayer()!
  const xp = totalXp(player)
  const { rank } = getRank(xp)
  return (
    <>
      <TopBar title="Pencapaian" back="/cases" />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <section className="panel mb-6 p-4">
          <h2 className="mb-3 text-sm font-semibold">Peringkat · {xp.toLocaleString('id-ID')} XP</h2>
          <ol className="grid gap-2 sm:grid-cols-3">
            {RANKS.map((r) => (
              <li key={r.id} className={`rounded-lg border p-3 ${r.id === rank.id ? 'border-gold-500 bg-ink-700 shadow-glow' : xp >= r.min ? 'border-ink-500 bg-ink-800' : 'border-ink-600 bg-ink-800/40 opacity-70'}`}>
                <Ar size="md" className="block text-gold-400">{r.ar}</Ar>
                <p className="text-xs text-cream-300">{r.idn} · mulai {r.min} XP</p>
                {r.id === rank.id && <p className="mt-1 text-xs font-semibold text-good">Peringkat saat ini</p>}
              </li>
            ))}
          </ol>
        </section>
        <ul className="grid gap-4 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a, i) => {
            const at = player.achievements[a.id]
            const Icon = ICONS[a.icon] ?? Award
            return (
              <motion.li key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`flex gap-4 rounded-xl border p-4 ${at ? 'border-gold-500/60 bg-ink-800 shadow-glow' : 'border-ink-600 bg-ink-800/40'}`}>
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${at ? 'bg-gold-500 text-ink-900' : 'bg-ink-700 text-ink-400'}`}><Icon size={26} /></span>
                <div>
                  <Ar size="md" className={`block ${at ? 'text-gold-400' : 'text-cream-300'}`}>{a.ar}</Ar>
                  <p className="text-sm font-semibold">{a.idn}</p>
                  <p className="text-xs text-cream-300">{a.desc}</p>
                  <p className={`mt-1 text-xs font-semibold ${at ? 'text-good' : 'text-cream-400'}`}>{at ? `Terbuka · ${new Date(at).toLocaleDateString('id-ID')}` : 'Terkunci'}</p>
                </div>
              </motion.li>
            )
          })}
        </ul>
      </main>
    </>
  )
}
