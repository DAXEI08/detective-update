import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AttemptPayload } from '../services/cloud/supabase'

const QUEUE_KEY = 'arabic-detective:v1:cloud-queue'
const AUTH_KEY = 'arabic-detective:v1:teacher-auth'

async function loadCloud(enabled = true) {
  vi.resetModules()
  vi.stubEnv('VITE_SUPABASE_URL', enabled ? 'https://x.supabase.co' : '')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', enabled ? 'anon' : '')
  return import('../services/cloud/supabase')
}
const payload = (n: number | string, over: Partial<AttemptPayload> = {}): AttemptPayload => ({
  clientAttemptId: `p1:case-1:${n}`, studentClientId: 'p1', studentName: 'Ani', className: 'X', caseId: 'case-1', caseNumber: 1, caseTitle: 'T',
  attemptNumber: 1, score: 90, accuracy: 0.9, correct: 9, mistakes: 1, hints: 0, xp: 500, stars: 3, evidenceFound: 7, evidenceTotal: 7,
  durationMs: 60000, startedAt: '2026-01-01T00:00:00.000Z', finishedAt: '2026-01-01T00:01:00.000Z', details: {}, ...over,
})
const ok = (body: unknown = {}, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }))
const queueIds = () => (JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as { payload: AttemptPayload }[]).map((e) => e.payload.clientAttemptId)

beforeEach(() => { localStorage.clear() })
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers() })

describe('attempt queue', () => {
  it('failed sync is queued, local data untouched, never throws', async () => {
    const c = await loadCloud()
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))))
    const state = await c.submitAttempt(payload(1))
    expect(state).toBe('retrying') // tried, failed, will be retried
    expect(queueIds()).toEqual(['p1:case-1:1'])
  })

  it('never silently drops scores (no 50-item cap)', async () => {
    const c = await loadCloud()
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))))
    for (let i = 0; i < 60; i++) await c.submitAttempt(payload(i))
    expect(queueIds()).toHaveLength(60)
    expect(queueIds()).toContain('p1:case-1:0')
  })

  it('prevents duplicates: same clientAttemptId is queued once and sent once', async () => {
    const c = await loadCloud()
    const f = vi.fn((): Promise<Response> => Promise.reject(new TypeError('offline')))
    vi.stubGlobal('fetch', f)
    await c.submitAttempt(payload(1)); await c.submitAttempt(payload(1))
    expect(queueIds()).toHaveLength(1)

    const c2 = await loadCloud()
    const g = vi.fn(() => ok({}))
    vi.stubGlobal('fetch', g)
    localStorage.clear()
    expect(await c2.submitAttempt(payload(2))).toBe('synced')
    expect(await c2.submitAttempt(payload(2))).toBe('synced')
    expect(g).toHaveBeenCalledTimes(1)
  })

  it('migrates the legacy queue format and removes only confirmed items', async () => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify([payload(1), payload(2)]))
    const c = await loadCloud()
    let call = 0
    vi.stubGlobal('fetch', vi.fn(() => (++call === 1 ? ok({}) : Promise.reject(new TypeError('offline')))))
    const r = await c.flushAttemptQueue()
    expect(r.sent).toBe(1)
    expect(queueIds()).toEqual(['p1:case-1:2'])
  })

  it('concurrent submits do not overwrite each other', async () => {
    const c = await loadCloud()
    vi.stubGlobal('fetch', vi.fn(() => new Promise((res) => setTimeout(() => res(new Response('{}', { status: 200 })), 10))))
    const [a, b] = await Promise.all([c.submitAttempt(payload('a')), c.submitAttempt(payload('b'))])
    await c.flushAttemptQueue()
    expect(queueIds()).toEqual([])
    expect(c.getAttemptSyncState('p1:case-1:a')).toBe('synced')
    expect(c.getAttemptSyncState('p1:case-1:b')).toBe('synced')
    expect([a, b].every((x) => ['synced', 'pending'].includes(x))).toBe(true)
  })

  it('server rejection is marked failed, not retried automatically, retried manually', async () => {
    const c = await loadCloud()
    const f = vi.fn(() => ok({ message: 'Nilai tidak valid' }, 400))
    vi.stubGlobal('fetch', f)
    expect(await c.submitAttempt(payload(1))).toBe('failed')
    await c.flushAttemptQueue()
    expect(f).toHaveBeenCalledTimes(1)
    await c.flushAttemptQueue({ manual: true })
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('while offline the score waits (pending) without hitting the network', async () => {
    const c = await loadCloud()
    const f = vi.fn(() => ok({}))
    vi.stubGlobal('fetch', f)
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(await c.submitAttempt(payload(1))).toBe('pending')
    expect(f).not.toHaveBeenCalled()
    spy.mockReturnValue(true)
    await c.flushAttemptQueue()
    expect(queueIds()).toEqual([])
    spy.mockRestore()
  })

  it('5xx is retryable', async () => {
    const c = await loadCloud()
    vi.stubGlobal('fetch', vi.fn(() => ok({ message: 'boom' }, 503)))
    expect(await c.submitAttempt(payload(1))).toBe('retrying')
  })

  it('does nothing when cloud is not configured', async () => {
    const c = await loadCloud(false)
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    expect(await c.submitAttempt(payload(1))).toBe('disabled')
    expect(f).not.toHaveBeenCalled()
  })
})

