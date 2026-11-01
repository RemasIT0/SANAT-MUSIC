// src/components/ProfileAudio.tsx
// Audio de presentación del perfil: un solo archivo por usuario (≤ 30 s, ≤ 1 MB)
// guardado en el bucket "audios" como <id-del-usuario>/perfil
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useDialog } from './DialogProvider'
import { FaPlay, FaPause, FaMicrophone, FaTrash, FaSpinner, FaUpload, FaStop } from 'react-icons/fa'

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

// Tipo de audio "limpio" que acepta el bucket (el celular a veces manda vacío o variantes raras)
const MIME_BY_EXTENSION: Record<string, string> = {
  mp3: 'audio/mpeg', m4a: 'audio/mp4', mp4: 'audio/mp4', aac: 'audio/aac',
  ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', webm: 'audio/webm',
}
const MIME_ALIASES: Record<string, string> = {
  'audio/mp3': 'audio/mpeg', 'audio/x-m4a': 'audio/mp4', 'audio/m4a': 'audio/mp4', 'audio/x-aac': 'audio/aac',
  'audio/opus': 'audio/ogg', 'video/webm': 'audio/webm', 'video/mp4': 'audio/mp4',
}
const normalizeAudioType = (file: Blob & { name?: string }) => {
  const base = (file.type || '').split(';')[0].trim().toLowerCase()
  if (base && AUDIO_TYPES.includes(base)) return base
  if (base && MIME_ALIASES[base]) return MIME_ALIASES[base]
  const ext = (file.name || '').split('.').pop()?.toLowerCase() || ''
  return MIME_BY_EXTENSION[ext] || null
}

// Traduce los errores de Supabase a algo entendible
const friendlyUploadError = (error: any) => {
  const msg = String(error?.message || error || '')
  if (/bucket not found/i.test(msg)) return 'Falta configurar el almacenamiento de audios en Supabase (AUDIO_perfil.sql).'
  if (/mime|content type/i.test(msg)) return 'El servidor no acepta ese formato. Probá grabando el audio desde acá.'
  if (/too large|maximum allowed size|exceeded/i.test(msg)) return 'El archivo es muy pesado (máximo 1 MB).'
  if (/row-level security|policy|unauthorized|403/i.test(msg)) return 'No tenés permiso para subir ese archivo. Cerrá sesión, volvé a entrar y probá de nuevo.'
  if (/audio_url/i.test(msg)) return 'Falta la columna audio_url en la base de datos (AUDIO_perfil.sql).'
  return msg || 'Intentá de nuevo.'
}

// Formato de grabación que soporte este navegador (Chrome/Android: webm; iPhone: mp4)
const pickRecorderType = () => {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) || ''
}

