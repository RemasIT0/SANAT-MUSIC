// src/pages/Bienvenida.tsx
// Página de bienvenida para quien entra sin cuenta: la pared de la sala,
// con cada función de SANAT pegada como un afiche y las mascotas como stickers.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowDown, FaPlay } from 'react-icons/fa'
import Mascot from '../components/Mascot'
import { MASCOT_EXPRESSIONS, ADMIN_ONLY_EXPRESSIONS, type MascotExpression } from '../components/MascotCostumes'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import '@fontsource/anton/latin-400.css'
import './Bienvenida.css'

const REGISTRO = '/login?modo=registro'
const TIME_ZONE = 'America/Argentina/Tucuman'
const COLORS = ['#a855f7', '#22c55e', '#f97316', '#3b82f6', '#ec4899', '#eab308', '#14b8a6', '#ef4444']
const PUBLIC_COSTUMES = MASCOT_EXPRESSIONS.filter(e => !ADMIN_ONLY_EXPRESSIONS.includes(e.id))
const EVENT_LABELS: Record<string, string> = { show: 'Show', jam: 'Jam', ensayo: 'Ensayo abierto', otro: 'Evento' }
const FLYER_TONES = ['paper', 'violet', 'ink'] as const
const FLYER_TILTS = [-2.2, 1.6, -1, 2.4, -1.8, 1.2]

interface UpcomingEvent {
  id: string
  title: string
  event_type: string
  starts_at: string
  place: string
  departamento: string
  band_name: string | null
}

// ---------- Piezas de la pared ----------

function Tape({ style }: { style: CSSProperties }) {
  return <span className="tape" aria-hidden style={style} />
}

function Afiche({ tone, tilt = 0, className = '', children, tapes = 'top' }: {
  tone: 'paper' | 'violet' | 'ink'; tilt?: number; className?: string; children: ReactNode; tapes?: 'top' | 'corners'
}) {
  return (
    <div className={`afiche afiche--${tone} ${className}`} style={{ '--tilt': `${tilt}deg` } as CSSProperties} data-afiche>
      {tapes === 'top'
        ? <Tape style={{ top: -12, left: 'calc(50% - 48px)', '--tape-rot': 'rotate(-3deg)' } as CSSProperties} />
        : <>
            <Tape style={{ top: -8, left: -26, '--tape-rot': 'rotate(-38deg)' } as CSSProperties} />
            <Tape style={{ top: -8, right: -70, '--tape-rot': 'rotate(36deg)' } as CSSProperties} />
          </>}
      {children}
    </div>
  )
}

// Sticker de mascota: al tocarlo cambia de disfraz
function Sticker({ start, color, size = 64, tilt = 0, className = '', style }: {
  start: MascotExpression; color: string; size?: number; tilt?: number; className?: string; style?: CSSProperties
}) {
  const [index, setIndex] = useState(() => Math.max(0, PUBLIC_COSTUMES.findIndex(c => c.id === start)))
  const costume = PUBLIC_COSTUMES[index]
  return (
    <button
      type="button"
      className={`sticker ${className}`}
      style={{ '--tilt': `${tilt}deg`, ...style } as CSSProperties}
      onClick={() => setIndex(i => (i + 7) % PUBLIC_COSTUMES.length)}
      aria-label={`Sticker de mascota ${costume.label}. Tocá para cambiar el disfraz`}
      title="Tocá para cambiar el disfraz"
    >
      <span key={costume.id} className="swap block pointer-events-none">
        <Mascot color={color} size={size} expression={costume.id} />
      </span>
    </button>
  )
}

// ---------- Formato de fechas (24 h, hora de Tucumán) ----------

function eventDate(iso: string) {
  const d = new Date(iso)
  const part = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-AR', { timeZone: TIME_ZONE, ...opts }).format(d)
  return {
    day: part({ day: 'numeric' }),
    month: part({ month: 'short' }).replace('.', ''),
    weekday: part({ weekday: 'long' }),
    time: part({ hour: '2-digit', minute: '2-digit', hour12: false }),
  }
}

