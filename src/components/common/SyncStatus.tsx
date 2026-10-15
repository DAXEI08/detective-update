import { useState } from 'react'
import { Cloud, CloudOff, CheckCircle2, RefreshCw, TriangleAlert } from 'lucide-react'
import { cloudEnabled, flushAttemptQueue, getAttemptSyncState } from '../../services/cloud/supabase'
import type { SyncState } from '../../services/cloud/supabase'
import { useSyncStore } from '../../stores/syncStore'

const LABEL: Record<SyncState, string> = {
  disabled: 'Tersimpan di perangkat',
  local: 'Tersimpan di perangkat',
  synced: 'Tersinkron ke cloud',
  pending: 'Menunggu koneksi untuk dikirim',
  retrying: 'Gagal sinkron, akan dicoba lagi',
  failed: 'Ditolak server — hubungi guru',
}

/** Honest, quiet sync status for one attempt (Results page). */
export function SyncNote({ attemptId }: { attemptId: string }) {
  useSyncStore((s) => `${s.pending}/${s.failed}/${s.flushing}`) // re-render when queue changes
  const online = useSyncStore((s) => s.online)
  const [busy, setBusy] = useState(false)
  const state = getAttemptSyncState(attemptId)
  const label = state === 'pending' && online ? 'Mengirim ke cloud…' : LABEL[state]
  const Icon = state === 'synced' ? CheckCircle2 : state === 'failed' || state === 'retrying' ? TriangleAlert : state === 'pending' ? CloudOff : Cloud
  const tone = state === 'synced' ? 'text-good' : state === 'failed' || state === 'retrying' ? 'text-amber-300' : 'text-cream-300'
  const canRetry = state === 'pending' || state === 'retrying' || state === 'failed'
  return (
    <p className={`mt-4 flex flex-wrap items-center justify-center gap-2 text-xs ${tone}`} role="status">
      <Icon size={14} aria-hidden /> {label}
      {canRetry && cloudEnabled && (
        <button className="tap inline-flex items-center gap-1 rounded-lg px-2 underline" disabled={busy}
          onClick={async () => { setBusy(true); try { await flushAttemptQueue({ manual: true }) } finally { setBusy(false) } }}>
          <RefreshCw size={12} className={busy ? 'animate-spin' : ''} /> Coba kirim lagi
        </button>
      )}
    </p>
  )
}

/** Small global badge: only visible when something is waiting to be synced. */
export function SyncBadge() {
  const pending = useSyncStore((s) => s.pending)
  const failed = useSyncStore((s) => s.failed)
  const online = useSyncStore((s) => s.online)
  const n = pending + failed
  if (!cloudEnabled || n === 0) return null
  return (
    <span className="chip" role="status" title={online ? 'Akan dikirim otomatis' : 'Menunggu koneksi internet'}>
      {online ? <Cloud size={12} /> : <CloudOff size={12} />} {n} nilai {online ? 'menunggu sinkron' : 'menunggu koneksi'}
    </span>
  )
}
