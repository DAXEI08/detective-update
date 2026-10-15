import { Fragment } from 'react'
import { ARABIC_RUN } from '../../utils/arabic'

/** Renders Indonesian text with **bold** markup and auto-wraps Arabic runs in RTL spans with the Arabic font. */
function arabify(text: string, keyPrefix: string, strong: boolean) {
  const parts = text.split(ARABIC_RUN)
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <span key={`${keyPrefix}${i}`} lang="ar" dir="rtl" className={`ar text-[1.2em] leading-normal ${strong ? 'font-semibold text-gold-400' : ''}`}>{p}</span>
    ) : (
      <Fragment key={`${keyPrefix}${i}`}>{strong ? <strong className="font-semibold text-gold-300">{p}</strong> : p}</Fragment>
    ),
  )
}
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const chunks = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span className={`whitespace-pre-line ${className}`}>
      {chunks.map((c, i) =>
        c.startsWith('**') && c.endsWith('**') ? (
          <Fragment key={i}>{arabify(c.slice(2, -2), `b${i}-`, true)}</Fragment>
        ) : (
          <Fragment key={i}>{arabify(c, `t${i}-`, false)}</Fragment>
        ),
      )}
    </span>
  )
}

export function Ar({ children, className = '', size = 'md' }: { children: React.ReactNode; className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const s = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl'
  return <span lang="ar" dir="rtl" className={`ar ${s} ${className}`}>{children}</span>
}
