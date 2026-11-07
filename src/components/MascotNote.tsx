// src/components/MascotNote.tsx
// Notita de la mascota: un globito de diálogo que sale de la mascota,
// se ve unos segundos y se va, y vuelve a aparecer cada tanto.
import { useState, useEffect, type ReactNode } from 'react'

const FIRST_DELAY = 1200   // ms hasta que aparece por primera vez
const VISIBLE = 5000       // ms que se ve
const HIDDEN = 8000        // ms que queda escondida antes de volver

// align="start": el globito se abre hacia la derecha (para mascotas pegadas a un borde)
export default function MascotNote({ note, children, large = false, align = 'center' }: { note?: string | null; children: ReactNode; large?: boolean; align?: 'center' | 'start' }) {
  const text = note?.trim()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!text) return
    // Quien pide menos movimiento la ve fija, sin aparecer y desaparecer
    let reduced = false
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch {}
    if (reduced) { setVisible(true); return }

    let timer: number
    const show = () => { setVisible(true); timer = window.setTimeout(hide, VISIBLE) }
    const hide = () => { setVisible(false); timer = window.setTimeout(show, HIDDEN) }
    timer = window.setTimeout(show, FIRST_DELAY)
    return () => window.clearTimeout(timer)
  }, [text])

  if (!text) return <>{children}</>

  return (
    <div className="relative inline-block">
      {children}
      <div
        role="note"
        aria-label={`La mascota dice: ${text}`}
        className={`absolute bottom-full z-30 pointer-events-none transition-all duration-500 ease-out ${align === 'start' ? 'left-0' : 'left-1/2'} ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{
          transform: `${align === 'start' ? '' : 'translateX(-50%)'} ${visible ? '' : 'translateY(8px) scale(0.9)'}`.trim() || undefined,
          transformOrigin: align === 'start' ? 'bottom left' : 'bottom center',
          marginBottom: large ? 10 : 6,
        }}
      >
        <div
          className="relative bg-[#f4f4f5] text-gray-900 font-semibold leading-snug text-center rounded-2xl border-2 border-black shadow-[3px_3px_0_#000] break-words"
          style={{ fontSize: large ? 22 : 11, padding: large ? '10px 16px' : '5px 9px', width: 'max-content', maxWidth: large ? 320 : 150 }}
        >
          {text}
          {/* Colita del globito apuntando a la mascota */}
          <span className={`absolute -bottom-[7px] w-3 h-3 bg-[#f4f4f5] border-r-2 border-b-2 border-black rotate-45 ${align === 'start' ? 'left-3' : 'left-1/2 -translate-x-1/2'}`} style={large ? { width: 18, height: 18, bottom: -10 } : undefined} />
        </div>
      </div>
    </div>
  )
}
