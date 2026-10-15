import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardList } from 'lucide-react'
import { Button } from '../components/common/Button'
import { Logo } from '../components/common/TopBar'
import { Ar } from '../components/common/RichText'
import { EntityGlyph } from '../components/game/EntityIcon'
import { useActivePlayer } from '../stores/playerStore'

function Board() {
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[460px] sm:h-[440px]" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 460 440" preserveAspectRatio="none">
        <motion.path d="M110 92 C 200 110, 240 170, 330 150 S 380 260, 300 330 S 150 330, 120 300" fill="none" stroke="#F5BF4F" strokeWidth="2.5" strokeDasharray="7 7"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: 'easeInOut' }} />
      </svg>
      <motion.div initial={{ opacity: 0, y: 20, rotate: -9 }} animate={{ opacity: 1, y: 0, rotate: -5 }} transition={{ delay: 0.15 }} className="paper absolute left-0 top-4 w-48 p-3">
        <p className="text-[11px] font-bold text-ink-600">CASE 01</p>
        <Ar size="md" className="block text-ink-900">الْمَفْقُودُ</Ar>
        <div className="mt-1 flex justify-between"><span className="text-xs text-ink-600">The Missing Object</span><EntityGlyph kind="container" size={30} /></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20, rotate: 8 }} animate={{ opacity: 1, y: 0, rotate: 4 }} transition={{ delay: 0.35 }} className="paper absolute right-0 top-24 w-56 p-3">
        <p lang="ar" dir="rtl" className="ar text-sm leading-none text-ink-700">الدَّلِيلُ ٠٣</p>
        <Ar size="md" className="block text-ink-900">الْحَاوِيَةُ أَمَامَ الْمَخْزَنِ.</Ar>
        <div className="mt-1 flex gap-1"><EntityGlyph kind="container" size={28} /><EntityGlyph kind="warehouse" size={28} /></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ delay: 0.55 }} className="absolute bottom-6 left-6 w-60 rounded-xl border border-ink-500 bg-ink-800 p-3 shadow-paper">
        <p className="mb-1 text-[11px] font-semibold text-gold-400">Dalil · petunjuk 1/3</p>
        <p className="text-xs text-cream-200">Perhatikan kata yang menunjukkan posisi pada petunjuk.</p>
      </motion.div>
      {[[104, 90], [330, 150], [300, 332], [120, 300]].map(([x, y], i) => (
        <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9 + i * 0.2, type: 'spring' }}
          className="absolute h-4 w-4 rounded-full border-2 border-ink-900 bg-gold-500" style={{ left: `${(x / 460) * 100}%`, top: `${(y / 440) * 100}%` }} />
      ))}
    </div>
  )
}

export function Landing() {
  const nav = useNavigate()
  const player = useActivePlayer()
  return (
    <main className="bg-grid relative min-h-screen overflow-hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <Link to="/teacher" className="tap inline-flex items-center gap-1.5 rounded-lg px-3 text-sm text-cream-300 hover:bg-ink-800"><ClipboardList size={16} /> Mode Guru</Link>
      </div>
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-12 pt-4 lg:grid-cols-[1.1fr_1fr] lg:pt-12">
        <div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">Arabic Detective</motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Ar size="xl" className="block text-gold-400">المُحَقِّقُ اللُّغَوِيُّ</Ar>
            <p className="mt-3 max-w-md text-lg text-cream-100">Pahami petunjuk. Hubungkan bukti. Pecahkan kasus dengan bahasa Arab.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="lg" icon={<ArrowRight size={20} />} onClick={() => nav(player ? '/cases' : '/setup')}>{player ? `Lanjut sebagai ${player.name}` : 'Mulai Investigasi'}</Button>
            {player && <Button size="lg" onClick={() => nav('/setup')}>Ganti siswa</Button>}
          </motion.div>
          <ul className="mt-8 flex max-w-lg flex-wrap gap-2 text-xs">
            <li className="chip">5 kasus pelabuhan</li><li className="chip">Papan Bukti interaktif</li><li className="chip">Asisten Dalil: petunjuk bertingkat, 100% offline</li><li className="chip">Dasbor guru</li>
          </ul>
        </div>
        <Board />
      </div>
    </main>
  )
}
