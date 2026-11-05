// src/components/HomeTour.tsx
// Bienvenida + recorrido guiado del Home: la mascota saluda, cuenta las reglas
// y explica cada parte con una burbuja. Aparece una sola vez, solo para cuentas
// nuevas (queda marcado en profiles.welcome_seen), y se puede repetir desde el asistente.
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Mascot from './Mascot'
import { FaBullhorn, FaLock, FaHandRock, FaHandHoldingHeart, FaUserEdit, FaMicrophoneAlt, FaPalette } from 'react-icons/fa'
import { useAppSettings } from '../hooks/useAppSettings'
import DonationModal from './DonationModal'

// Sin "target": la burbuja aparece centrada (saludo inicial)
interface Step {
  target?: string
  title: string
  text: string
  rules?: boolean
  image?: string      // captura de ejemplo dentro de la burbuja
  profileTips?: boolean
  donate?: boolean    // paso final: panel de colaboración
}

const STEPS: Step[] = [
  { title: '¡Bienvenido a SANAT!', text: 'Soy tu personaje y te voy a mostrar cómo funciona todo. Antes, tres reglas de la casa:', rules: true },
  { target: 'buscar', title: 'Buscá músicos', text: 'Tocá acá para abrir el directorio y buscar gente por nombre o @usuario.' },
  { target: 'publicacion', title: 'Tu publicación', text: 'Contá qué buscás. Si elegís "Busco músicos", SANAT les avisa a los que tocan eso cerca tuyo.' },
  { target: 'filtros', title: 'Filtrá el feed', text: 'Mostrá solo publicaciones de tu zona, de un género o con una intención.' },
  { target: 'nav-mensajes', title: 'Mensajes', text: 'Tus chats, tus amigos y los avisos de la administración.' },
  { target: 'nav-perfil', title: 'Tu perfil', text: 'Acá está tu perfil: lo que ven los demás cuando te buscan. Desde ahí lo editás y lo diseñás.' },
  { title: 'Editar datos', text: 'En tu perfil, el botón "Editar datos" es para lo básico:', profileTips: true },
  { title: 'Diseñá tu perfil', text: 'Con "Diseñar perfil" armás tu página como quieras: fondos, letras, stickers, luces y animaciones. Hay plantillas listas y se guarda sola mientras editás. Por ejemplo, así puede quedar:', image: '/tour-diseno.jpg' },
  { target: 'nav-asistente', title: '¿Dudas?', text: 'Preguntale a Sani, el asistente. También te recomienda canciones.' },
  { target: 'radio', title: 'Radio SANAT', text: 'Escuchá radios de rock nacional mientras navegás.' },
  { title: 'Apoyá SANAT', text: 'SANAT es gratis y sin publicidad. Si te sirve y querés que siga creciendo, podés colaborar con lo que quieras para mantener los servidores. Siempre lo encontrás en Opciones.', donate: true },
]

const PROFILE_TIPS = [
  { icon: FaUserEdit, text: 'Foto, nombre, bio, instrumentos, géneros y zona' },
  { icon: FaPalette, text: 'Color y estilo de tu mascota' },
  { icon: FaMicrophoneAlt, text: 'Un audio de 30 segundos para que escuchen cómo sonás' },
]

const RULES = [
  { icon: FaBullhorn, title: 'Una publicación a la vez', text: 'Podés editarla cuando quieras.' },
  { icon: FaLock, title: 'Cuidá tus datos', text: 'Nada de teléfono ni dirección exacta: coordiná por el chat.' },
  { icon: FaHandRock, title: 'Respeto ante todo', text: 'El maltrato no tiene lugar acá.' },
]

export const TOUR_RESTART_EVENT = 'sanat-tour-restart'
const seenKey = (userId: string) => `sanat_welcome_seen_${userId}`

