import type { CaseDefinition, CaseResult, PlayerProfile } from '../../types'
import { loadJSON, saveJSON, storage } from '../persistence/storage'
import { useSyncStore } from '../../stores/syncStore'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const AUTH_KEY = 'arabic-detective:v1:teacher-auth'
const QUEUE_KEY = 'arabic-detective:v1:cloud-queue'
const SYNCED_KEY = 'arabic-detective:v1:cloud-synced'
const FETCH_TIMEOUT_MS = 15000
const SYNCED_MEMORY = 300

export const cloudEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

interface TeacherSession {
  access_token: string
  refresh_token?: string
  expires_at?: number
  user?: { id?: string; email?: string }
}

export interface AttemptPayload {
  clientAttemptId: string
  studentClientId: string
  studentName: string
  className: string
  caseId: string
  caseNumber: number
  caseTitle: string
  attemptNumber: number
  score: number
  accuracy: number
  correct: number
  mistakes: number
  hints: number
  xp: number
  stars: number
  evidenceFound: number
  evidenceTotal: number
  durationMs: number
  startedAt: string
  finishedAt: string
  details: Record<string, unknown>
}

export interface TeacherAttempt {
  id: string
  client_attempt_id: string
  case_id: string
  case_number: number
  case_title: string
  attempt_number: number
  score: number
  accuracy: number
  correct_count: number
  mistake_count: number
  hint_count: number
  xp: number
  stars: number
  evidence_found: number
  evidence_total: number
  duration_ms: number
  started_at: string
  finished_at: string
  details: Record<string, unknown>
  students: { id: string; name: string; class_name: string; client_id: string } | null
}


/* ------------------------------------------------------------------ */
/* low-level helpers                                                   */
/* ------------------------------------------------------------------ */

export class CloudError extends Error {
  readonly status: number
  /** true = the server rejected this payload (4xx other than 408/429); retrying will not help. */
  readonly permanent: boolean
  constructor(message: string, status = 0) {
    super(message)
    this.status = status
    this.permanent = status >= 400 && status < 500 && ![401, 408, 429].includes(status)
  }
}
export class TeacherAuthError extends Error {}

function baseHeaders(token?: string): Record<string, string> {
  return { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' }
}

async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

async function readJson(res: Response): Promise<any> {
  try { return await res.json() } catch { return null }
}

function messageOf(data: any, fallback: string): string {
  return (data && (data.error_description || data.msg || data.message || data.hint)) || fallback
}

/* ------------------------------------------------------------------ */
/* teacher auth (access token + refresh token)                         */
/* ------------------------------------------------------------------ */

function isSession(x: unknown): x is TeacherSession {
  return typeof x === 'object' && x !== null && typeof (x as TeacherSession).access_token === 'string' && (x as TeacherSession).access_token.length > 0
}
function readSession(): TeacherSession | null {
  const raw = loadJSON(AUTH_KEY)
  return isSession(raw) ? raw : null
}
export function teacherSession(): TeacherSession | null { return readSession() }

function toSession(data: any, prev?: TeacherSession): TeacherSession {
  const expires = Number(data?.expires_at) || (Number(data?.expires_in) ? Math.floor(Date.now() / 1000) + Number(data.expires_in) : undefined)
  return {
    access_token: String(data?.access_token ?? ''),
    refresh_token: data?.refresh_token ?? prev?.refresh_token,
    expires_at: expires,
    user: data?.user ? { id: data.user.id, email: data.user.email } : prev?.user,
  }
}

export async function signInTeacher(email: string, password: string): Promise<TeacherSession> {
  if (!cloudEnabled) throw new Error('Supabase belum dikonfigurasi.')
  let res: Response
  try {
    res = await timedFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: baseHeaders(), body: JSON.stringify({ email, password }) })
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet.')
  }
  const data = await readJson(res)
  if (!res.ok || !data?.access_token) throw new Error(messageOf(data, 'Login gagal. Periksa email dan password.'))
  const session = toSession(data)
  saveJSON(AUTH_KEY, session)
  return session
}

export function signOutTeacher(): void { storage.remove(AUTH_KEY) }

let refreshing: Promise<TeacherSession> | null = null

