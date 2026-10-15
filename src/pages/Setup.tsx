import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import { Button } from '../components/common/Button'
import { TopBar } from '../components/common/TopBar'
import { completedCount, totalXp } from '../engine/analytics'
import { usePlayerStore } from '../stores/playerStore'
import { CASES } from '../data/cases'

export function Setup() {
  const nav = useNavigate()
  const players = usePlayerStore((s) => s.players)
  const create = usePlayerStore((s) => s.createPlayer)
  const select = usePlayerStore((s) => s.selectPlayer)
  const [name, setName] = useState('')
  const [cls, setCls] = useState('')
  const [err, setErr] = useState('')
  const list = Object.values(players).sort((a, b) => b.createdAt - a.createdAt)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (n.length < 2) { setErr('Tulis nama siswa minimal 2 huruf.'); return }
    if (n.length > 40) { setErr('Nama terlalu panjang (maksimal 40 karakter).'); return }
    create(n, cls)
    nav('/tutorial')
  }

  return (
    <>
      <TopBar title="Siapkan penyelidik" back="/" />
      <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8 md:grid-cols-2">
        <form onSubmit={submit} className="panel p-5" noValidate>
          <h2 className="mb-4 text-lg font-bold">Penyelidik baru</h2>
          <label className="mb-1 block text-sm font-medium" htmlFor="nm">Nama siswa</label>
          <input id="nm" value={name} onChange={(e) => { setName(e.target.value); setErr('') }} autoComplete="off" maxLength={60}
            className="tap mb-1 w-full rounded-lg border border-ink-500 bg-ink-900 px-3 text-cream-100 placeholder:text-ink-400" placeholder="mis. Ahmad Fauzi" aria-describedby="nm-err" aria-invalid={Boolean(err)} />
          <p id="nm-err" className="mb-3 min-h-[1.25rem] text-sm text-bad" role="alert">{err}</p>
          <label className="mb-1 block text-sm font-medium" htmlFor="kl">Kelas <span className="text-cream-400">(opsional)</span></label>
          <input id="kl" value={cls} onChange={(e) => setCls(e.target.value)} maxLength={20} autoComplete="off"
            className="tap mb-5 w-full rounded-lg border border-ink-500 bg-ink-900 px-3 text-cream-100 placeholder:text-ink-400" placeholder="mis. X TKJ 2" />
          <Button type="submit" variant="primary" size="lg" className="w-full">Lanjut ke tutorial</Button>
        </form>
        <section className="panel p-5">
          <h2 className="mb-1 text-lg font-bold">Siswa di perangkat ini</h2>
          <p className="mb-3 text-xs text-cream-300">Data tersimpan lokal di browser ini. Pilih nama untuk melanjutkan.</p>
          {list.length === 0 ? <p className="text-sm text-cream-300">Belum ada siswa.</p> : (
            <ul className="grid gap-2">
              {list.map((p) => (
                <li key={p.id}>
                  <button onClick={() => { select(p.id); nav('/cases') }} className="tap flex w-full items-center gap-3 rounded-lg bg-ink-700 px-3 py-2 text-left hover:bg-ink-600">
                    <UserRound size={18} />
                    <span className="flex-1"><span className="block text-sm font-semibold">{p.name}</span><span className="text-xs text-cream-300">{p.className || 'Tanpa kelas'} · {completedCount(p)}/{CASES.length} kasus</span></span>
                    <span className="text-xs font-bold text-gold-400">{totalXp(p)} XP</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  )
}
