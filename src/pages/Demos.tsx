// src/pages/Demos.tsx
// Reproductor continuo con los audios de perfil de la comunidad.
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useHiddenUsers } from '../hooks/useHiddenUsers'
import Avatar from '../components/Avatar'
import AnimatedBackground from '../components/AnimatedBackground'
import { RowSkeleton } from '../components/Skeleton'
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRandom, FaHeadphones, FaGuitar, FaMapMarkerAlt, FaComment, FaUser } from 'react-icons/fa'

export const PAUSE_RADIO_EVENT = 'sanat-pause-radio'
const GENRES = ['Rock', 'Pop', 'Folklore', 'Cumbia', 'Jazz', 'Electrónica', 'Indie', 'Metal', 'Grunge']
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const formatTime = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}` : '0:00')

export default function Demos() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const hiddenIds = useHiddenUsers()
  const audioRef = useRef<HTMLAudioElement>(null)
  const theme = profile?.theme_color || '#a855f7'

  const [all, setAll] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [zoneOnly, setZoneOnly] = useState(false)
  const [genre, setGenre] = useState('')
  const [order, setOrder] = useState<string[]>([])  // ids en el orden de reproducción
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState({ current: 0, duration: 0 })

  useEffect(() => {
    supabase.from('profiles')
      .select('id, display_name, avatar_url, avatar_color, instruments, genres, localidad, departamento, audio_url, is_banned')
      .not('audio_url', 'is', null).limit(200)
      .then(({ data }) => {
        setAll((data || []).filter(p => p.audio_url && !p.is_banned))
        setLoading(false)
      })
  }, [])

  const list = all.filter(p =>
    !hiddenIds.includes(p.id) &&
    (!zoneOnly || p.departamento === profile?.departamento) &&
    (!genre || (p.genres || []).some((g: string) => norm(g) === norm(genre)))
  )

  // Orden de reproducción: el de la lista, o mezclado
  useEffect(() => { setOrder(list.map(p => p.id)) }, [all.length, zoneOnly, genre, hiddenIds.length])

  const current = all.find(p => p.id === currentId) || null
  const index = currentId ? order.indexOf(currentId) : -1

  const playId = (id: string) => {
    window.dispatchEvent(new Event(PAUSE_RADIO_EVENT))
    if (id === currentId) { audioRef.current?.play(); return }
    setCurrentId(id)
    setPlaying(true)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return
    audio.src = current.audio_url
    audio.play().catch(() => setPlaying(false))
  }, [currentId])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (!current) { if (order.length) playId(order[0]); return }
    if (playing) audio.pause()
    else { window.dispatchEvent(new Event(PAUSE_RADIO_EVENT)); audio.play().catch(() => {}) }
  }

  const step = (delta: number) => {
    if (!order.length) return
    const next = index === -1 ? 0 : (index + delta + order.length) % order.length
    playId(order[next])
  }

  const shuffle = () => {
    const shuffled = [...order].sort(() => Math.random() - 0.5)
    setOrder(shuffled)
    if (shuffled.length) playId(shuffled[0])
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !progress.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * progress.duration
  }

  const chip = (active: boolean) => `flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${active ? 'text-white border-transparent' : 'bg-[#141414] border-[#2a2a2a] text-gray-300 hover:text-white'}`

  return (
    <div className="min-h-screen relative text-gray-200 pb-24">
      <AnimatedBackground />
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => step(1)}
        onTimeUpdate={e => setProgress({ current: e.currentTarget.currentTime, duration: e.currentTarget.duration })}
        onLoadedMetadata={e => setProgress({ current: 0, duration: e.currentTarget.duration })}
      />
      <main className="max-w-3xl mx-auto px-4 pt-10 pb-4 space-y-4">
        <div>
          <h1 className="nota text-3xl"><FaHeadphones style={{ color: theme }} /> Demos</h1>
          <p className="text-sm text-gray-400 mt-1">Escuchá cómo suenan los músicos de SANAT. Se reproducen uno detrás del otro.</p>
        </div>

        {/* Reproductor */}
        <div className="sticky top-[var(--banner-h,0px)] z-20 rounded-2xl p-4 border shadow-2xl backdrop-blur-md" style={{ backgroundColor: '#141414ee', borderColor: theme + '60' }}>
          <div className="flex items-center gap-3">
            {current
              ? <button onClick={() => navigate(`/perfil/${current.id}`)}><Avatar url={current.avatar_url || null} name={current.display_name} color={current.avatar_color || '#333'} size={56} /></button>
              : <div className="w-14 h-14 rounded-full bg-[#222] flex items-center justify-center text-gray-500"><FaHeadphones size={22} /></div>}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{current ? current.display_name : 'Elegí una demo o tocá play'}</p>
              <p className="text-xs text-gray-400 truncate">{current ? `${current.instruments?.[0]?.name || 'Músico'} · ${current.localidad || ''}` : `${list.length} demos disponibles`}</p>
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-[#2a2a2a] rounded-full cursor-pointer overflow-hidden" onClick={seek} role="slider" aria-label="Progreso" aria-valuemin={0} aria-valuemax={Math.round(progress.duration || 0)} aria-valuenow={Math.round(progress.current)}>
            <div className="h-full rounded-full" style={{ width: `${progress.duration ? (progress.current / progress.duration) * 100 : 0}%`, backgroundColor: theme }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono"><span>{formatTime(progress.current)}</span><span>{formatTime(progress.duration)}</span></div>
          <div className="flex items-center justify-center gap-5 mt-1">
            <button onClick={shuffle} disabled={!order.length} className="p-2 text-gray-400 hover:text-white disabled:opacity-30" aria-label="Aleatorio" title="Aleatorio"><FaRandom /></button>
            <button onClick={() => step(-1)} disabled={!order.length} className="p-2 text-gray-200 hover:text-white disabled:opacity-30" aria-label="Anterior"><FaStepBackward /></button>
            <button onClick={togglePlay} disabled={!order.length} className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-30" style={{ backgroundColor: theme }} aria-label={playing ? 'Pausar' : 'Reproducir'}>
              {playing ? <FaPause size={20} /> : <FaPlay size={20} className="ml-1" />}
            </button>
            <button onClick={() => step(1)} disabled={!order.length} className="p-2 text-gray-200 hover:text-white disabled:opacity-30" aria-label="Siguiente"><FaStepForward /></button>
            {current
              ? <button onClick={() => navigate(`/chat/${current.id}`)} className="p-2 text-gray-400 hover:text-white" aria-label="Escribirle" title="Escribirle"><FaComment /></button>
              : <span className="w-8" />}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setZoneOnly(!zoneOnly)} className={chip(zoneOnly)} style={zoneOnly ? { backgroundColor: theme } : undefined}><FaMapMarkerAlt className="inline mr-1" size={10} /> Mi zona</button>
          <button onClick={() => setGenre('')} className={chip(!genre)} style={!genre ? { backgroundColor: theme } : undefined}>Todos</button>
          {GENRES.map(g => <button key={g} onClick={() => setGenre(genre === g ? '' : g)} className={chip(genre === g)} style={genre === g ? { backgroundColor: theme } : undefined}>{g}</button>)}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3].map(i => <RowSkeleton key={i} />)}</div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 bg-[#141414] border border-[#2a2a2a] rounded-2xl px-6">
            <FaHeadphones className="text-4xl mx-auto mb-3 text-gray-500" />
            <p className="text-gray-100 font-semibold">No hay demos con estos filtros</p>
            <p className="text-sm text-gray-400 mt-1">¿Y si subís la tuya? Se graba en 30 segundos desde "Editar datos".</p>
            <button onClick={() => navigate('/editar-perfil')} className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: theme }}>Subir mi demo</button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {order.map(id => list.find(p => p.id === id)).filter(Boolean).map((p: any) => {
              const isCurrent = p.id === currentId
              return (
                <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-colors ${isCurrent ? 'bg-[#1c1c1c]' : 'bg-[#141414] border-[#2a2a2a] hover:bg-[#181818]'}`} style={isCurrent ? { borderColor: theme } : undefined}>
                  <button onClick={() => (isCurrent ? togglePlay() : playId(p.id))} className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: isCurrent ? theme : '#2a2a2a' }} aria-label={isCurrent && playing ? `Pausar a ${p.display_name}` : `Escuchar a ${p.display_name}`}>
                    {isCurrent && playing ? <FaPause size={12} /> : <FaPlay size={12} className="ml-0.5" />}
                  </button>
                  <Avatar url={p.avatar_url || null} name={p.display_name} color={p.avatar_color || '#333'} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isCurrent ? 'text-white font-semibold' : 'text-gray-100'}`}>{p.display_name}</p>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1"><FaGuitar size={9} /> {p.instruments?.[0]?.name || 'Músico'}{p.localidad ? ` · ${p.localidad}` : ''}</p>
                  </div>
                  <button onClick={() => navigate(`/perfil/${p.id}`)} className="p-2 text-gray-400 hover:text-white" aria-label={`Ver perfil de ${p.display_name}`}><FaUser size={12} /></button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
