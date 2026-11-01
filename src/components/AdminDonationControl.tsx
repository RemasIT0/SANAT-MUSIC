// src/components/AdminDonationControl.tsx
// Control del panel de admin para configurar la invitación a donar
import { useState, useEffect } from 'react'
import { useAppSettings, DEFAULT_DONATION_TEXT } from '../hooks/useAppSettings'
import { logAdminAction } from '../lib/adminLog'
import { FaHandHoldingHeart, FaSpinner, FaToggleOn, FaToggleOff } from 'react-icons/fa'

export default function AdminDonationControl({ onResult }: { onResult: (message: string, type: 'success' | 'error') => void }) {
  const { settings, updateSettings } = useAppSettings()
  const [form, setForm] = useState({ text: '', alias: '', link: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) setForm({ text: settings.donation_text || DEFAULT_DONATION_TEXT, alias: settings.donation_alias || '', link: settings.donation_link || '' })
  }, [settings?.donation_text, settings?.donation_alias, settings?.donation_link])

  // Si la base todavía no tiene las columnas de donación, no mostrar el control
  if (!settings || settings.donation_enabled === undefined) return null

  const save = async (changes: Record<string, unknown>, okMessage: string) => {
    setSaving(true)
    const error = await updateSettings(changes)
    setSaving(false)
    if (error) { onResult('Error: ' + error.message, 'error'); return }
    onResult(okMessage, 'success')
    logAdminAction(okMessage, form.alias || 'sin alias')
  }

  const saveTexts = () => {
    const link = form.link.trim()
    if (link && !/^https:\/\//i.test(link)) { onResult('El link tiene que empezar con https://', 'error'); return }
    save({ donation_text: form.text.trim() || DEFAULT_DONATION_TEXT, donation_alias: form.alias.trim(), donation_link: link }, 'Datos de donación guardados')
  }

  const enabled = !!settings.donation_enabled
  const input = 'w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-pink-500 placeholder:text-gray-500'

  return (
    <div className={`bg-[#1a1a1a]/80 border rounded-2xl p-4 md:p-5 space-y-3 ${enabled ? 'border-pink-600/60' : 'border-[#2a2a2a]'}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <FaHandHoldingHeart className={enabled ? 'text-pink-400' : 'text-gray-500'} size={18} />
        <div className="flex-1 min-w-[180px]">
          <p className="text-white font-semibold text-sm">Invitación a donar</p>
          <p className="text-gray-400 text-xs">{enabled ? 'Visible en Opciones → "Apoyar a SANAT" y al final del feed.' : 'Apagada. Nadie la ve.'}</p>
        </div>
        <button
          onClick={() => save({ donation_enabled: !enabled }, enabled ? 'Donaciones ocultas' : 'Donaciones visibles')}
          disabled={saving || (!enabled && !form.alias.trim() && !form.link.trim())}
          title={!enabled && !form.alias.trim() && !form.link.trim() ? 'Cargá un alias o un link primero' : undefined}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${enabled ? 'bg-pink-700 hover:bg-pink-600 text-white' : 'bg-[#0f0f0f] border border-[#2a2a2a] text-gray-300 hover:text-white'}`}
        >
          {saving ? <FaSpinner className="animate-spin" /> : enabled ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
          {enabled ? 'Activada' : 'Desactivada'}
        </button>
      </div>
      <textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} rows={2} maxLength={300} className={`${input} resize-none`} aria-label="Texto de la invitación" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input value={form.alias} onChange={e => setForm({ ...form, alias: e.target.value })} maxLength={60} placeholder="Alias o CVU (ej: sanat.musica.mp)" className={input} aria-label="Alias o CVU" />
        <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} maxLength={200} placeholder="Link de pago (ej: https://cafecito.app/...)" className={input} aria-label="Link de donación" />
      </div>
      <button onClick={saveTexts} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#2a2a2a] text-white hover:bg-[#333] disabled:opacity-40">Guardar datos</button>
    </div>
  )
}
