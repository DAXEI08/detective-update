import { motion } from 'framer-motion'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Ar } from '../components/common/RichText'
import { Stars } from '../components/common/Stars'
import { TopBar } from '../components/common/TopBar'
import { CASES, getCase } from '../data/cases'
import { labelOf } from '../data/vocabulary'
import { totalXp } from '../engine/analytics'
import { recommend } from '../engine/recommendation'
import { SyncNote } from '../components/common/SyncStatus'
import { getRank } from '../engine/scoring'
import { useActivePlayer } from '../stores/playerStore'
import { formatDuration, pct } from '../utils/format'

export function Results() {
  const { id } = useParams()
  const def = getCase(id)
  const player = useActivePlayer()!
  const nav = useNavigate()
  const r = def ? player.progress[def.id]?.lastResult : null
  if (!def || !r) return <Navigate to="/cases" replace />
  const next = CASES[def.number]
  const isFinal = def.number === CASES.length
  const { rank } = getRank(totalXp(player))
  const vocabRows = Object.entries(r.vocab)
    .map(([k, v]) => ({ k, ...v, l: labelOf(k) }))
    .filter((x) => x.l)
    .sort((a, b) => b.w - a.w || b.c - a.c)

  const rec = recommend(r)
  const attemptId = `${player.id}:${def.id}:${r.at}`
  const rows: [string, string][] = [
    ['Akurasi', pct(r.accuracy)], ['XP', r.xp.toLocaleString('id-ID')], ['Bukti', `${r.evidenceFound}/${r.evidenceTotal}`],
    ['Petunjuk Dalil', String(r.hints)], ['Salah', String(r.mistakes)], ['Waktu', formatDuration(r.timeMs)],
  ]
  return (
    <>
      <TopBar title={`Hasil · CASE ${def.number}`} back="/cases" />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="paper p-6 text-center sm:p-8">
          <p className="text-sm font-extrabold tracking-wide text-emerald-700">CASE SOLVED</p>
          <Ar size="xl" className="block text-ink-900">تَمَّ حَلُّ الْقَضِيَّةِ</Ar>
          <p className="text-sm text-ink-600">{def.titleId}</p>
          <div className="mt-3 flex justify-center">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3 + i * 0.2, type: 'spring' }} className="mx-1">
                <Stars value={i < r.stars ? 1 : 0} max={1} size={44} />
              </motion.span>
            ))}
          </div>
          <dl className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-left sm:grid-cols-3">
            {rows.map(([k, v]) => (<div key={k}><dt className="text-xs text-ink-600">{k}</dt><dd className="text-lg font-bold">{v}</dd></div>))}
          </dl>
          {r.firstClear && next && <p className="mt-4 rounded-lg bg-ink-900 px-3 py-2 text-sm text-gold-300">Kasus baru terbuka: CASE {next.number} · {next.titleId}</p>}
          {isFinal && <p className="mt-4 rounded-lg bg-ink-900 px-3 py-2 text-sm text-gold-300">Peringkatmu sekarang: <Ar size="sm">{rank.ar}</Ar> ({rank.idn})</p>}
          <p className="mt-4 rounded-lg border border-ink-900/20 bg-white/50 px-3 py-2 text-sm font-medium text-ink-800" data-testid="recommendation">{rec.text}</p>
          <div className="text-ink-700"><SyncNote attemptId={attemptId} /></div>
        </motion.div>

        <section className="panel mt-5 p-4">
          <h2 className="mb-2 text-sm font-semibold">Performa kosakata</h2>
          {rec.strong.length > 0 && <p className="mb-2 text-xs text-cream-300">Sudah dikuasai: {rec.strong.map((x) => <Ar key={x.id} size="sm" className="mx-1 text-good">{x.ar}</Ar>)}</p>}
          {vocabRows.length === 0 ? <p className="text-sm text-cream-300">Tidak ada data.</p> : (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {vocabRows.map((v) => (
                <li key={v.k} className="flex items-center justify-between rounded-lg bg-ink-700/60 px-3 py-1.5">
                  <Ar size="sm">{v.l!.ar}</Ar>
                  <span className="text-xs"><span className="text-good">{v.c} benar</span> · <span className={v.w ? 'text-bad' : 'text-cream-400'}>{v.w} salah</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => nav(`/case/${def.id}`)}>Main lagi</Button>
          <Link to="/cases"><Button className="w-full">Pilih kasus</Button></Link>
          {next && <Button variant="primary" onClick={() => nav(`/case/${next.id}`)}>Kasus berikutnya</Button>}
        </div>
      </main>
    </>
  )
}
