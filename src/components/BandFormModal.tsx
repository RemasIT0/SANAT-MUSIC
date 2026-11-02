// src/components/BandFormModal.tsx
// Crear o editar una banda.
import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { compressImage, imageExtension } from '../lib/imageCompress'
import { TUCUMAN_LOCATIONS, DEPARTAMENTOS, GENRES, COMMON_INSTRUMENTS } from '../lib/tucuman'
import { FaTimes, FaSpinner, FaUpload, FaUsers } from 'react-icons/fa'

export interface BandData {
  id?: string
  name: string
  bio: string
  genres: string[]
  departamento: string
  localidad: string
  logo_url: string | null
  looking_for: string[]
}

export default function BandFormModal({ band, onClose, onSaved }: { band?: BandData | null; onClose: () => void; onSaved: (id: string) => void }) {
  const { user, profile } = useAuth()
  const [form, setForm] = useState<BandData>(band || {
    name: '', bio: '', genres: [], logo_url: null, looking_for: [],
    departamento: profile?.departamento || 'Capital',
    localidad: profile?.localidad || TUCUMAN_LOCATIONS[profile?.departamento || 'Capital']?.[0] || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const savingRef = useRef(false)

  const toggle = (key: 'genres' | 'looking_for', value: string) =>
    setForm(prev => ({ ...prev, [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value] }))

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    setUploading(true)
    setError('')
    try {
      const compressed = await compressImage(file, 'avatar')
      const path = `${user.id}/band-${Date.now()}.${imageExtension(compressed)}`
      const { error } = await supabase.storage.from('avatars').upload(path, compressed, { contentType: compressed.type })
      if (error) throw error
      setForm(prev => ({ ...prev, logo_url: supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl }))
    } catch (err: any) {
      setError('No se pudo subir el logo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!user || form.name.trim().length < 2 || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(), bio: form.bio.trim(), genres: form.genres, departamento: form.departamento,
      localidad: form.localidad, logo_url: form.logo_url, looking_for: form.looking_for,
    }
    const { data, error } = band?.id
      ? await supabase.from('bands').update(payload).eq('id', band.id).select('id').single()
      : await supabase.from('bands').insert({ ...payload, created_by: user.id }).select('id').single()
    savingRef.current = false
    setSaving(false)
    if (error) {
      setError(/hasta \d bandas|1 sola banda/.test(error.message) ? 'Llegaste al máximo de 5 bandas creadas.' : /esperá/i.test(error.message) ? error.message : /bands/.test(error.message) && /exist/.test(error.message) ? 'Falta activar las bandas en Supabase (SQL de la etapa 3).' : 'No se pudo guardar: ' + error.message)
      return
    }
    onSaved(data.id)
  }

  const input = 'w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-500'
  const chip = (active: boolean) => `px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? 'bg-purple-600 border-purple-500 text-white' : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-300 hover:border-purple-500'}`

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="band-form-title">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-[slideUp_0.25s_ease-out]">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h3 id="band-form-title" className="text-white font-semibold">{band?.id ? 'Editar banda' : 'Crear banda'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><FaTimes /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[#0f0f0f] border border-[#2a2a2a] overflow-hidden flex items-center justify-center flex-shrink-0">
              {form.logo_url ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <FaUsers className="text-gray-500" size={28} />}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white text-sm disabled:opacity-50">
                {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload size={12} />} {form.logo_url ? 'Cambiar logo' : 'Subir logo'}
              </button>
              <p className="text-[11px] text-gray-500 mt-1">Opcional. Se comprime automáticamente.</p>
            </div>
          </div>

          <div><label className="block text-xs text-gray-400 mb-1">Nombre de la banda *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={60} className={input} placeholder="Ej: Los Gatos de Yerba Buena" /></div>
          <div><label className="block text-xs text-gray-400 mb-1">Sobre la banda</label><textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} maxLength={600} rows={3} className={`${input} resize-none`} placeholder="Qué tocan, influencias, hace cuánto están..." /></div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Departamento</label>
              <select value={form.departamento} onChange={e => setForm({ ...form, departamento: e.target.value, localidad: TUCUMAN_LOCATIONS[e.target.value][0] })} className={input}>
                {DEPARTAMENTOS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Localidad</label>
              <select value={form.localidad} onChange={e => setForm({ ...form, localidad: e.target.value })} className={input}>
                {(TUCUMAN_LOCATIONS[form.departamento] || []).map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Géneros</label>
            <div className="flex flex-wrap gap-1.5">{GENRES.map(g => <button key={g} type="button" onClick={() => toggle('genres', g)} className={chip(form.genres.includes(g))}>{g}</button>)}</div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">¿Buscan integrantes? Marcá qué instrumentos</label>
            <div className="flex flex-wrap gap-1.5">{COMMON_INSTRUMENTS.map(i => <button key={i} type="button" onClick={() => toggle('looking_for', i)} className={chip(form.looking_for.includes(i))}>{i}</button>)}</div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <div className="p-4 border-t border-[#2a2a2a]">
          <button onClick={save} disabled={saving || form.name.trim().length < 2} className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
            {saving && <FaSpinner className="animate-spin" />} {band?.id ? 'Guardar cambios' : 'Crear banda'}
          </button>
        </div>
      </div>
    </div>
  )
}
