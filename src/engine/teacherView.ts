import type { TeacherAttempt } from '../services/cloud/supabase'
import { labelOf } from '../data/vocabulary'
import { formatDuration } from '../utils/format'

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : 0)

export interface HardVocab { id: string; ar: string; idn: string; c: number; w: number }
export interface TaskIssue { taskId: string; mistakes: number; hints: number }

/** Defensive reader for the free-form `details` JSON stored with each attempt. */
export function readDetails(details: unknown): { vocab: HardVocab[]; issues: TaskIssue[]; learned: number } {
  const d = isObj(details) ? details : {}
  const vocab: HardVocab[] = []
  if (isObj(d.vocab)) {
    Object.entries(d.vocab).forEach(([id, v]) => {
      const l = labelOf(id)
      if (l && isObj(v)) vocab.push({ id, ar: l.ar, idn: l.idn, c: n(v.c), w: n(v.w) })
    })
  }
  vocab.sort((a, b) => b.w - a.w || a.c - b.c || a.id.localeCompare(b.id))
  const session = isObj(d.session) ? d.session : {}
  const issues: TaskIssue[] = []
  if (isObj(session.taskStats)) {
    Object.entries(session.taskStats).forEach(([taskId, v]) => {
      if (isObj(v) && (n(v.mistakes) > 0 || n(v.hints) > 0)) issues.push({ taskId, mistakes: n(v.mistakes), hints: n(v.hints) })
    })
  }
  issues.sort((a, b) => b.mistakes - a.mistakes || b.hints - a.hints)
  return { vocab, issues, learned: Array.isArray(session.learned) ? session.learned.length : 0 }
}

/** Top-N hardest vocabulary of one attempt, as plain Arabic for tables/CSV. */
export function hardVocabLabel(details: unknown, top = 3): string {
  return readDetails(details).vocab.filter((v) => v.w > 0).slice(0, top).map((v) => v.ar).join(' · ')
}

/** CSV cell with RFC-4180 quoting and spreadsheet-formula neutralisation (student names are user input). */
export function csvCell(v: string | number): string {
  let s = String(v)
  if (/^[=+\-@\t\r]/.test(s) && typeof v === 'string') s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const CSV_HEAD = ['Nama', 'Kelas', 'Kasus', 'Percobaan', 'Nilai', 'Akurasi (%)', 'Benar', 'Salah', 'Hint', 'XP', 'Bintang', 'Bukti', 'Durasi', 'Durasi (detik)', 'Kosakata sulit', 'Mulai', 'Selesai']

export function attemptsToCsv(rows: TeacherAttempt[]): string {
  const body = rows.map((r) => [
    r.students?.name ?? '', r.students?.class_name ?? '', `${r.case_number}. ${r.case_title}`, r.attempt_number, r.score,
    Math.round(r.accuracy * 100), r.correct_count, r.mistake_count, r.hint_count, r.xp, r.stars,
    `${r.evidence_found}/${r.evidence_total}`, formatDuration(r.duration_ms), Math.round(r.duration_ms / 1000),
    hardVocabLabel(r.details), r.started_at, r.finished_at,
  ])
  return [CSV_HEAD, ...body].map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export interface TeacherFilter { query: string; className: string; caseId: string }
export function filterAttempts(rows: TeacherAttempt[], f: TeacherFilter): TeacherAttempt[] {
  const q = f.query.trim().toLocaleLowerCase('id-ID')
  return rows.filter((a) => {
    if (f.className !== 'all' && (a.students?.class_name || '') !== f.className) return false
    if (f.caseId !== 'all' && a.case_id !== f.caseId) return false
    if (!q) return true
    return [a.students?.name, a.students?.class_name, a.case_title, a.case_id].filter(Boolean).some((v) => String(v).toLocaleLowerCase('id-ID').includes(q))
  })
}

/** Student-level progress: distinct cases cleared out of the total. */
export function studentProgress(rows: TeacherAttempt[], clientId: string | undefined, totalCases: number): { done: number; total: number } {
  const cases = new Set(rows.filter((r) => r.students?.client_id === clientId).map((r) => r.case_id))
  return { done: cases.size, total: totalCases }
}
