import { motion } from 'framer-motion'
import { Lock, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { TopBar } from '../components/common/TopBar'
import { Stars } from '../components/common/Stars'
import { Ar } from '../components/common/RichText'
import { CASES } from '../data/cases'
import { totalXp } from '../engine/analytics'
import { getRank } from '../engine/scoring'
import { isCaseUnlocked, useActivePlayer, usePlayerStore } from '../stores/playerStore'
import { useGameStore } from '../stores/gameStore'
import { useUiStore } from '../stores/uiStore'
import { SyncBadge } from '../components/common/SyncStatus'

export function CaseSelect() {
  const player = useActivePlayer()!
  const settings = usePlayerStore((s) => s.settings)
  const nav = useNavigate()
  const push = useUiStore((s) => s.push)
  const session = useGameStore((s) => s.session)
  const xp = totalXp(player)
  const { rank, next, progress } = getRank(xp)

  return (
    <>
      <TopBar right={
        <nav className="flex items-center gap-1 text-sm">
          <Link className="tap inline-flex items-center rounded-lg px-3 hover:bg-ink-800" to="/achievements">Pencapaian</Link>
          <Link className="tap inline-flex items-center rounded-lg px-3 hover:bg-ink-800" to="/teacher">Mode Guru</Link>
          <Link className="tap inline-flex items-center rounded-lg px-3 hover:bg-ink-800" to="/settings">Pengaturan</Link>
        </nav>} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="panel mb-6 flex flex-wrap items-center gap-4 p-4">
          <div className="flex-1">
            <p className="text-sm text-cream-300">Selamat datang, {player.name}</p>
            <Ar size="lg" className="block text-gold-400">{rank.ar}</Ar>
            <p className="text-xs text-cream-300">{rank.idn}</p>
          </div>
          <div className="w-full sm:w-72">
            <div className="mb-1 flex justify-between text-xs"><span>{xp.toLocaleString('id-ID')} XP</span><span>{next ? `menuju ${next.idn} (${next.min})` : 'Peringkat tertinggi'}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-600" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Kemajuan peringkat">
              <motion.div className="h-full bg-gold-500" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">Berkas kasus</h1>
          {settings.demoUnlock && <span className="chip" title="Semua kasus terbuka untuk presentasi">Mode Presentasi aktif</span>}
          <SyncBadge />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CASES.map((c, i) => {
            const pr = player.progress[c.id]
            const unlocked = isCaseUnlocked(player, settings, c)
            const done = Boolean(pr?.completed)
            const inProgress = session?.caseId === c.id && session.playerId === player.id && session.stage === 'play'
            return (
              <motion.li key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <button
                  onClick={() => (unlocked ? nav(`/case/${c.id}`) : push({ kind: 'info', title: `Case ${c.number} masih terkunci`, body: `Selesaikan Case ${c.number - 1} dulu.` }))}
                  aria-disabled={!unlocked}
                  className={`relative block h-full w-full rounded-lg p-4 text-left transition-transform ${unlocked ? 'paper hover:-translate-y-1' : 'border border-ink-600 bg-ink-800/60 text-cream-300'}`}>
                  <span className={`absolute -top-2 left-4 rounded-t-md px-3 py-0.5 text-[11px] font-bold ${unlocked ? 'bg-gold-500 text-ink-900' : 'bg-ink-600 text-cream-300'}`}>CASE {String(c.number).padStart(2, '0')}</span>
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <Ar size="lg" className={`block ${unlocked ? 'text-ink-900' : ''}`}>{c.titleAr}</Ar>
                    {!unlocked && <Lock size={20} aria-label="Terkunci" />}
                  </div>
                  <p className={`text-sm font-semibold ${unlocked ? 'text-ink-800' : ''}`}>{c.titleId}</p>
                  <p className={`mt-1 text-xs ${unlocked ? 'text-ink-600' : ''}`}>{c.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`flex items-center gap-0.5 text-[11px] ${unlocked ? 'text-ink-600' : ''}`}>Tingkat {Array.from({ length: 5 }).map((_, k) => <span key={k} className={`ml-0.5 h-1.5 w-3 rounded-sm ${k < c.difficulty ? (unlocked ? 'bg-ink-800' : 'bg-cream-400') : 'bg-ink-500/40'}`} />)}</span>
                    {done ? <span className="flex items-center gap-2"><Stars value={pr.stars} /><span className="rounded bg-good/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">SELESAI</span></span>
                      : inProgress ? <span className="rounded bg-signal-400/20 px-1.5 py-0.5 text-[11px] font-bold text-sky-700">BERLANGSUNG</span>
                        : unlocked ? <span className="text-[11px] font-bold text-ink-700">BARU</span> : <span className="text-[11px]">TERKUNCI</span>}
                  </div>
                  {done && <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-700"><RotateCcw size={12} /> Main lagi</span>}
                </button>
              </motion.li>
            )
          })}
        </ul>
      </main>
    </>
  )
}