export default function HomeTour() {
  const { user, profile } = useAuth()
  const { settings } = useAppSettings()
  const [showDonation, setShowDonation] = useState(false)
  const [step, setStep] = useState<number | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  // Solo cuentas nuevas: si ya lo vio (en cualquier dispositivo) no vuelve a aparecer
  useEffect(() => {
    if (!user || !profile) return
    let seenHere = false
    try { seenHere = !!localStorage.getItem(seenKey(user.id)) } catch {}
    if (seenHere || (profile as any).welcome_seen === true) return
    const timer = window.setTimeout(() => setStep(s => s ?? 0), 700)
    return () => window.clearTimeout(timer)
  }, [user, profile?.id])

  useEffect(() => {
    const restart = () => { setRect(null); setStep(0) }
    window.addEventListener(TOUR_RESTART_EVENT, restart)
    return () => window.removeEventListener(TOUR_RESTART_EVENT, restart)
  }, [])

  // Pasos cuyo elemento no está en pantalla se saltean
  const findTarget = (index: number) => {
    const target = STEPS[index]?.target
    return target ? document.querySelector<HTMLElement>(`[data-tour="${target}"]`) : null
  }

  const measure = useCallback(() => {
    if (step === null) return
    const el = findTarget(step)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [step])

  useEffect(() => {
    if (step === null || !STEPS[step]?.target) return
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
    if (!user) return
    try { localStorage.setItem(seenKey(user.id), 'true') } catch {}
    // Queda en la cuenta para que no vuelva a salir en otro dispositivo
    if ((profile as any)?.welcome_seen !== true) {
      supabase.from('profiles').update({ welcome_seen: true }).eq('id', user.id).then(({ error }) => {
        if (error) console.warn('No se pudo guardar welcome_seen:', error.message)
      })
    }
  }

  const goTo = (index: number) => {
    if (index >= STEPS.length) { finish(); return }
    if (index < 0) return
    setRect(null)
    setStep(index)
  }

  if (step === null) return showDonation && settings ? <DonationModal settings={settings} onClose={() => setShowDonation(false)} /> : null
  const current = STEPS[step]
  const canDonate = !!settings?.donation_enabled
  const centered = !current.target
  if (!centered && !rect) return null

  const pad = 8
  const bubbleWidth = Math.min(centered ? 360 : 320, window.innerWidth - 24)
  let position: React.CSSProperties
  if (centered || !rect) {
    position = { left: (window.innerWidth - bubbleWidth) / 2, top: '50%', transform: 'translateY(-50%)' }
  } else {
    const spaceBelow = window.innerHeight - rect.bottom
    const placeBelow = spaceBelow > 230 || spaceBelow > rect.top
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - bubbleWidth / 2), window.innerWidth - bubbleWidth - 12)
    position = { left, ...(placeBelow ? { top: rect.bottom + pad + 14 } : { bottom: window.innerHeight - rect.top + pad + 14 }) }
  }

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {centered || !rect ? (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      ) : (
        // Fondo oscuro con un "agujero" sobre el elemento explicado
        <div
          className="absolute rounded-xl ring-2 ring-purple-400 transition-all duration-300 pointer-events-none"
          style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)' }}
        />
      )}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Burbuja con la mascota */}
      <div className={`absolute flex gap-2 animate-[fadeIn_0.25s_ease-out] ${centered ? 'flex-col items-center' : 'items-end'}`} style={{ width: bubbleWidth, ...position }}>
        <div className={`flex-shrink-0 ${centered ? 'mascot-wiggle' : 'mb-1'}`}>
          <Mascot color={profile?.avatar_color || '#a855f7'} size={centered ? (current.image ? 56 : 84) : 44} expression="feliz" />
        </div>
        <div className={`relative flex-1 w-full bg-[#1c1030] border border-purple-500/50 text-white rounded-2xl p-3.5 shadow-2xl shadow-purple-950/60 max-h-[72vh] overflow-y-auto ${centered ? '' : 'rounded-bl-sm'}`}>
          <p id="tour-title" className={`font-bold mb-1 ${centered ? 'text-lg text-center' : 'text-sm'}`}>{current.title}</p>
          <p className={`text-sm leading-snug text-purple-100/90 ${centered ? 'text-center' : ''}`}>{current.text}</p>
          {current.profileTips && (
            <ul className="mt-3 space-y-2">
              {PROFILE_TIPS.map(tip => (
                <li key={tip.text} className="flex items-center gap-2.5 bg-black/30 border border-purple-500/20 rounded-xl p-2.5">
                  <span className="w-8 h-8 rounded-lg bg-purple-700/40 flex items-center justify-center flex-shrink-0"><tip.icon className="text-purple-200" size={13} /></span>
                  <span className="text-sm">{tip.text}</span>
                </li>
              ))}
            </ul>
          )}
          {current.image && (
            <img src={current.image} alt="Ejemplo de un perfil diseñado en SANAT" className="mt-3 w-full rounded-xl border border-purple-500/30" loading="lazy" />
          )}
          {current.donate && canDonate && (
            <button onClick={() => { finish(); setShowDonation(true) }} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-sm font-semibold">
              <FaHandHoldingHeart size={14} /> Quiero colaborar
            </button>
          )}
          {current.rules && (
            <ul className="mt-3 space-y-2">
              {RULES.map(rule => (
                <li key={rule.title} className="flex items-start gap-2.5 bg-black/30 border border-purple-500/20 rounded-xl p-2.5">
                  <span className="w-8 h-8 rounded-lg bg-purple-700/40 flex items-center justify-center flex-shrink-0"><rule.icon className="text-purple-200" size={13} /></span>
                  <span>
                    <span className="block text-sm font-semibold">{rule.title}</span>
                    <span className="block text-xs text-purple-200/80">{rule.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-purple-300/80">{step + 1} de {STEPS.length}</span>
            <div className="flex gap-1.5">
              <button onClick={finish} className="px-2.5 py-1.5 rounded-lg text-xs text-purple-200 hover:bg-white/10">Saltar</button>
              {step > 0 && <button onClick={() => goTo(step - 1)} className="px-2.5 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/15 text-white">Atrás</button>}
              <button autoFocus onClick={() => goTo(step + 1)} className="px-3 py-1.5 rounded-lg text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold">
                {step === 0 ? '¡Vamos!' : step === STEPS.length - 1 ? '¡Listo!' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