describe('auto flush', () => {
  it('flushes queued scores at startup', async () => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify([{ payload: payload(1), attempts: 2, queuedAt: 1 }]))
    const c = await loadCloud()
    vi.stubGlobal('fetch', vi.fn(() => ok({})))
    const stop = c.startAutoSync()
    await vi.waitFor(() => expect(queueIds()).toEqual([]))
    stop()
  })

  it('flushes when the connection returns, and cleans its listener on unmount', async () => {
    const c = await loadCloud()
    const f = vi.fn((): Promise<Response> => Promise.reject(new TypeError('offline')))
    vi.stubGlobal('fetch', f)
    const stop = c.startAutoSync()
    await c.submitAttempt(payload(1))
    expect(queueIds()).toHaveLength(1)

    f.mockImplementation(() => ok({}))
    window.dispatchEvent(new Event('online'))
    await vi.waitFor(() => expect(queueIds()).toEqual([]))

    stop()
    await c.submitAttempt(payload(2)) // succeeds directly (fetch ok) – then force a failing one
    f.mockImplementation(() => Promise.reject(new TypeError('offline')))
    await c.submitAttempt(payload(3))
    f.mockClear(); f.mockImplementation(() => ok({}))
    window.dispatchEvent(new Event('online'))
    await new Promise((r) => setTimeout(r, 30))
    expect(f).not.toHaveBeenCalled() // listener was removed
    expect(queueIds()).toEqual(['p1:case-1:3'])
  })
})

describe('teacher auth', () => {
  const now = () => Math.floor(Date.now() / 1000)
  const save = (over: object = {}) => localStorage.setItem(AUTH_KEY, JSON.stringify({ access_token: 'old', refresh_token: 'r1', expires_at: now() + 3600, ...over }))
  const route = (h: { refresh?: () => Promise<Response>; rows?: (auth: string) => Promise<Response> }) =>
    vi.fn((url: string, init?: RequestInit) => {
      if (url.includes('grant_type=refresh_token')) return h.refresh ? h.refresh() : ok({}, 400)
      return h.rows ? h.rows((init?.headers as Record<string, string>).Authorization) : ok([])
    })

  it('refreshes an expired access token, stores the new session, then loads data', async () => {
    save({ expires_at: now() - 10 })
    const c = await loadCloud()
    const f = route({ refresh: () => ok({ access_token: 'new', refresh_token: 'r2', expires_in: 3600 }), rows: (a) => ok(a === 'Bearer new' ? [{ id: '1' }] : [], a === 'Bearer new' ? 200 : 401) })
    vi.stubGlobal('fetch', f)
    expect(await c.fetchTeacherAttempts()).toHaveLength(1)
    expect(c.teacherSession()?.access_token).toBe('new')
    expect(c.teacherSession()?.refresh_token).toBe('r2')
  })

  it('on 401 refreshes once and retries once', async () => {
    save()
    const c = await loadCloud()
    const f = route({ refresh: () => ok({ access_token: 'new', refresh_token: 'r2', expires_in: 3600 }), rows: (a) => (a === 'Bearer old' ? ok({}, 401) : ok([{ id: 'x' }])) })
    vi.stubGlobal('fetch', f)
    expect(await c.fetchTeacherAttempts()).toHaveLength(1)
    expect(f.mock.calls.filter(([u]) => String(u).includes('refresh_token'))).toHaveLength(1)
  })

  it('logs out only when refresh is rejected, without infinite retry', async () => {
    save({ expires_at: now() - 10 })
    const c = await loadCloud()
    const f = route({ refresh: () => ok({ error: 'invalid_grant' }, 400) })
    vi.stubGlobal('fetch', f)
    await expect(c.fetchTeacherAttempts()).rejects.toBeInstanceOf(c.TeacherAuthError)
    expect(c.teacherSession()).toBeNull()
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('a still-401 after refresh ends the session (no loop)', async () => {
    save()
    const c = await loadCloud()
    const f = route({ refresh: () => ok({ access_token: 'new', expires_in: 3600 }), rows: () => ok({}, 401) })
    vi.stubGlobal('fetch', f)
    await expect(c.fetchTeacherAttempts()).rejects.toBeInstanceOf(c.TeacherAuthError)
    expect(f).toHaveBeenCalledTimes(3) // data, refresh, data
  })

  it('a network failure during refresh keeps the session', async () => {
    save({ expires_at: now() - 10 })
    const c = await loadCloud()
    vi.stubGlobal('fetch', route({ refresh: () => Promise.reject(new TypeError('offline')) }))
    await expect(c.fetchTeacherAttempts()).rejects.not.toBeInstanceOf(c.TeacherAuthError)
    expect(c.teacherSession()).not.toBeNull()
  })

  it('concurrent requests share one refresh', async () => {
    save({ expires_at: now() - 10 })
    const c = await loadCloud()
    const f = route({ refresh: () => ok({ access_token: 'new', refresh_token: 'r2', expires_in: 3600 }) })
    vi.stubGlobal('fetch', f)
    await Promise.all([c.fetchTeacherAttempts(), c.fetchTeacherAttempts()])
    expect(f.mock.calls.filter(([u]) => String(u).includes('refresh_token'))).toHaveLength(1)
  })

  it('wrong password gives a readable error; corrupt stored session is ignored', async () => {
    const c = await loadCloud()
    vi.stubGlobal('fetch', vi.fn(() => ok({ error_description: 'Invalid login credentials' }, 400)))
    await expect(c.signInTeacher('a@b.c', 'x')).rejects.toThrow('Invalid login credentials')
    localStorage.setItem(AUTH_KEY, '{not json')
    expect(c.teacherSession()).toBeNull()
    await expect(c.fetchTeacherAttempts()).rejects.toBeInstanceOf(c.TeacherAuthError)
  })
})