/** Single-flight refresh (refresh tokens rotate, so concurrent refreshes would invalidate each other). */
export function refreshTeacherSession(): Promise<TeacherSession> {
  if (refreshing) return refreshing
  refreshing = (async () => {
    const cur = readSession()
    if (!cur?.refresh_token) { signOutTeacher(); throw new TeacherAuthError('Sesi guru berakhir. Silakan login lagi.') }
    let res: Response
    try {
      res = await timedFetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: baseHeaders(), body: JSON.stringify({ refresh_token: cur.refresh_token }) })
    } catch {
      // Network problem: keep the session, let the caller retry later.
      throw new Error('Koneksi bermasalah. Coba lagi sebentar.')
    }
    const data = await readJson(res)
    if (!res.ok || !data?.access_token) {
      if (res.status >= 500 || res.status === 429) throw new Error('Server sedang sibuk. Coba lagi sebentar.')
      signOutTeacher()
      throw new TeacherAuthError('Sesi guru berakhir. Silakan login lagi.')
    }
    const next = toSession(data, cur)
    saveJSON(AUTH_KEY, next)
    return next
  })().finally(() => { refreshing = null })
  return refreshing
}

async function validAccessToken(): Promise<string> {
  const s = readSession()
  if (!s) throw new TeacherAuthError('Silakan login sebagai guru.')
  const now = Math.floor(Date.now() / 1000)
  if (s.expires_at && s.expires_at - 60 <= now) return (await refreshTeacherSession()).access_token
  return s.access_token
}

