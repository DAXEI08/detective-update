import { ArrowLeft, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { totalXp } from '../../engine/analytics'
import { getRank } from '../../engine/scoring'
import { useActivePlayer } from '../../stores/playerStore'

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-500 text-ink-900"><Search size={18} strokeWidth={2.8} /></span>
      {!small && <span className="font-bold tracking-tight">Arabic Detective</span>}
    </span>
  )
}

export function TopBar({ title, back, right }: { title?: string; back?: string; right?: ReactNode }) {
  const nav = useNavigate()
  const player = useActivePlayer()
  const xp = player ? totalXp(player) : 0
  const { rank } = getRank(xp)
  return (
    <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        {back ? (
          <button onClick={() => nav(back)} aria-label="Kembali" className="tap grid place-items-center rounded-lg hover:bg-ink-700"><ArrowLeft size={20} /></button>
        ) : (
          <Link to="/cases" aria-label="Beranda"><Logo small /></Link>
        )}
        {title && <h1 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">{title}</h1>}
        {!title && <span className="flex-1" />}
        {right}
        {player && (
          <Link to="/achievements" className="hidden items-center gap-2 rounded-lg px-2 py-1 text-right hover:bg-ink-800 sm:flex" aria-label="Pencapaian">
            <span className="leading-tight">
              <span className="block text-xs font-semibold">{player.name}</span>
              <span lang="ar" dir="rtl" className="ar block text-sm leading-none text-gold-400">{rank.ar}</span>
            </span>
            <span className="rounded-md bg-ink-700 px-2 py-1 text-xs font-bold text-gold-400">{xp.toLocaleString('id-ID')} XP</span>
          </Link>
        )}
      </div>
    </header>
  )
}
