import { Star } from 'lucide-react'

export function Stars({ value, max = 3, size = 18 }: { value: number; max?: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} dari ${max} bintang`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={size} className={i < value ? 'fill-gold-500 text-gold-500' : 'text-ink-500'} aria-hidden />
      ))}
    </span>
  )
}
