// src/components/ModerationModal.tsx
// Ventana del admin para borrar una publicación y/o advertir a un usuario.
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { logAdminAction } from '../lib/adminLog'
import { applyModeration, countWarnings, MODERATION_REASONS, MAX_WARNINGS, type ModerationResult } from '../lib/moderation'
import { FaExclamationTriangle, FaSpinner, FaTrash, FaGavel } from 'react-icons/fa'

export interface ModerationTarget {
  userId: string
  userName: string
  postId?: string
  postContent?: string
}

export default function ModerationModal({ target, onClose, onDone }: {
  target: ModerationTarget
  onClose: () => void
  onDone: (message: string, type: 'success' | 'error', result?: ModerationResult) => void
}) {
  const isPost = !!target.postId
  const [reason, setReason] = useState(MODERATION_REASONS[0])
  const [details, setDetails] = useState('')
  const [warn, setWarn] = useState(true)
  const [notify, setNotify] = useState(true)
  const [busy, setBusy] = useState(false)
  const [current, setCurrent] = useState<number | null>(null)

  useEffect(() => {
    countWarnings(target.userId).then(setCurrent).catch(() => setCurrent(null))
  }, [target.userId])

  const willBan = warn && current !== null && current + 1 >= MAX_WARNINGS

  const execute = async () => {
    setBusy(true)
    try {
      if (isPost) {
        const { data, error } = await supabase.from('posts').delete().eq('id', target.postId!).select('id')
        if (error) throw error
        if (!data?.length) throw new Error('No se borró la publicación (¿sesión de admin verificada?)')
        logAdminAction('Publicación borrada', `${target.userName}: "${(target.postContent || '').slice(0, 80)}" — ${reason}`)
      }
      const result = await applyModeration({ userId: target.userId, userName: target.userName, reason, details, warn, notify, postContent: target.postContent })
      const parts = [isPost ? 'Publicación eliminada' : 'Usuario advertido']
      if (result.warnings !== null) parts.push(`advertencia ${result.warnings}/${MAX_WARNINGS}`)
      if (result.banned) parts.push('cuenta suspendida automáticamente')
      else if (notify) parts.push('se le avisó')
      onDone(parts.join(' · '), 'success', result)
    } catch (error: any) {
      console.error('Error de moderación:', error)
      const msg = String(error?.message || error)
      onDone(/user_warnings|system_notices/.test(msg) ? 'Faltan las tablas de advertencias: corré CHAT_y_ADVERTENCIAS.sql en Supabase.' : 'Error: ' + msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !busy && onClose()} />
      <div className="relative w-full max-w-md bg-[#1a1a1a] border border-red-900/50 rounded-2xl p-6 shadow-2xl animate-[scaleIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto">
        <h3 className="text-white text-lg font-semibold flex items-center gap-2 mb-1">
          {isPost ? <FaTrash className="text-red-400" /> : <FaGavel className="text-amber-400" />}
          {isPost ? 'Eliminar publicación' : 'Advertir usuario'}
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          De <b className="text-white">{target.userName}</b>
          {current !== null && <> · tiene <b className={current >= 2 ? 'text-red-300' : 'text-white'}>{current}/{MAX_WARNINGS}</b> advertencias</>}
        </p>

        {isPost && target.postContent && (
          <p className="text-xs text-gray-300 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3 mb-4 line-clamp-4">"{target.postContent}"</p>
        )}

        <label className="block text-xs text-gray-400 mb-1">Motivo</label>
        <select value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2.5 mb-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-red-500">
          {MODERATION_REASONS.map(r => <option key={r}>{r}</option>)}
        </select>

        <label className="block text-xs text-gray-400 mb-1">Detalle (opcional, lo ve el usuario)</label>
        <textarea value={details} onChange={e => setDetails(e.target.value)} rows={2} maxLength={300} placeholder="Ej: publicaste el mismo anuncio en varias cuentas" className="w-full p-2.5 mb-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white resize-none focus:outline-none focus:border-red-500 placeholder:text-gray-500" />

        <label className="flex items-center gap-2 text-sm text-gray-200 mb-2">
          <input type="checkbox" checked={warn} onChange={e => setWarn(e.target.checked)} className="w-4 h-4 accent-red-500" /> Sumar una advertencia
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-200 mb-4">
          <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} className="w-4 h-4 accent-red-500" /> Avisarle por mensaje de "Administración"
        </label>

        {willBan && (
          <div className="flex gap-2 p-3 mb-4 rounded-lg bg-red-950/40 border border-red-700/60 text-red-200 text-xs">
            <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
            <p>Con esta llega a {MAX_WARNINGS} advertencias: <b>la cuenta se va a suspender automáticamente</b>.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-gray-100 text-sm font-medium disabled:opacity-50">Cancelar</button>
          <button onClick={execute} disabled={busy} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
            {busy && <FaSpinner className="animate-spin" />} {isPost ? 'Eliminar' : 'Advertir'}
          </button>
        </div>
      </div>
    </div>
  )
}
