// src/components/AdminBroadcast.tsx
// Aviso masivo: llega a la bandeja de TODOS los usuarios como mensaje de
// "Administración" (y como notificación si las activaron).
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDialog } from './DialogProvider'
import { logAdminAction } from '../lib/adminLog'
import { FaBullhorn, FaSpinner, FaPaperPlane } from 'react-icons/fa'

export default function AdminBroadcast({ onResult }: { onResult: (message: string, type: 'success' | 'error') => void }) {
  const { confirm } = useDialog()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!title.trim() || !body.trim()) return
    if (!(await confirm({ title: '¿Enviar aviso a todos?', message: `"${title.trim()}" le va a llegar a la bandeja de todos los usuarios. No se puede deshacer.`, confirmLabel: 'Enviar a todos' }))) return
    setSending(true)
    const { data, error } = await supabase.rpc('admin_broadcast_notice', { p_title: title.trim(), p_body: body.trim() })
    setSending(false)
    if (error) {
      onResult(error.code === 'PGRST202' ? 'Falta activar los avisos masivos: corré el SQL de la Etapa 1 en Supabase.' : 'Error: ' + error.message, 'error')
      return
    }
    onResult(`Aviso enviado a ${data} usuarios`, 'success')
    logAdminAction('Aviso masivo', `${title.trim()} (${data} usuarios)`)
    setTitle('')
    setBody('')
  }

  const input = 'w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-gray-500'

  return (
    <div className="bg-[#1a1a1a]/80 border border-[#2a2a2a] rounded-2xl p-4 md:p-5 space-y-3">
      <div className="flex items-center gap-3">
        <FaBullhorn className="text-amber-400" size={18} />
        <div>
          <p className="text-white font-semibold text-sm">Aviso a todos los usuarios</p>
          <p className="text-gray-400 text-xs">Llega a la bandeja de cada uno como mensaje de "Administración".</p>
        </div>
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="Título (ej: Jam este sábado en Plaza Independencia)" className={input} aria-label="Título del aviso" />
      <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} maxLength={2000} placeholder="Texto del aviso..." className={`${input} resize-none`} aria-label="Texto del aviso" />
      <button onClick={send} disabled={sending || !title.trim() || !body.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-black disabled:opacity-40">
        {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane size={12} />} Enviar a todos
      </button>
    </div>
  )
}