// ---------- Página ----------

export default function Bienvenida() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLElement>(null)
  const [events, setEvents] = useState<UpcomingEvent[] | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [lightOn, setLightOn] = useState(false)

  // Quien ya tiene sesión va directo al Inicio
  useEffect(() => {
    if (!loading && user) navigate('/home', { replace: true })
  }, [loading, user, navigate])

  useEffect(() => {
    document.title = 'SANAT · La escena musical de Tucumán'
    return () => { document.title = 'SANAT - Comunidad de Músicos' }
  }, [])

  // Próximos shows reales (función pública: solo datos del evento)
  useEffect(() => {
    let alive = true
    supabase.rpc('public_upcoming_events', { p_limit: 6 }).then(({ data, error }) => {
      if (alive) setEvents(error ? [] : (data as UpcomingEvent[]) || [])
    })
    return () => { alive = false }
  }, [])

  // Encabezado con fondo al bajar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cada afiche se "pega" cuando aparece en pantalla (los de arriba, en cascada al abrir)
  useEffect(() => {
    const root = rootRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timers: number[] = []
    const observer = new IntersectionObserver(entries => {
      entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left))
        .forEach((entry, i) => {
          const el = entry.target as HTMLElement
          observer.unobserve(el)
          timers.push(window.setTimeout(() => { el.dataset.paste = 'done' }, 80 + i * 130))
        })
    }, { threshold: 0.15 })
    const watch = () => {
      root.querySelectorAll<HTMLElement>('[data-afiche]:not([data-paste="done"])').forEach(el => {
        el.dataset.paste = 'pending'
        observer.observe(el)
      })
    }
    watch()
    // Los afiches de la agenda llegan después (cuando responde la base)
    const mo = new MutationObserver(watch)
    mo.observe(root, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      mo.disconnect()
      timers.forEach(t => window.clearTimeout(t))
      // Si la página se desarma a mitad de camino, que nada quede invisible
      root.querySelectorAll<HTMLElement>('[data-paste="pending"]').forEach(el => { delete el.dataset.paste })
    }
  }, [])

  // El reflector de Darkore se enciende cuando llega su afiche
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setLightOn(true); observer.disconnect() }
    }, { threshold: 0.35 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="wall">
      {/* Encabezado */}
      <header style={{ top: 'var(--banner-h, 0px)' }} className={`fixed inset-x-0 z-40 transition-colors duration-300 ${scrolled ? 'bg-[#0f0f0f]/90 backdrop-blur-sm border-b border-[#262626]' : ''}`}>
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between" aria-label="Principal">
          <span className="font-nirvana text-2xl text-white">SANAT</span>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#agenda" className="hidden sm:inline text-sm text-violet-200 hover:text-white px-2 py-2">Próximos shows</a>
            <Link to="/login" className="text-sm text-violet-200 hover:text-white px-2 py-2">Iniciar sesión</Link>
            <Link to={REGISTRO} className="text-sm font-semibold bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors">Crear cuenta</Link>
          </div>
        </nav>
      </header>

      <main className="!pb-0">
        {/* ---------- Primera vista: la pared ---------- */}
        <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 lg:grid lg:grid-cols-[1fr_minmax(0,600px)_1fr] lg:gap-10 lg:items-start">
          {/* Afiche izquierdo: se busca */}
          <div className="hidden lg:flex flex-col items-end gap-14 pt-16">
            <Afiche tone="paper" tilt={3} className="w-60 pt-6">
              <div className="px-5 pb-4">
                <p className="font-marker text-xl text-[color:var(--paper-soft)]">Se busca</p>
                <p className="font-nirvana text-4xl leading-none mt-1">BAJISTA</p>
                <p className="text-sm mt-3 text-[color:var(--paper-soft)] leading-snug">Las bandas publican a quién buscan. Vos publicás lo que tocás. Se encuentran.</p>
              </div>
              <div className="tiras" aria-hidden>
                {['sanat', 'sanat', 'sanat', 'sanat', 'sanat', 'sanat'].map((t, i) => <span key={i} className={i === 2 ? 'arrancada' : ''}>{t}</span>)}
              </div>
            </Afiche>
            <Sticker start="punk" color="#22c55e" size={70} tilt={-10} className="mr-8" />
          </div>

          {/* Afiche principal */}
          <div className="relative">
            <Afiche tone="violet" tilt={-1.2} className="px-6 sm:px-10 pt-12 pb-10 text-center" tapes="corners">
              <h1 className="font-nirvana text-[clamp(3.6rem,15vw,6rem)] leading-[0.9] text-white">SANAT</h1>
              <p className="mt-4 text-lg sm:text-xl text-[color:var(--violet-soft)] leading-snug max-w-md mx-auto">
                La pared donde se arma la escena musical de Tucumán. Encontrá banda, mostrá tu música y enterate de cada show.
              </p>
              <div className="desfile flex justify-center items-end gap-6 sm:gap-6 mt-12 mb-12" aria-label="Mascotas de SANAT">
                <span className="sm:hidden"><Mascot color="#22c55e" size={66} expression="gaucha" /></span><span className="hidden sm:inline-block"><Mascot color="#22c55e" size={74} expression="gaucha" /></span>
                <span className="sm:hidden"><Mascot color="#f97316" size={66} expression="blackmetal" /></span><span className="hidden sm:inline-block"><Mascot color="#f97316" size={74} expression="blackmetal" /></span>
                <span className="sm:hidden"><Mascot color="#3b82f6" size={66} expression="princesa" /></span><span className="hidden sm:inline-block"><Mascot color="#3b82f6" size={74} expression="princesa" /></span>
                <span className="hidden sm:inline-block"><Mascot color="#eab308" size={74} expression="dj" /></span>
                <span className="hidden md:inline-block"><Mascot color="#ec4899" size={74} expression="mago" /></span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link to={REGISTRO} className="btn-pegar btn-pegar--dark w-full sm:w-auto">Crear cuenta gratis</Link>
                <Link to="/login" className="px-4 py-3 text-white underline underline-offset-4 decoration-violet-300 hover:decoration-white font-medium">Ya tengo cuenta</Link>
              </div>
              <p className="mt-5 text-sm text-[color:var(--violet-soft)]">Para músicos y para quien sigue la escena.</p>
            </Afiche>
            <span className="hidden lg:block absolute -bottom-12 -right-12 z-10"><Sticker start="otaku" color="#ec4899" size={60} tilt={12} /></span>
            <span className="lg:hidden absolute -left-3 -top-12 z-10">
              <a href="#darkore" className="sticker !pt-8" style={{ '--tilt': '-10deg' } as CSSProperties} aria-label="Conocé a Darkore, el rey de la pared">
                <span className="pointer-events-none"><Mascot color="#3f3f46" size={46} expression="darkking" /></span>
              </a>
            </span>
            {/* Celular: Darkore asoma debajo del afiche principal */}
            <a href="#darkore" className="lg:hidden block mt-28 mx-auto max-w-[300px]" aria-label="Conocé a Darkore, el rey de la pared">
              <Afiche tone="ink" tilt={2.5} className="flex items-center gap-10 pl-12 pr-5 py-5">
                <span className="llama-mini" aria-hidden />
                <span className="relative shrink-0 pt-4"><Mascot color="#3f3f46" size={64} expression="darkking" /></span>
                <span>
                  <span className="block font-anton text-xl leading-none text-white">EL REY DE LA PARED</span>
                  <span className="block font-marker text-violet-300 mt-1">Darkore ↓</span>
                </span>
              </Afiche>
            </a>
          </div>

          {/* Afiche derecho: jam */}
          <div className="hidden lg:flex flex-col items-start gap-12 pt-14">
            <a href="#darkore" className="block group" aria-label="Conocé a Darkore, el rey de la pared">
              <Afiche tone="ink" tilt={4} className="w-60 px-5 pt-12 pb-5 text-center">
                <span className="llama-mini" aria-hidden />
                <span className="relative inline-block"><Mascot color="#3f3f46" size={84} expression="darkking" /></span>
                <p className="font-anton text-2xl leading-none text-white mt-1">EL REY DE LA PARED</p>
                <p className="font-marker text-violet-300 mt-1 group-hover:text-white transition-colors">Darkore ↓</p>
              </Afiche>
            </a>
            <Afiche tone="ink" tilt={-3} className="w-64 px-6 pt-8 pb-6">
              <p className="font-nirvana text-6xl leading-none text-white">JAM</p>
              <p className="font-marker text-lg text-violet-300 mt-1">shows · ensayos · fechas</p>
              <p className="text-sm text-zinc-300 mt-3 leading-snug">Todo lo que suena en la provincia, en una sola agenda.</p>
              <a href="#agenda" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-violet-200 hover:text-white">
                Ver la agenda <FaArrowDown aria-hidden />
              </a>
            </Afiche>
          </div>
        </section>

        {/* Cintas cruzadas */}
        <div className="relative py-10" aria-hidden>
          <div className="cinta-larga bg-purple-700 text-white -rotate-2 scale-105">
            <div>{CINTA.map((t, i) => <span key={i}>{t}</span>)}</div>
            <div>{CINTA.map((t, i) => <span key={i}>{t}</span>)}</div>
          </div>
          <div className="cinta-larga cinta-larga--rev bg-[#f4efe6] text-[#1c1917] rotate-[1.5deg] scale-105 -mt-6">
            <div>{CINTA2.map((t, i) => <span key={i}>{t}</span>)}</div>
            <div>{CINTA2.map((t, i) => <span key={i}>{t}</span>)}</div>
          </div>
        </div>

        {/* ---------- Tu mascota ---------- */}
        <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-6">
          <MascotaLab />
          <span className="hidden md:block absolute -right-6 -bottom-10 z-10"><Sticker start="unicornio" color="#a855f7" size={64} tilt={9} /></span>
        </section>

        {/* ---------- Diseñá tu perfil ---------- */}
        <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
          <Afiche tone="violet" tilt={1} className="p-6 sm:p-10 flex flex-col md:grid md:grid-cols-[1fr_1.1fr] md:gap-10 md:items-center">
            <div className="relative order-2 mt-10 md:mt-0">
              <figure className="relative bg-white p-2 pb-8 shadow-[0_18px_30px_-12px_rgba(0,0,0,0.8)] -rotate-3">
                <Tape style={{ top: -12, left: 'calc(50% - 48px)', '--tape-rot': 'rotate(4deg)' } as CSSProperties} />
                <img src="/tour-diseno.jpg" alt="Editor de diseño de perfil de SANAT con fondos, textos e imágenes" width={560} height={358} loading="lazy" className="w-full h-auto block" />
                <figcaption className="font-marker text-sm text-zinc-700 text-center mt-2">el editor de diseño</figcaption>
              </figure>
            </div>
            <div className="order-1">
              <h2 className="font-anton text-4xl sm:text-6xl text-white leading-[1.05]">Tu perfil, diseñado como un afiche</h2>
              <p className="mt-5 text-lg text-[color:var(--violet-soft)] leading-relaxed max-w-prose">
                Ponés fondos, fuentes, fotos, textos y animaciones donde quieras. Nada de plantillas obligatorias: tu perfil se ve como vos lo armes.
              </p>
              <p className="font-marker text-xl text-white mt-6 leading-relaxed">fondos · fuentes · fotos · animaciones · notitas</p>
            </div>
          </Afiche>
        </section>

        {/* ---------- Bandas, chat y demos ---------- */}
        <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-16 grid gap-10 md:gap-0 md:grid-cols-[1fr_1.15fr] md:items-start">
          <span className="hidden md:block absolute -left-4 -top-6 z-20"><Sticker start="gaucho" color="#f97316" size={60} tilt={-12} /></span>
          <Afiche tone="ink" tilt={-1.6} className="p-7 sm:p-9 md:mt-16 md:mr-[-28px] z-10">
            <h2 className="font-anton text-4xl sm:text-5xl text-white leading-none">Armá tu banda</h2>
            <p className="mt-4 text-zinc-300 leading-relaxed">Creá la página de tu banda, sumá integrantes y publicá a quién estás buscando. Los músicos de la zona te encuentran.</p>
            <div className="mt-8 pt-6 border-t border-[#2a2a2a] flex justify-center items-end gap-6" aria-label="Una banda de mascotas">
              <Mascot color="#ef4444" size={70} expression="rockero" />
              <Mascot color="#3b82f6" size={70} expression="melenudo" />
              <Mascot color="#eab308" size={70} expression="grungera" />
            </div>
          </Afiche>

          <Afiche tone="paper" tilt={1.4} className="p-7 sm:p-9 md:mt-[-24px]">
            <h2 className="font-anton text-4xl leading-none">Hablá y hacete escuchar</h2>
            <p className="mt-4 text-[color:var(--paper-soft)] leading-relaxed">Chat directo entre músicos para coordinar ensayos y fechas, y demos para que tu música circule.</p>
            <div className="mt-7 space-y-3" aria-label="Ejemplo de chat">
              <div className="flex items-end gap-2">
                <span className="shrink-0 w-9 h-9 overflow-hidden"><Mascot color="#22c55e" size={30} expression="punk" /></span>
                <p className="bg-white border border-stone-300 rounded-2xl rounded-bl-sm px-4 py-2 text-sm">¿Tienen lugar para un baterista?</p>
              </div>
              <div className="flex items-end gap-2 justify-end">
                <p className="bg-purple-700 text-white rounded-2xl rounded-br-sm px-4 py-2 text-sm">¡Sí! Vení el jueves a ensayar.</p>
                <span className="shrink-0 w-9 h-9 overflow-hidden"><Mascot color="#ec4899" size={30} expression="emo" /></span>
              </div>
            </div>
            <div className="mt-7 flex items-center gap-4 bg-white border border-stone-300 rounded-xl px-4 py-3">
              <span className="w-10 h-10 rounded-full bg-purple-700 text-white flex items-center justify-center shrink-0" aria-hidden><FaPlay size={14} className="ml-0.5" /></span>
              <div className="onda flex-1" aria-hidden>
                {ONDA.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${-i * 0.09}s` }} />)}
              </div>
            </div>
            <p className="text-xs text-[color:var(--paper-soft)] mt-3"></p>
          </Afiche>
        </section>

        {/* ---------- Agenda real ---------- */}
        <section id="agenda" className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 scroll-mt-20">
          <span className="hidden md:block absolute right-10 top-2 z-10"><Sticker start="dj" color="#eab308" size={60} tilt={10} /></span>
          <h2 className="font-anton text-4xl sm:text-6xl text-white leading-none">Próximos shows</h2>
          <p className="mt-3 text-zinc-300">Lo que se viene en la agenda de SANAT.</p>
          <Agenda events={events} />
        </section>

        {/* ---------- Darkore ---------- */}
        <section id="darkore" ref={stageRef} className="escenario relative py-20 md:pt-6 scroll-mt-16" data-luz={lightOn ? 'on' : 'off'}>
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
            <Afiche tone="ink" tilt={-0.8} className="px-6 py-10 sm:px-12 sm:py-16 md:grid md:grid-cols-[auto_1fr] md:gap-14 md:items-center" tapes="corners">
              <div className="relative flex justify-center pt-10 pb-6 md:py-0 md:w-[340px]">
                <span className="llama" aria-hidden />
                <span className="relative md:hidden"><Mascot color="#3f3f46" size={150} expression="darkking" /></span>
                <span className="relative hidden md:inline-block"><Mascot color="#3f3f46" size={180} expression="darkking" /></span>
              </div>
              <div>
                <h2 className="relative text-6xl sm:text-8xl text-white leading-none">DARKORE</h2>
                <p className="mt-2 text-violet-300 font-semibold">Creador de SANAT · el Dark King</p>
                <figure className="burbuja-dk mt-8">
                  <blockquote className="font-marker text-xl sm:text-2xl text-zinc-100 leading-relaxed">
                    “Armé SANAT para que ningún músico de Tucumán se quede sin banda ni sin escenario. La pared es de todos: pegá tu afiche y hacé ruido.”
                  </blockquote>
                  <figcaption className="firma font-marker text-3xl sm:text-4xl text-violet-400 mt-4 text-right">— Darkore</figcaption>
                </figure>
                <p className="relative mt-5 text-sm text-zinc-400">Dark King</p>
              </div>
            </Afiche>
          </div>
        </section>

        {/* ---------- Cierre: tu lugar en la pared ---------- */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-24 text-center">
          <div className="hueco relative px-6 py-14 sm:py-16">
            <Tape style={{ top: -12, left: -20, '--tape-rot': 'rotate(-30deg)' } as CSSProperties} />
            <Tape style={{ top: -12, right: -64, '--tape-rot': 'rotate(30deg)' } as CSSProperties} />
            <h2 className="font-anton text-4xl sm:text-6xl text-white leading-[1.05]">Tu lugar en la pared está libre</h2>
            <p className="mt-4 text-zinc-300 max-w-md mx-auto">Elegí tu mascota, armá tu perfil y sumate a la escena. Es gratis.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-8">
              <Link to={REGISTRO} className="btn-pegar btn-pegar--violet w-full sm:w-auto">Crear cuenta gratis</Link>
              <Link to="/login" className="px-4 py-3 text-violet-200 underline underline-offset-4 hover:text-white font-medium">Ya tengo cuenta</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#262626] bg-[#0b0b0b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-3 items-center justify-between text-sm text-zinc-400">
          <span><span className="font-nirvana text-white mr-2">SANAT</span>Hecho en Tucumán</span>
          <Link to="/legal" className="hover:text-white underline underline-offset-4">Términos y privacidad</Link>
        </div>
      </footer>
    </div>
  )
}

const CINTA = ['SANAT', 'BANDAS', 'SHOWS', 'JAMS', 'DEMOS', 'MASCOTAS', 'TUCUMÁN', 'SANAT', 'BANDAS', 'SHOWS', 'JAMS', 'DEMOS', 'MASCOTAS', 'TUCUMÁN']
const CINTA2 = ['SE BUSCA BATERISTA', 'ENSAYO ABIERTO', 'TOCAMOS EL SÁBADO', 'SUMATE A LA BANDA', 'SE BUSCA VOZ', 'JAM DE LOS JUEVES']
const ONDA = [30, 55, 80, 45, 95, 60, 35, 70, 100, 50, 40, 85, 65, 30, 75, 90, 45, 60, 35, 80, 55, 40, 70, 50]

// Taller de mascotas: probá disfraces y colores
function MascotaLab() {
  const [index, setIndex] = useState(() => PUBLIC_COSTUMES.findIndex(c => c.id === 'gaucho'))
  const [color, setColor] = useState(COLORS[0])
  const costume = PUBLIC_COSTUMES[Math.max(0, index)]
  const next = () => setIndex(i => (i + 1 + Math.floor(Math.random() * (PUBLIC_COSTUMES.length - 1))) % PUBLIC_COSTUMES.length)

  return (
    <Afiche tone="paper" tilt={-1} className="p-6 sm:p-10 md:grid md:grid-cols-[1fr_1.1fr] md:gap-10 md:items-center">
      <div className="flex flex-col items-center">
        <div className="h-[220px] flex items-center justify-center" aria-live="polite">
          <span key={costume.id + color} className="sticker-swap inline-block" style={{ animation: 'swap 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
            <Mascot color={color} size={140} expression={costume.id} />
          </span>
          <span className="sr-only">Disfraz: {costume.label}</span>
        </div>
        <p className="font-marker text-2xl mt-2" aria-hidden>{costume.label}</p>
        <div className="flex flex-wrap justify-center gap-2 mt-4" role="group" aria-label="Color de la mascota">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={`w-8 h-8 rounded-full border-[3px] transition-transform hover:scale-110 ${color === c ? 'border-[#1c1917] scale-110' : 'border-white'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button type="button" onClick={next} className="btn-pegar btn-pegar--dark mt-5">Probar otro disfraz</button>
      </div>
      <div className="mt-8 md:mt-0">
        <h2 className="font-anton text-4xl sm:text-6xl leading-[1.05]">Tu cara en SANAT es una mascota</h2>
        <p className="mt-5 text-lg text-[color:var(--paper-soft)] leading-relaxed max-w-prose">
          Elegí entre {PUBLIC_COSTUMES.length} disfraces (punk, gaucha, black metal, mago, princesa guerrera y muchos más) y el color que quieras. Te acompaña en tu perfil, en el chat y en las reseñas.
        </p>
        <p className="mt-4 text-[color:var(--paper-soft)]">Probala acá: tocá los colores y cambiale el disfraz.</p>
      </div>
    </Afiche>
  )
}

// Afiches de los próximos eventos
function Agenda({ events }: { events: UpcomingEvent[] | null }) {
  const flyers = useMemo(() => (events || []).map((ev, i) => ({ ev, tone: FLYER_TONES[i % 3], tilt: FLYER_TILTS[i % FLYER_TILTS.length], date: eventDate(ev.starts_at) })), [events])

  if (events === null) {
    return (
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 mt-12" aria-busy="true" aria-label="Cargando la agenda">
        {[0, 1, 2].map(i => <div key={i} className="h-56 bg-[#1a1a1a] border border-[#262626] animate-pulse" style={{ transform: `rotate(${FLYER_TILTS[i]}deg)` }} />)}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="mt-12 max-w-md">
        <Afiche tone="paper" tilt={-1.5} className="p-7">
          <p className="font-anton text-3xl leading-none">LA AGENDA TE ESPERA</p>
          <p className="mt-3 text-[color:var(--paper-soft)]">Todavía no hay shows publicados. ¿Tocás pronto? Publicá tu fecha gratis y que la escena se entere.</p>
          <Link to={REGISTRO} className="btn-pegar btn-pegar--violet mt-6">Publicar mi show</Link>
        </Afiche>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 mt-12">
        {flyers.map(({ ev, tone, tilt, date }) => (
          <Afiche key={ev.id} tone={tone} tilt={tilt} className="p-6 flex gap-5">
            <div className={`shrink-0 text-center w-16 ${tone === 'paper' ? 'text-[#581c87]' : tone === 'violet' ? 'text-white' : 'text-violet-300'}`}>
              <p className="font-nirvana text-5xl leading-none">{date.day}</p>
              <p className="font-nirvana text-lg uppercase">{date.month}</p>
            </div>
            <div className="min-w-0">
              <h3 className="font-anton text-2xl leading-tight break-words">{ev.title}</h3>
              {ev.band_name && <p className={`font-marker mt-1 ${tone === 'paper' ? 'text-[#7e22ce]' : 'text-violet-200'}`}>{ev.band_name}</p>}
              <p className={`text-sm mt-2 ${tone === 'paper' ? 'text-[color:var(--paper-soft)]' : tone === 'violet' ? 'text-[color:var(--violet-soft)]' : 'text-zinc-300'}`}>
                {EVENT_LABELS[ev.event_type] || 'Evento'} · {date.weekday} {date.time} h
              </p>
              <p className={`text-sm ${tone === 'paper' ? 'text-[color:var(--paper-soft)]' : tone === 'violet' ? 'text-[color:var(--violet-soft)]' : 'text-zinc-300'}`}>
                {ev.place}{ev.departamento ? `, ${ev.departamento}` : ''}
              </p>
            </div>
          </Afiche>
        ))}
      </div>
      <p className="mt-12">
        <Link to={REGISTRO} className="btn-pegar btn-pegar--violet">Ver toda la agenda y avisar que voy</Link>
      </p>
    </>
  )
}
