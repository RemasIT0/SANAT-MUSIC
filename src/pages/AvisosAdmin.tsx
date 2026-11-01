// src/pages/AvisosAdmin.tsx
// Conversación de solo lectura con "Administración" (avisos de moderación).
// No tiene perfil detrás: el administrador no se identifica.
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import AnimatedBackground from '../components/AnimatedBackground'
import { FaArrowLeft, FaShieldAlt, FaSpinner, FaLock } from 'react-icons/fa'

export const ADMIN_THREAD_ID = 'administracion'

interface Notice { id: string; title: string; body: string; is_read: boolean; created_at: string }

export default function AvisosAdmin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase.from('system_notices').select('id, title, body, is_read, created_at').eq('user_id', user.id).order('created_at', { ascending: true })
      setNotices(data || [])
      setLoading(false)
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView())
      // Marcar como leídos al abrir
      await supabase.from('system_notices').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    }
    load()
  }, [user])

  return (
    <div className="h-[calc(100dvh-var(--banner-h,0px))] relative text-gray-200 flex flex-col overflow-hidden bg-[#0f0f0f]">
      <AnimatedBackground />
      <header className="sticky top-0 z-30 bg-[#1a1a1a]/90 backdrop-blur-md border-b border-amber-600/40 px-3 py-2.5 flex items-center gap-3">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/bandeja'))} className="p-2 rounded-full hover:bg-white/10 text-amber-300" aria-label="Volver"><FaArrowLeft /></button>
        <div className="w-10 h-10 rounded-full bg-amber-900/40 border border-amber-600/50 flex items-center justify-center text-amber-300"><FaShieldAlt /></div>
        <div className="min-w-0">
          <h2 className="text-white font-semibold text-sm">Administración</h2>
          <p className="text-xs text-gray-400">Avisos oficiales de SANAT</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-4 px-3 max-w-3xl mx-auto w-full relative z-10 space-y-3">
        {loading ? (
          <div className="h-full flex items-center justify-center"><FaSpinner className="animate-spin text-2xl text-amber-300" /></div>
        ) : notices.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">No tenés avisos de la administración.</p>
        ) : (
          notices.map(notice => (
            <div key={notice.id} className="max-w-[90%] md:max-w-[75%] bg-[#1a1a1a]/90 border border-amber-700/40 rounded-2xl rounded-bl-md px-4 py-3">
              <p className="text-amber-200 text-sm font-semibold mb-1.5">{notice.title}</p>
              <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">{notice.body}</p>
              <p className="text-[10px] text-gray-400 text-right mt-2">{new Date(notice.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="relative z-10 bg-[#1a1a1a]/95 border-t border-[#2a2a2a] px-4 py-3 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
        <FaLock size={10} /> Esta conversación es solo informativa. Para consultas usá el buzón de sugerencias.
      </div>
    </div>
  )
}
