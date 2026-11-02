// src/components/AdminEvents.tsx
// Panel admin → Eventos: ver, editar y borrar cualquier fecha de la agenda.
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useDialog } from './DialogProvider'
import { ADMIN_RECHECK_EVENT } from './AdminSecretGate'
import { logAdminAction } from '../lib/adminLog'
import { EVENT_TYPES } from '../pages/Agenda'
import { DEPARTAMENTOS } from '../lib/tucuman'
import { FaCalendarAlt, FaEdit, FaTrash, FaSpinner, FaTimes, FaMapMarkerAlt } from 'react-icons/fa'

const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function AdminEvents({ onToast }: { onToast: (message: string, type: 'success' | 'error' | 'info') => void }) {
  const { confirm } = useDialog()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('events').select('*').order('starts_at', { ascending: true }).limit(300)
    if (error) { setMissing(true); setLoading(false); return }
    const ids = [...new Set((data || []).map(e => e.created_by))]
    const { data: people } = ids.length ? await supabase.from('profiles').select('id, display_name, username').in('id', ids) : { data: [] as any[] }
    setEvents((data || []).map(e => ({ ...e, creator: people?.find(p => p.id === e.created_by) })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Si Supabase no aplicó el cambio, puede haber vencido la pregunta secreta
  const denied = () => {
    window.dispatchEvent(new Event(ADMIN_RECHECK_EVENT))
    onToast('Supabase no dejó aplicar el cambio. Si te pide la pregunta secreta, respondela y probá de nuevo.', 'error')
  }

  const remove = async (ev: any) => {
    if (!(await confirm({ title: `¿Borrar "${ev.title}"?`, message: 'Se quita de la agenda para todos. No se puede deshacer.', confirmLabel: 'Borrar', danger: true }))) return
    const { data, error } = await supabase.from('events').delete().eq('id', ev.id).select('id')
    if (error || !data?.length) { denied(); return }
    setEvents(prev => prev.filter(e => e.id !== ev.id))
    onToast('Evento borrado', 'success')
    logAdminAction('Evento borrado', `${ev.title} (de ${ev.creator?.display_name || 'usuario'})`)
  }

  const save = async () => {
    if (!editing || saving) return
    const title = editing.title.trim()
    const place = editing.place.trim()
    if (title.length < 3 || place.length < 2) { onToast('Completá el título y el lugar', 'error'); return }
    setSaving(true)
    const payload = {
      title, place, description: (editing.description || '').trim(), address: (editing.address || '').trim(),
      event_type: editing.event_type, starts_at: editing.starts_at, departamento: editing.departamento,
    }
    const { data, error } = await supabase.from('events').update(payload).eq('id', editing.id).select('id')
    setSaving(false)
    if (error || !data?.length) { denied(); return }
    setEditing(null)
    onToast('Evento actualizado', 'success')
    logAdminAction('Evento editado', title)
    load()
  }

  const now = Date.now()
  const visible = events.filter(e => showPast || new Date(e.starts_at).getTime() > now - 3 * 3600000)
  const input = 'w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-500 font-mono text-sm'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-white font-mono flex items-center gap-2"><FaCalendarAlt className="text-amber-300" /> EVENTOS DE LA AGENDA</h2>
        <label className="flex items-center gap-2 text-xs text-gray-300 font-mono">
          <input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)} className="accent-purple-500" /> Mostrar pasados
        </label>
      </div>

      {missing ? (
        <p className="text-sm text-amber-200 bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">Falta activar la agenda: corré el SQL de la etapa 3 en Supabase.</p>
      ) : loading ? (
        <div className="flex justify-center py-12 text-gray-400"><FaSpinner className="animate-spin" size={20} /></div>
      ) : visible.length === 0 ? (
        <p className="text-center text-gray-500 font-mono py-12">NO HAY EVENTOS {showPast ? '' : 'PRÓXIMOS'}</p>
      ) : (
        <div className="space-y-3">
          {visible.map(ev => {
            const type = EVENT_TYPES[ev.event_type] || EVENT_TYPES.otro
            const date = new Date(ev.starts_at)
            const past = date.getTime() < now
            return (
              <div key={ev.id} className={`p-3 sm:p-4 rounded-xl border bg-[#0f0f0f] ${past ? 'border-[#2a2a2a] opacity-60' : 'border-amber-500/30'}`}>
                <p className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: type.color }}>
                  <type.icon size={10} /> {type.label} · {date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs{past && ' · PASADO'}
                </p>
                <h3 className="font-bold text-white break-words mt-0.5">{ev.title}</h3>
                <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5"><FaMapMarkerAlt size={10} /> {ev.place}{ev.departamento && ` · ${ev.departamento}`}</p>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">Publicado por {ev.creator?.display_name || 'usuario'}{ev.creator?.username && ` (@${ev.creator.username})`}</p>
                <div className="grid grid-cols-2 sm:flex sm:justify-end gap-2 mt-3 pt-3 border-t border-[#2a2a2a]">
                  <button onClick={() => setEditing({ ...ev })} className="flex items-center justify-center gap-1.5 text-blue-300 hover:text-blue-200 px-3 py-2 bg-blue-950/20 hover:bg-blue-900/30 rounded-lg border border-blue-900/50 font-mono text-xs"><FaEdit size={11} /> EDITAR</button>
                  <button onClick={() => remove(ev)} className="flex items-center justify-center gap-1.5 text-red-400 hover:text-red-300 px-3 py-2 bg-red-950/20 hover:bg-red-900/30 rounded-lg border border-red-900/50 font-mono text-xs"><FaTrash size={11} /> BORRAR</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="admin-event-title">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative bg-[#1a1a1a] border border-amber-900/40 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-3">
            <button onClick={() => setEditing(null)} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><FaTimes /></button>
            <h3 id="admin-event-title" className="text-lg font-bold text-white font-mono">EDITAR EVENTO</h3>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase">Tipo</label>
              <select value={editing.event_type} onChange={e => setEditing({ ...editing, event_type: e.target.value })} className={input}>
                {Object.entries(EVENT_TYPES).map(([key, t]) => <option key={key} value={key}>{t.label}</option>)}
              </select>
            </div>
            <div><label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase">Título</label><input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} maxLength={80} className={input} /></div>
            <div><label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase">Fecha y hora</label><input type="datetime-local" value={toLocalInput(editing.starts_at)} onChange={e => e.target.value && setEditing({ ...editing, starts_at: new Date(e.target.value).toISOString() })} className={`${input} [color-scheme:dark]`} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase">Lugar</label><input value={editing.place} onChange={e => setEditing({ ...editing, place: e.target.value })} maxLength={80} className={input} /></div>
              <div><label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase">Dirección</label><input value={editing.address || ''} onChange={e => setEditing({ ...editing, address: e.target.value })} maxLength={120} className={input} /></div>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase">Departamento</label>
              <select value={editing.departamento} onChange={e => setEditing({ ...editing, departamento: e.target.value })} className={input}>{DEPARTAMENTOS.map(d => <option key={d}>{d}</option>)}</select>
            </div>
            <div><label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase">Descripción</label><textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} maxLength={800} rows={3} className={`${input} resize-none`} /></div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] font-mono text-sm">CANCELAR</button>
              <button onClick={save} disabled={saving} className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-semibold rounded-lg font-mono text-sm flex items-center justify-center gap-2">{saving && <FaSpinner className="animate-spin" />} GUARDAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
