// src/components/ProfileAudio.tsx
// Audio de presentación del perfil: un solo archivo por usuario (≤ 30 s, ≤ 1 MB)
// guardado en el bucket "audios" como <id-del-usuario>/perfil
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { FaPlay, FaPause, FaMicrophone, FaTrash, FaSpinner, FaUpload } from 'react-icons/fa'

export const AUDIO_MAX_SECONDS = 30
export const AUDIO_MAX_BYTES = 1024 * 1024
export const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/webm']

const formatTime = (s: number) => {
  if (!isFinite(s)) return '0:00'
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

// Lee la duración real del archivo antes de subirlo
const getAudioDuration = (file: File) => new Promise<number>((resolve, reject) => {
  const url = URL.createObjectURL(file)
  const audio = new Audio()
  audio.preload = 'metadata'
  audio.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(audio.duration) }
  audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer el audio')) }
  audio.src = url
})

export function ProfileAudioPlayer({ url, name, color = '#a855f7' }: { url: string; name: string; color?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => { setPlaying(false); setCurrent(0) }, [url])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) audio.pause()
    else audio.play().catch(() => setPlaying(false))
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  const progress = duration ? (current / duration) * 100 : 0

  return (
    <div className="flex items-center gap-3 bg-[#1a1a1a] border rounded-2xl p-3 md:p-4" style={{ borderColor: color + '60' }}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrent(0) }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
      <button
        onClick={toggle}
        className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: color, boxShadow: playing ? `0 0 16px ${color}80` : 'none' }}
        aria-label={playing ? 'Pausar audio' : 'Reproducir audio'}
      >
        {playing ? <FaPause size={16} /> : <FaPlay size={16} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-semibold truncate flex items-center gap-2">
          <FaMicrophone size={12} style={{ color }} /> Escuchá a {name}
        </p>
        <div className="mt-2 h-2 bg-[#0f0f0f] rounded-full cursor-pointer overflow-hidden" onClick={seek} role="slider" aria-label="Progreso del audio" aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(current)}>
          <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${progress}%`, backgroundColor: color }} />
        </div>
        <p className="text-[11px] text-gray-400 mt-1 font-mono">{formatTime(current)} / {formatTime(duration)}</p>
      </div>
    </div>
  )
}

export function ProfileAudioUploader() {
  const { user, profile, refreshProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)

  const audioUrl = profile?.audio_url || null
  const path = `${user?.id}/perfil`

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (fileRef.current) fileRef.current.value = ''
    if (!file || !user) return
    setMessage(null)

    if (!AUDIO_TYPES.includes(file.type)) {
      setMessage({ text: 'Formato no permitido. Usá MP3, M4A, OGG o WEBM.', type: 'error' }); return
    }
    if (file.size > AUDIO_MAX_BYTES) {
      setMessage({ text: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 1 MB.`, type: 'error' }); return
    }

    setBusy(true)
    try {
      const seconds = await getAudioDuration(file)
      if (seconds > AUDIO_MAX_SECONDS + 0.5) {
        setMessage({ text: `El audio dura ${Math.round(seconds)} s. El máximo es ${AUDIO_MAX_SECONDS} s: recortalo y volvé a subirlo.`, type: 'error' }); return
      }

      const { error: uploadError } = await supabase.storage.from('audios').upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('audios').getPublicUrl(path)
      // ?v= evita que el navegador muestre el audio viejo guardado en caché
      const { error: updateError } = await supabase.from('profiles').update({ audio_url: `${data.publicUrl}?v=${Date.now()}` }).eq('id', user.id)
      if (updateError) throw updateError

      await refreshProfile()
      setMessage({ text: '¡Audio subido!', type: 'success' })
    } catch (error: any) {
      setMessage({ text: 'Error al subir: ' + (error.message || 'intentá de nuevo'), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !confirm('¿Eliminar tu audio?')) return
    setBusy(true)
    setMessage(null)
    try {
      await supabase.storage.from('audios').remove([path])
      const { error } = await supabase.from('profiles').update({ audio_url: null }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setMessage({ text: 'Audio eliminado', type: 'success' })
    } catch (error: any) {
      setMessage({ text: 'Error al eliminar: ' + error.message, type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 md:p-6 w-full mt-4">
      <h2 className="text-white text-lg mb-1 flex items-center gap-2"><FaMicrophone className="text-purple-400" size={16} /> Tu audio</h2>
      <p className="text-gray-400 text-sm mb-4">Mostrá cómo sonás: un solo audio de hasta {AUDIO_MAX_SECONDS} segundos y 1 MB (MP3, M4A, OGG o WEBM). Subir uno nuevo reemplaza al anterior.</p>

      {audioUrl && <div className="mb-4"><ProfileAudioPlayer url={audioUrl} name={profile?.display_name || 'vos'} color={profile?.theme_color || '#a855f7'} /></div>}

      <input ref={fileRef} type="file" accept={AUDIO_TYPES.join(',')} onChange={handleFile} className="hidden" />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
          {busy ? <FaSpinner className="animate-spin" /> : <FaUpload size={13} />} {audioUrl ? 'Reemplazar audio' : 'Subir audio'}
        </button>
        {audioUrl && (
          <button type="button" onClick={handleDelete} disabled={busy} className="flex items-center gap-2 px-4 py-2.5 bg-red-900/20 border border-red-800/50 hover:bg-red-900/40 disabled:opacity-50 text-red-400 text-sm font-semibold rounded-lg transition-colors">
            <FaTrash size={12} /> Eliminar
          </button>
        )}
      </div>
      {message && <p className={`text-sm mt-3 ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{message.text}</p>}
    </div>
  )
}