/** Authenticated request: proactive refresh when expiring, and exactly one refresh+retry on 401. */
async function authedFetch(url: string): Promise<Response> {
  let token = await validAccessToken()
  let res: Response
  try { res = await timedFetch(url, { headers: baseHeaders(token) }) } catch { throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet.') }
  if (res.status === 401) {
    token = (await refreshTeacherSession()).access_token
    try { res = await timedFetch(url, { headers: baseHeaders(token) }) } catch { throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet.') }
    if (res.status === 401) { signOutTeacher(); throw new TeacherAuthError('Sesi guru berakhir. Silakan login lagi.') }
  }
  return res
}

const ATTEMPT_COLUMNS = 'id,client_attempt_id,case_id,case_number,case_title,attempt_number,score,accuracy,correct_count,mistake_count,hint_count,xp,stars,evidence_found,evidence_total,duration_ms,started_at,finished_at,details,students(id,name,class_name,client_id)'
export const TEACHER_FETCH_LIMIT = 1000

export async function fetchTeacherAttempts(): Promise<TeacherAttempt[]> {
  const url = `${SUPABASE_URL}/rest/v1/attempts?select=${encodeURIComponent(ATTEMPT_COLUMNS)}&order=finished_at.desc&limit=${TEACHER_FETCH_LIMIT}`
  const res = await authedFetch(url)
  const data = await readJson(res)
  if (!res.ok) throw new Error(messageOf(data, 'Gagal mengambil data siswa.'))
  if (!Array.isArray(data)) throw new Error('Format data dari server tidak dikenali.')
  return data as TeacherAttempt[]
}

/* ------------------------------------------------------------------ */
/* attempt queue: local result is the source of truth, cloud is backup */
/* ------------------------------------------------------------------ */

export interface QueueEntry { payload: AttemptPayload; attempts: number; queuedAt: number; lastError?: string; permanent?: boolean }

function readQueue(): QueueEntry[] {
  const raw = loadJSON(QUEUE_KEY)
  if (!Array.isArray(raw)) return []
  const out: QueueEntry[] = []
  const seen = new Set<string>()
  for (const x of raw) {
    // legacy format: bare AttemptPayload
    const entry: QueueEntry | null = x && typeof x === 'object' && 'payload' in x ? x as QueueEntry
      : x && typeof x === 'object' && 'clientAttemptId' in x ? { payload: x as AttemptPayload, attempts: 0, queuedAt: Date.now() } : null
    const id = entry?.payload?.clientAttemptId
    if (!entry || typeof id !== 'string' || seen.has(id)) continue
    seen.add(id)
    out.push(entry)
  }
  return out
}
/** Never truncates: a student's score is only removed after the server confirmed it. */
function writeQueue(items: QueueEntry[]) {
  saveJSON(QUEUE_KEY, items)
  publishStatus()
}
function updateQueue(fn: (q: QueueEntry[]) => QueueEntry[]) { writeQueue(fn(readQueue())) }

function readSynced(): string[] {
  const raw = loadJSON(SYNCED_KEY)
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []
}
function markSynced(id: string) {
  const list = readSynced().filter((x) => x !== id)
  list.push(id)
  saveJSON(SYNCED_KEY, list.slice(-SYNCED_MEMORY))
}

function publishStatus(error?: string) {
  const q = readQueue()
  const patch: Parameters<ReturnType<typeof useSyncStore.getState>['set']>[0] = {
    pending: q.filter((e) => !e.permanent).length,
    failed: q.filter((e) => e.permanent).length,
  }
  if (error !== undefined) patch.lastError = error
  useSyncStore.getState().set(patch)
}

export function pendingCount(): number { return readQueue().length }

export type SyncState = 'disabled' | 'synced' | 'pending' | 'retrying' | 'failed' | 'local'
/** Human-facing sync state of one attempt (used on the Results page). */
export function getAttemptSyncState(clientAttemptId: string): SyncState {
  if (!cloudEnabled) return 'disabled'
  const e = readQueue().find((x) => x.payload.clientAttemptId === clientAttemptId)
  if (e) return e.permanent ? 'failed' : e.attempts > 0 ? 'retrying' : 'pending'
  return readSynced().includes(clientAttemptId) ? 'synced' : 'local'
}

async function sendAttempt(p: AttemptPayload): Promise<void> {
  let res: Response
  try {
    res = await timedFetch(`${SUPABASE_URL}/rest/v1/rpc/submit_attempt`, {
      method: 'POST',
      headers: baseHeaders(),
      body: JSON.stringify({
        p_client_attempt_id: p.clientAttemptId, p_student_client_id: p.studentClientId, p_student_name: p.studentName, p_class_name: p.className,
        p_case_id: p.caseId, p_case_number: p.caseNumber, p_case_title: p.caseTitle, p_attempt_number: p.attemptNumber,
        p_score: p.score, p_accuracy: p.accuracy, p_correct_count: p.correct, p_mistake_count: p.mistakes, p_hint_count: p.hints,
        p_xp: p.xp, p_stars: p.stars, p_evidence_found: p.evidenceFound, p_evidence_total: p.evidenceTotal, p_duration_ms: p.durationMs,
        p_started_at: p.startedAt, p_finished_at: p.finishedAt, p_details: p.details,
      }),
    })
  } catch {
    throw new CloudError('Tidak ada koneksi ke server.', 0)
  }
  if (!res.ok) throw new CloudError(messageOf(await readJson(res), 'Gagal menyinkronkan nilai.'), res.status)
}

let flushing: Promise<{ sent: number; remaining: number }> | null = null

/**
 * Sends queued attempts. Single-flight (no concurrent flushes); the stored queue is re-read after every
 * item, so entries added meanwhile are never overwritten. `manual` also retries entries the server rejected.
 */
export function flushAttemptQueue(opts: { manual?: boolean } = {}): Promise<{ sent: number; remaining: number }> {
  if (!cloudEnabled) return Promise.resolve({ sent: 0, remaining: 0 })
  if (flushing) return flushing
  const run = async () => {
    let sent = 0
    useSyncStore.getState().set({ flushing: true })
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) { publishStatus(); return { sent, remaining: readQueue().length } }
      const todo = readQueue().filter((e) => opts.manual || !e.permanent)
      for (const entry of todo) {
        const id = entry.payload.clientAttemptId
        try {
          await sendAttempt(entry.payload)
          markSynced(id)
          updateQueue((q) => q.filter((x) => x.payload.clientAttemptId !== id))
          sent++
        } catch (e) {
          const err = e instanceof CloudError ? e : new CloudError('Gagal menyinkronkan nilai.')
          updateQueue((q) => q.map((x) => x.payload.clientAttemptId === id
            ? { ...x, attempts: x.attempts + 1, lastError: err.message, permanent: err.permanent }
            : x))
          publishStatus(err.message)
          if (err.status === 0) break // offline / unreachable: stop, try again later
        }
      }
      if (sent > 0 || readQueue().length === 0) publishStatus('')
      return { sent, remaining: readQueue().length }
    } finally {
      useSyncStore.getState().set({ flushing: false })
    }
  }
  // Clear the mutex from outside the async body: if the body finishes synchronously, an inner reset would run before this assignment.
  flushing = run().finally(() => { flushing = null })
  return flushing
}

