// src/components/HomeTour.tsx
// Recorrido guiado del Home para usuarios nuevos: la mascota explica cada parte
// con una burbuja de texto. Se muestra una sola vez (después de la bienvenida)
// y se puede repetir desde el asistente.
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Mascot from './Mascot'

interface Step { target: string; title: string; text: string }

const STEPS: Step[] = [
  { target: 'buscar', title: 'Buscá músicos', text: 'Tocá acá para abrir el directorio y buscar gente por nombre o @usuario.' },
  { target: 'publicacion', title: 'Tu publicación', text: 'Contá qué buscás. Si elegís "Busco músicos", SANAT les avisa a los que tocan eso cerca tuyo.' },
  { target: 'filtros', title: 'Filtrá el feed', text: 'Mostrá solo publicaciones de tu zona, de un género o con una intención.' },
  { target: 'nav-mensajes', title: 'Mensajes', text: 'Tus chats, tus amigos y los avisos de la administración.' },
  { target: 'nav-perfil', title: 'Tu perfil', text: 'Editá tus datos, subí tu audio y diseñá tu perfil como quieras.' },
  { target: 'nav-asistente', title: '¿Dudas?', text: 'Preguntale a Sani, el asistente. También te recomienda canciones.' },
  { target: 'radio', title: 'Radio SANAT', text: 'Escuchá radios de rock nacional mientras navegás.' },
]

export const TOUR_RESTART_EVENT = 'sanat-tour-restart'
const doneKey = (userId: string) => `sanat_tour_done_${userId}`

export default function HomeTour() {
  const { user, profile } = useAuth()
  const [step, setStep] = useState<number | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  // Arrancar la primera vez, cuando ya se cerró la bienvenida
  useEffect(() => {
    if (!user) return
    let tries = 0
    const interval = window.setInterval(() => {
      tries++
      try {
        if (localStorage.getItem(doneKey(user.id))) { window.clearInterval(interval); return }
        // La bienvenida pudo haberse visto en este dispositivo o en otro (queda en la base)
        const welcomeSeen = localStorage.getItem(`sanat_welcome_seen_${user.id}`) || (profile as any)?.welcome_seen === true
        if (welcomeSeen) { window.clearInterval(interval); setStep(0) }
      } catch { window.clearInterval(interval) }
      if (tries > 120) window.clearInterval(interval)
    }, 1000)
    const restart = () => setStep(0)
    window.addEventListener(TOUR_RESTART_EVENT, restart)
    return () => { window.clearInterval(interval); window.removeEventListener(TOUR_RESTART_EVENT, restart) }
  }, [user, profile])

  // Pasos cuyo elemento no está en pantalla se saltean
  const findTarget = (index: number) => document.querySelector<HTMLElement>(`[data-tour="${STEPS[index]?.target}"]`)

  const measure = useCallback(() => {
    if (step === null) return
    const el = findTarget(step)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [step])

  useEffect(() => {
    if (step === null) return
    const el = findTarget(step)
    if (!el) { goTo(step + 1); return }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    const timer = window.setTimeout(measure, 380)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => { window.clearTimeout(timer); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [step, measure])

  const finish = () => {
    setStep(null)
    setRect(null)
    try { if (user) localStorage.setItem(doneKey(user.id), '1') } catch {}
  }

  const goTo = (index: number) => {
    if (index >= STEPS.length) { finish(); return }
    if (index < 0) return
    setRect(null)
    setStep(index)
  }

  if (step === null || !rect) return null

  const current = STEPS[step]
  const pad = 8
  const spaceBelow = window.innerHeight - rect.bottom
  const placeBelow = spaceBelow > 230 || spaceBelow > rect.top
  const bubbleWidth = Math.min(320, window.innerWidth - 24)
  const left = Math.min(Math.max(12, rect.left + rect.width / 2 - bubbleWidth / 2), window.innerWidth - bubbleWidth - 12)

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Fondo oscuro con un "agujero" sobre el elemento explicado */}
      <div
        className="absolute rounded-xl ring-2 ring-purple-400 transition-all duration-300 pointer-events-none"
        style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)' }}
      />
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Burbuja con la mascota */}
      <div className="absolute flex items-end gap-2 animate-[fadeIn_0.25s_ease-out]" style={{ left, width: bubbleWidth, ...(placeBelow ? { top: rect.bottom + pad + 14 } : { bottom: window.innerHeight - rect.top + pad + 14 }) }}>
        <div className="flex-shrink-0 mb-1"><Mascot color={profile?.avatar_color || '#a855f7'} size={44} expression="feliz" /></div>
        <div className="relative flex-1 bg-white text-gray-900 rounded-2xl rounded-bl-sm p-3.5 shadow-2xl">
          <p id="tour-title" className="font-bold text-sm mb-1">{current.title}</p>
          <p className="text-sm leading-snug">{current.text}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-gray-500">{step + 1} de {STEPS.length}</span>
            <div className="flex gap-1.5">
              <button onClick={finish} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-100">Saltar</button>
              {step > 0 && <button onClick={() => goTo(step - 1)} className="px-2.5 py-1.5 rounded-lg text-xs bg-gray-100 hover:bg-gray-200 text-gray-800">Atrás</button>}
              <button autoFocus onClick={() => goTo(step + 1)} className="px-3 py-1.5 rounded-lg text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold">{step === STEPS.length - 1 ? '¡Listo!' : 'Siguiente'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