export function ProfileAudioUploader() {
  const { user, profile, refreshProfile } = useAuth()
  const { confirm } = useDialog()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)

  // Grabación
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [recorded, setRecorded] = useState<{ blob: Blob; url: string; type: string } | null>(null)
  const canRecord = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && pickRecorderType() !== null

  const audioUrl = profile?.audio_url || null
  const path = `${user?.id}/perfil`

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    recorderRef.current?.stream.getTracks().forEach(t => t.stop())
  }, [])

  const upload = async (blob: Blob, contentType: string) => {
    if (!user) return
    setBusy(true)
    setMessage(null)
    try {
      const { error: uploadError } = await supabase.storage.from('audios').upload(path, blob, { upsert: true, contentType })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('audios').getPublicUrl(path)
      // ?v= evita que el navegador muestre el audio viejo guardado en caché
      const { error: updateError } = await supabase.from('profiles').update({ audio_url: `${data.publicUrl}?v=${Date.now()}` }).eq('id', user.id)
      if (updateError) throw updateError
      await refreshProfile()
      setRecorded(null)
      setMessage({ text: '¡Audio subido! Ya se escucha en tu perfil.', type: 'success' })
    } catch (error: any) {
      console.error('Error al subir audio:', error)
      setMessage({ text: 'No se pudo subir: ' + friendlyUploadError(error), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (fileRef.current) fileRef.current.value = ''
    if (!file || !user) return
    setMessage(null)

    const contentType = normalizeAudioType(file)
    if (!contentType) {
      setMessage({ text: 'Formato no permitido. Usá MP3, M4A, AAC, OGG u OPUS, o grabá el audio desde acá.', type: 'error' }); return
    }
    if (file.size > AUDIO_MAX_BYTES) {
      setMessage({ text: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el máximo es 1 MB. Recortalo o grabalo desde acá (queda mucho más liviano).`, type: 'error' }); return
    }
    try {
      const duration = await getAudioDuration(file)
      if (isFinite(duration) && duration > AUDIO_MAX_SECONDS + 0.5) {
        setMessage({ text: `El audio dura ${Math.round(duration)} s y el máximo es ${AUDIO_MAX_SECONDS} s. Recortalo y volvé a subirlo.`, type: 'error' }); return
      }
    } catch {
      // Algunos formatos no informan la duración: el límite de 1 MB igual protege
    }
    upload(file, contentType)
  }

  const stopRecording = () => {
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    setRecording(false)
  }

  const startRecording = async () => {
    setMessage(null)
    setRecorded(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = pickRecorderType() || undefined
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64000 })
      chunksRef.current = []
      recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        const type = (recorder.mimeType || mimeType || 'audio/webm').split(';')[0]
        const blob = new Blob(chunksRef.current, { type })
        setRecorded({ blob, url: URL.createObjectURL(blob), type: MIME_ALIASES[type] || type })
      }
      recorderRef.current = recorder
      recorder.start()
      setSeconds(0)
      setRecording(true)
      timerRef.current = window.setInterval(() => {
        setSeconds(prev => {
          if (prev + 1 >= AUDIO_MAX_SECONDS) stopRecording()
          return prev + 1
        })
      }, 1000)
    } catch (error: any) {
      const denied = /denied|permission|notallowed/i.test(String(error?.name || error?.message))
      setMessage({ text: denied ? 'Necesitás permitir el micrófono para grabar.' : 'No se pudo acceder al micrófono.', type: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!user || !(await confirm({ title: '¿Eliminar tu audio?', message: 'Se borra de tu perfil. Podés subir otro cuando quieras.', confirmLabel: 'Eliminar', danger: true }))) return
    setBusy(true)
    setMessage(null)
    try {
      await supabase.storage.from('audios').remove([path])
      const { error } = await supabase.from('profiles').update({ audio_url: null }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setMessage({ text: 'Audio eliminado', type: 'success' })
    } catch (error: any) {
      setMessage({ text: 'Error al eliminar: ' + friendlyUploadError(error), type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const btn = 'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 md:p-6 w-full mt-4">
      <h2 className="text-white text-lg mb-1 flex items-center gap-2"><FaMicrophone className="text-purple-400" size={16} /> Tu audio</h2>
      <p className="text-gray-400 text-sm mb-4">Mostrá cómo sonás: un solo audio de hasta {AUDIO_MAX_SECONDS} segundos. Grabalo acá mismo o subí un archivo (MP3, M4A, OGG, hasta 1 MB). Uno nuevo reemplaza al anterior.</p>

      {audioUrl && !recorded && <div className="mb-4"><ProfileAudioPlayer url={audioUrl} name={profile?.display_name || 'vos'} color={profile?.theme_color || '#a855f7'} /></div>}

      {recording && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-red-950/30 border border-red-800/50">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-red-200 font-mono flex-1">Grabando… {seconds}s / {AUDIO_MAX_SECONDS}s</span>
          <button type="button" onClick={stopRecording} className={`${btn} bg-red-600 hover:bg-red-500 text-white`}><FaStop size={11} /> Detener</button>
        </div>
      )}

      {recorded && (
        <div className="mb-4 space-y-2">
          <p className="text-sm text-gray-300">Escuchá tu grabación antes de subirla:</p>
          <ProfileAudioPlayer url={recorded.url} name="tu grabación" color={profile?.theme_color || '#a855f7'} />
          <div className="flex gap-2">
            <button type="button" onClick={() => upload(recorded.blob, recorded.type)} disabled={busy} className={`${btn} bg-purple-700 hover:bg-purple-600 text-white`}>{busy ? <FaSpinner className="animate-spin" /> : <FaUpload size={12} />} Subir esta grabación</button>
            <button type="button" onClick={() => setRecorded(null)} disabled={busy} className={`${btn} bg-[#2a2a2a] hover:bg-[#333] text-gray-100`}>Descartar</button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.opus,.webm" onChange={handleFile} className="hidden" />
      {!recording && !recorded && (
        <div className="flex flex-wrap gap-2">
          {canRecord && (
            <button type="button" onClick={startRecording} disabled={busy} className={`${btn} bg-red-700 hover:bg-red-600 text-white`}><FaMicrophone size={13} /> Grabar audio</button>
          )}
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={`${btn} bg-purple-700 hover:bg-purple-600 text-white`}>
            {busy ? <FaSpinner className="animate-spin" /> : <FaUpload size={13} />} {audioUrl ? 'Reemplazar con archivo' : 'Subir archivo'}
          </button>
          {audioUrl && (
            <button type="button" onClick={handleDelete} disabled={busy} className={`${btn} bg-red-900/20 border border-red-800/50 hover:bg-red-900/40 text-red-400`}>
              <FaTrash size={12} /> Eliminar
            </button>
          )}
        </div>
      )}
      {message && <p className={`text-sm mt-3 ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{message.text}</p>}
    </div>
  )
}