/**
 * Persist first, then try to send: the score is on disk before any network call, so closing the tab
 * mid-request cannot lose it. Resolves to the resulting sync state; never throws.
 */
export async function submitAttempt(payload: AttemptPayload): Promise<SyncState> {
  if (!cloudEnabled) return 'disabled'
  if (readSynced().includes(payload.clientAttemptId)) return 'synced' // duplicate submission: already confirmed by the server
  try {
    updateQueue((q) => (q.some((x) => x.payload.clientAttemptId === payload.clientAttemptId) ? q : [...q, { payload, attempts: 0, queuedAt: Date.now() }]))
    await flushAttemptQueue()
  } catch { /* never surface cloud problems to the game */ }
  return getAttemptSyncState(payload.clientAttemptId)
}

/** Flush at startup, when the connection returns, when the tab becomes visible, and on a capped backoff while items are pending. */
export function startAutoSync(): () => void {
  if (!cloudEnabled || typeof window === 'undefined') return () => {}
  let stopped = false
  let timer: number | undefined
  let streak = 0
  const schedule = () => {
    if (stopped) return
    window.clearTimeout(timer)
    if (!readQueue().some((e) => !e.permanent)) return
    const delay = Math.min(5 * 60_000, 15_000 * 2 ** Math.min(streak, 5))
    timer = window.setTimeout(() => { void run() }, delay)
  }
  const run = async () => {
    if (stopped) return
    const { sent, remaining } = await flushAttemptQueue().catch(() => ({ sent: 0, remaining: 1 }))
    streak = sent > 0 ? 0 : streak + 1
    if (remaining > 0) schedule()
  }
  const onOnline = () => { useSyncStore.getState().set({ online: true }); streak = 0; void run() }
  const onOffline = () => useSyncStore.getState().set({ online: false })
  const onVisible = () => { if (document.visibilityState === 'visible') void run() }
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  document.addEventListener('visibilitychange', onVisible)
  publishStatus()
  void run()
  return () => {
    stopped = true
    window.clearTimeout(timer)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

export function buildAttemptPayload(
  player: PlayerProfile,
  def: CaseDefinition,
  result: CaseResult,
  session: {
    elapsedMs: number
    lastTick: number
    evidence: string[]
    revealed: string[]
    learned: string[]
    taskStats: Record<string, unknown>
    vocabC: Record<string, number>
    vocabW: Record<string, number>
  } | null,
): AttemptPayload {
  const finished = result.at
  const durationMs = result.timeMs
  const started = finished - durationMs
  return {
    clientAttemptId: `${player.id}:${def.id}:${result.at}`,
    studentClientId: player.id,
    studentName: player.name,
    className: player.className,
    caseId: def.id,
    caseNumber: def.number,
    caseTitle: def.titleId,
    attemptNumber: (player.progress[def.id]?.attempts ?? 0) + 1,
    score: Math.round(result.accuracy * 100),
    accuracy: result.accuracy,
    correct: result.correct,
    mistakes: result.mistakes,
    hints: result.hints,
    xp: result.xp,
    stars: result.stars,
    evidenceFound: result.evidenceFound,
    evidenceTotal: result.evidenceTotal,
    durationMs,
    startedAt: new Date(started).toISOString(),
    finishedAt: new Date(finished).toISOString(),
    details: {
      firstClear: result.firstClear,
      vocab: result.vocab,
      session: session ? {
        evidence: session.evidence,
        revealed: session.revealed,
        learned: session.learned,
        taskStats: session.taskStats,
        vocabCorrect: session.vocabC,
        vocabWrong: session.vocabW,
      } : null,
    },
  }
}
