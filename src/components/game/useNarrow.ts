import { useEffect, useState } from 'react'

export function useNarrow(maxWidth = 640): boolean {
  const q = `(max-width: ${maxWidth}px)`
  const [m, setM] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : false))
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia(q)
    const h = () => setM(mq.matches)
    h()
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [q])
  return m
}
