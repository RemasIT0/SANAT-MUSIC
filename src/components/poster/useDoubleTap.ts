// src/components/poster/useDoubleTap.ts
// Distingue un toque de dos toques seguidos sobre el mismo elemento.
import { useEffect, useRef } from 'react'

const WINDOW_MS = 260

export function useDoubleTap(onDouble: () => void, onSingle?: () => void) {
  const timer = useRef<number | null>(null)
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])
  return () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
      onDouble()
      return
    }
    timer.current = window.setTimeout(() => {
      timer.current = null
      onSingle?.()
    }, WINDOW_MS)
  }
}
