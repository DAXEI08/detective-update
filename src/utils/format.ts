export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '—'
  const s = Math.round(ms / 1000)
  const m = Math.floor(s / 60)
  const r = s % 60
  return m > 0 ? `${m}m ${r}s` : `${r}s`
}
export function pct(x: number): string {
  return `${Math.round(x * 100)}%`
}
export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}
export function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n))
}
