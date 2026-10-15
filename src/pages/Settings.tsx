import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Modal } from '../components/common/Modal'
import { TopBar } from '../components/common/TopBar'
import { pendingCount } from '../services/cloud/supabase'
import { useActivePlayer, usePlayerStore } from '../stores/playerStore'
import { useGameStore } from '../stores/gameStore'
import { useUiStore } from '../stores/uiStore'

function Toggle({ label, desc, on, set }: { label: string; desc: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-cream-300">{desc}</p></div>
      <button role="switch" aria-checked={on} aria-label={label} onClick={() => set(!on)} className={`tap relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? 'bg-gold-500' : 'bg-ink-500'}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${on ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  )
}

export function Settings() {
  const nav = useNavigate()
  const player = useActivePlayer()!
  const settings = usePlayerStore((s) => s.settings)
  const setSettings = usePlayerStore((s) => s.setSettings)
  const resetActive = usePlayerStore((s) => s.resetActiveProgress)
  const resetAll = usePlayerStore((s) => s.resetAll)
  const deletePlayer = usePlayerStore((s) => s.deletePlayer)
  const signOut = usePlayerStore((s) => s.signOut)
  const clearSession = useGameStore((s) => s.clearSession)
  const push = useUiStore((s) => s.push)
  const [confirm, setConfirm] = useState<'me' | 'all' | 'delete' | null>(null)

  const doReset = () => {
    clearSession()
    if (confirm === 'delete') { const id = player.id; deletePlayer(id); push({ kind: 'success', title: 'Siswa dihapus' }); nav('/setup') }
    else if (confirm === 'all') { resetAll(); push({ kind: 'success', title: 'Semua data dihapus' }); nav('/') }
    else { resetActive(); push({ kind: 'success', title: 'Progres direset', body: `Progres ${player.name} dikembalikan dari awal.` }) }
    setConfirm(null)
  }

  return (
    <>
      <TopBar title="Pengaturan" back="/cases" />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <section className="panel divide-y divide-ink-700 px-4">
          <Toggle label="Kurangi animasi" desc="Matikan gerakan non-esensial." on={settings.reduceMotion} set={(v) => setSettings({ reduceMotion: v })} />
          <Toggle label="Mode Presentasi" desc="Untuk demo/juri: semua kasus terbuka tanpa urutan. Progres utama tidak diubah; membuka kasus lain tidak menandai kasus sebelumnya selesai." on={settings.demoUnlock} set={(v) => setSettings({ demoUnlock: v })} />
          <div className="py-3">
            <p className="text-sm font-semibold">Asisten Dalil</p>
            <p className="text-xs text-cream-300">Sistem petunjuk bertingkat yang disusun sebelumnya. Berjalan sepenuhnya offline, hasilnya selalu konsisten, dan tidak pernah memberi jawaban akhir.</p>
          </div>
        </section>
        <section className="panel mt-6 p-4">
          <h2 className="mb-1 text-sm font-semibold">Siswa aktif: {player.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => { signOut(); nav('/setup') }}>Ganti siswa</Button>
            <Button variant="danger" onClick={() => setConfirm('me')}>Reset Progress</Button>
            <Button variant="danger" onClick={() => setConfirm('delete')}>Hapus siswa ini</Button>
            <Button variant="danger" onClick={() => setConfirm('all')}>Hapus semua data</Button>
          </div>
        </section>
      </main>
      <Modal open={confirm !== null} onClose={() => setConfirm(null)}
        title={confirm === 'all' ? 'Hapus semua data siswa?' : confirm === 'delete' ? `Hapus siswa ${player.name}?` : `Reset progres ${player.name}?`}>
        <p className="text-sm text-cream-300">
          {confirm === 'all' ? 'Seluruh siswa, progres, dan pencapaian di browser ini akan dihapus. Tindakan ini tidak bisa dibatalkan.'
            : confirm === 'delete' ? 'Siswa ini beserta progres dan pencapaiannya dihapus dari perangkat ini. Tidak bisa dibatalkan.'
              : 'XP, bintang, pencapaian, dan statistik siswa ini akan dikembalikan ke awal.'}
        </p>
        {pendingCount() > 0 && <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">Ada {pendingCount()} nilai yang belum terkirim ke cloud. Nilai itu tetap disimpan di antrean dan akan dikirim saat online.</p>}
        <div className="mt-4 flex justify-end gap-2"><Button onClick={() => setConfirm(null)}>Batal</Button><Button variant="danger" onClick={doReset}>{'Ya, lanjutkan'}</Button></div>
      </Modal>
    </>
  )
}
