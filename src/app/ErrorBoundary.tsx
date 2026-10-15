import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

/** Last line of defence: a render crash shows a recovery screen instead of a blank page. Progress stays in localStorage. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('UI error', error, info.componentStack) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4 text-center">
        <div className="panel p-6">
          <h1 className="text-xl font-bold">Terjadi kesalahan tampilan</h1>
          <p className="mt-2 text-sm text-cream-300">Progres kamu aman tersimpan di perangkat. Muat ulang halaman untuk melanjutkan.</p>
          <div className="mt-4 flex flex-col gap-2">
            <button className="tap rounded-lg bg-gold-500 px-4 font-semibold text-ink-900" onClick={() => window.location.reload()}>Muat ulang</button>
            <a className="tap grid place-items-center rounded-lg border border-ink-500 px-4 text-sm" href="/">Ke beranda</a>
          </div>
        </div>
      </main>
    )
  }
}
