// src/components/AdminBannerControl.tsx
// Control del panel de admin para prender/apagar la franja de aviso
import { useState, useEffect } from 'react'
import { useAppSettings, DEFAULT_BANNER_TEXT } from '../hooks/useAppSettings'
import { logAdminAction } from '../lib/adminLog'
import { FaExclamationTriangle, FaSpinner, FaToggleOn, FaToggleOff } from 'react-icons/fa'

export default function AdminBannerControl({ onResult }: { onResult: (message: string, type: 'success' | 'error') => void }) {
  const { settings, updateSettings } = useAppSettings()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (settings) setText(settings.banner_text || DEFAULT_BANNER_TEXT) }, [settings?.banner_text])

  if (!settings) {
    return (
      <div className="bg-[#1a1a1a]/80 border border-[#2a2a2a] rounded-2xl p-4 text-sm text-gray-400">
        Aviso de la app no disponible: falta correr <span className="font-mono text-gray-300">AVISO_y_mensajes.sql</span> en Supabase.
      </div>
    )
  }

  const save = async (changes: { banner_enabled?: boolean; banner_text?: string }, okMessage: string) => {
    setSaving(true)
    const error = await updateSettings(changes)
    setSaving(false)
    if (error) onResult('Error: ' + error.message, 'error')
    else {
      onResult(okMessage, 'success')
      logAdminAction(okMessage, changes.banner_text ?? (changes.banner_enabled ? 'franja visible' : 'franja oculta'))
    }
  }

  const enabled = settings.banner_enabled
  const textChanged = text.trim() !== (settings.banner_text || '').trim()

  return (
    <div className={`bg-[#1a1a1a]/80 border rounded-2xl p-4 md:p-5 ${enabled ? 'border-red-600/60' : 'border-[#2a2a2a]'}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <FaExclamationTriangle className={enabled ? 'text-red-400' : 'text-gray-500'} size={18} />
        <div className="flex-1 min-w-[180px]">
          <p className="text-white font-semibold text-sm">Aviso de versión de prueba</p>
          <p className="text-gray-400 text-xs">{enabled ? 'Visible para todos los usuarios, arriba de la pantalla.' : 'Apagado. Nadie lo ve.'}</p>
        </div>
        <button
          onClick={() => save({ banner_enabled: !enabled }, enabled ? 'Aviso desactivado' : 'Aviso activado')}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${enabled ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-[#0f0f0f] border border-[#2a2a2a] text-gray-300 hover:text-white'}`}
        >
          {saving ? <FaSpinner className="animate-spin" /> : enabled ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
          {enabled ? 'Activado' : 'Desactivado'}
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={140}
          placeholder={DEFAULT_BANNER_TEXT}
          className="flex-1 min-w-0 p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-red-500 placeholder:text-gray-600"
          aria-label="Texto del aviso"
        />
        <button
          onClick={() => save({ banner_text: text.trim() || DEFAULT_BANNER_TEXT }, 'Texto del aviso guardado')}
          disabled={saving || !textChanged}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#2a2a2a] text-white hover:bg-[#333] disabled:opacity-40 transition-colors"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}
