// src/pages/Agenda.tsx
// Agenda de shows, jams y ensayos abiertos. "Voy" / "Me interesa" y
// recordatorio en la bandeja el día anterior (lo manda la base con pg_cron).
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useDialog } from '../components/DialogProvider'
import { ADMIN_EMAIL } from '../hooks/useAdminAlerts'
import AnimatedBackground from '../components/AnimatedBackground'
import Avatar from '../components/Avatar'
import Toast from '../components/Toast'
import { RowSkeleton } from '../components/Skeleton'
import { DEPARTAMENTOS } from '../lib/tucuman'
import type { IconType } from 'react-icons'
import {
  FaCalendarAlt, FaPlus, FaMapMarkerAlt, FaCheck, FaStar, FaRegStar, FaPen, FaTrash, FaTimes,
  FaSpinner, FaGuitar, FaMicrophoneAlt, FaDrum, FaMusic, FaClock, FaUsers,
} from 'react-icons/fa'

export const EVENT_TYPES: Record<string, { label: string; icon: IconType; color: string }> = {
  show: { label: 'Show', icon: FaMicrophoneAlt, color: '#a855f7' },
  jam: { label: 'Jam', icon: FaGuitar, color: '#22d3ee' },
  ensayo: { label: 'Ensayo abierto', icon: FaDrum, color: '#f97316' },
  otro: { label: 'Otro', icon: FaMusic, color: '#9ca3af' },
}

interface EventRow {
  id: string
  title: string
  description: string
  event_type: string
  starts_at: string
  place: string
  address: string
  departamento: string
  band_id: string | null
  created_by: string
  band?: { id: string; name: string } | null
  creator?: any
  rsvps: { user_id: string; status: 'voy' | 'interesa' }[]
}

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function Agenda() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { confirm } = useDialog()
  const [params, setParams] = useSearchParams()
  const [events, setEvents] = useState<EventRow[]>([])
  const [people, setPeople] = useState<Record<string, any>>({})
  const [myBands, setMyBands] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [filter, setFilter] = useState<'todos' | 'zona' | 'voy'>('todos')
  const [editing, setEditing] = useState<Partial<EventRow> | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const highlight = params.get('evento')

  const load = async () => {
    const since = new Date(Date.now() - 3 * 3600000).toISOString()   // los que empezaron hace poco siguen visibles
    const { data, error } = await supabase.from('events').select('*').gte('starts_at', since).order('starts_at').limit(100)
    if (error) { setMissing(true); setLoading(false); return }
    const ids = (data || []).map(e => e.id)
    const bandIds = [...new Set((data || []).map(e => e.band_id).filter(Boolean))]
    const [rsvpRes, bandsRes, myBandsRes] = await Promise.all([
      ids.length ? supabase.from('event_rsvps').select('event_id, user_id, status').in('event_id', ids) : Promise.resolve({ data: [] as any[] }),
      bandIds.length ? supabase.from('bands').select('id, name').in('id', bandIds) : Promise.resolve({ data: [] as any[] }),
      user ? supabase.from('band_members').select('band_id').eq('user_id', user.id).eq('status', 'active').eq('role', 'admin') : Promise.resolve({ data: [] as any[] }),
    ])
    const rsvps = rsvpRes.data || []
    const personIds = [...new Set([...rsvps.map(r => r.user_id), ...(data || []).map(e => e.created_by)])]
    const { data: profiles } = personIds.length
      ? await supabase.from('profiles').select('id, display_name, avatar_url, avatar_color').in('id', personIds)
      : { data: [] as any[] }
    const byId: Record<string, any> = {}
    ;(profiles || []).forEach(p => { byId[p.id] = p })
    setPeople(byId)
    setEvents((data || []).map(e => ({
      ...e,
      band: bandsRes.data?.find(b => b.id === e.band_id) || null,
      creator: byId[e.created_by],
      rsvps: rsvps.filter(r => r.event_id === e.id),
    })))
    const adminBandIds = (myBandsRes.data || []).map(m => m.band_id)
    if (adminBandIds.length) {
      const { data: bands } = await supabase.from('bands').select('id, name').in('id', adminBandIds)
      setMyBands(bands || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  // Abrir el formulario desde el perfil de una banda (?nuevo=1&banda=...)
  useEffect(() => {
    if (params.get('nuevo') === '1' && !loading && !missing) {
      openNew(params.get('banda'))
      setParams({}, { replace: true })
    }
  }, [loading])

  useEffect(() => {
    if (highlight && !loading) highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlight, loading])

  const openNew = (bandId?: string | null) => {
    const tomorrow = new Date(Date.now() + 86400000)
    tomorrow.setHours(21, 0, 0, 0)
    setFormError('')
    setEditing({ title: '', description: '', event_type: 'show', starts_at: tomorrow.toISOString(), place: '', address: '', departamento: profile?.departamento || 'Capital', band_id: bandId || null })
  }

  const save = async () => {
    if (!user || !editing) return
    const title = (editing.title || '').trim()
    const place = (editing.place || '').trim()
    if (title.length < 3 || place.length < 2) { setFormError('Completá el título y el lugar.'); return }
    if (new Date(editing.starts_at!).getTime() < Date.now()) { setFormError('La fecha tiene que ser futura.'); return }
    setSaving(true)
    setFormError('')
    const payload = {
      title, place, description: (editing.description || '').trim(), event_type: editing.event_type, starts_at: editing.starts_at,
      address: (editing.address || '').trim(), departamento: editing.departamento, band_id: editing.band_id || null,
    }
    const { error } = editing.id
      ? await supabase.from('events').update(payload).eq('id', editing.id).select('id').single()
      : await supabase.from('events').insert({ ...payload, created_by: user.id }).select('id').single()
    setSaving(false)
    if (error) { setFormError(/hasta 5 eventos/.test(error.message) ? 'Podés tener hasta 5 eventos próximos publicados.' : 'No se pudo guardar el evento.'); return }
    setEditing(null)
    setToast({ message: editing.id ? 'Evento actualizado' : 'Evento publicado en la agenda', type: 'success' })
    load()
  }

  const remove = async (ev: EventRow) => {
    if (!(await confirm({ title: `¿Borrar "${ev.title}"?`, message: 'Se quita de la agenda para todos.', confirmLabel: 'Borrar', danger: true }))) return
    const { data } = await supabase.from('events').delete().eq('id', ev.id).select('id')
    if (!data?.length) { setToast({ message: 'No se pudo borrar', type: 'error' }); return }
    setEvents(prev => prev.filter(e => e.id !== ev.id))
  }

  const rsvp = async (ev: EventRow, status: 'voy' | 'interesa') => {
    if (!user) return
    const current = ev.rsvps.find(r => r.user_id === user.id)?.status
    const next = current === status ? null : status
    // Actualización optimista
    setEvents(prev => prev.map(e => e.id !== ev.id ? e : {
      ...e, rsvps: [...e.rsvps.filter(r => r.user_id !== user.id), ...(next ? [{ user_id: user.id, status: next }] : [])],
    }))
    if (!people[user.id] && profile) setPeople(prev => ({ ...prev, [user.id]: profile }))
    const { error } = next
      ? await supabase.from('event_rsvps').upsert({ event_id: ev.id, user_id: user.id, status: next, reminded: false }, { onConflict: 'event_id,user_id' })
      : await supabase.from('event_rsvps').delete().eq('event_id', ev.id).eq('user_id', user.id)
    if (error) { setToast({ message: 'No se pudo guardar', type: 'error' }); load(); return }
    if (next === 'voy') setToast({ message: 'Anotado. Te recordamos el día anterior.', type: 'success' })
  }

  const visible = events.filter(e => {
    if (filter === 'zona') return e.departamento === profile?.departamento
    if (filter === 'voy') return e.rsvps.some(r => r.user_id === user?.id)
    return true
  })
  const groups: [string, EventRow[]][] = []
  visible.forEach(e => {
    const key = dayKey(e.starts_at)
    const group = groups.find(g => g[0] === key)
    group ? group[1].push(e) : groups.push([key, [e]])
  })

  const input = 'w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-500'
  const filters = [['todos', 'Todos'], ['zona', 'Mi zona'], ['voy', 'Mis planes']] as const

  return (
    <div className="min-h-screen relative text-gray-200 pb-24">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <main className="max-w-3xl mx-auto px-4 pt-10 pb-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl text-white flex items-center gap-3"><FaCalendarAlt className="text-purple-400" /> Agenda</h1>
          <button onClick={() => openNew()} disabled={missing} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold disabled:opacity-40">
            <FaPlus size={11} /> Publicar evento
          </button>
        </div>
        <p className="text-sm text-gray-400">Shows, jams y ensayos abiertos en Tucumán. Marcá "Voy" y te avisamos el día anterior.</p>

        <div className="flex gap-1.5">
          {filters.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === id ? 'bg-purple-700 border-purple-500 text-white' : 'bg-[#141414] border-[#2a2a2a] text-gray-300 hover:text-white'}`}>{label}</button>
          ))}
        </div>

        {missing && <p className="text-sm text-amber-200 bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">Falta activar la agenda: corré el SQL de la etapa 3 en Supabase.</p>}

        {loading ? (
          <div className="space-y-2"><RowSkeleton /><RowSkeleton /><RowSkeleton /></div>
        ) : groups.length === 0 ? (
          <div className="text-center py-14 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4">
            <FaCalendarAlt className="text-4xl mx-auto mb-3 text-gray-500" />
            <p className="text-gray-200 font-semibold">{filter === 'voy' ? 'No te anotaste a ningún evento' : 'No hay eventos próximos'}</p>
            <p className="text-sm text-gray-400 mt-1">¿Tocás pronto o armás una jam? Publicala para que se sume gente.</p>
          </div>
        ) : groups.map(([day, list]) => (
          <section key={day}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 first-letter:uppercase">{day}</h2>
            <div className="space-y-3">
              {list.map(ev => {
                const type = EVENT_TYPES[ev.event_type] || EVENT_TYPES.otro
                const mine = ev.rsvps.find(r => r.user_id === user?.id)?.status
                const going = ev.rsvps.filter(r => r.status === 'voy')
                const interested = ev.rsvps.filter(r => r.status === 'interesa').length
                const canEdit = ev.created_by === user?.id || user?.email === ADMIN_EMAIL
                const date = new Date(ev.starts_at)
                return (
                  <div key={ev.id} ref={ev.id === highlight ? highlightRef : undefined} className={`bg-[#1a1a1a] border rounded-2xl p-4 ${ev.id === highlight ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-[#2a2a2a]'}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-14 text-center rounded-xl py-1.5 flex-shrink-0 border" style={{ backgroundColor: type.color + '22', borderColor: type.color + '66' }}>
                        <p className="text-[10px] uppercase text-gray-300">{date.toLocaleDateString('es-AR', { month: 'short' })}</p>
                        <p className="text-xl font-bold text-white leading-none">{date.getDate()}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: type.color }}><type.icon size={10} /> {type.label}</span>
                        <h3 className="text-white font-semibold break-words leading-snug">{ev.title}</h3>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5"><FaClock size={10} /> {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5"><FaMapMarkerAlt size={10} /> {ev.place}{ev.address && ` · ${ev.address}`}{ev.departamento && ` · ${ev.departamento}`}</p>
                        {ev.band && <button onClick={() => navigate(`/banda/${ev.band!.id}`)} className="text-xs text-purple-300 hover:text-purple-200 mt-0.5 flex items-center gap-1.5"><FaUsers size={10} /> {ev.band.name}</button>}
                      </div>
                      {canEdit && (
                        <div className="flex">
                          <button onClick={() => { setFormError(''); setEditing(ev) }} className="p-2 text-gray-400 hover:text-white" aria-label="Editar evento"><FaPen size={11} /></button>
                          <button onClick={() => remove(ev)} className="p-2 text-gray-400 hover:text-red-300" aria-label="Borrar evento"><FaTrash size={11} /></button>
                        </div>
                      )}
                    </div>
                    {ev.description && <p className="text-sm text-gray-200 whitespace-pre-wrap break-words mt-3">{ev.description}</p>}

                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#2a2a2a]">
                      <button onClick={() => rsvp(ev, 'voy')} aria-pressed={mine === 'voy'} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mine === 'voy' ? 'bg-green-600 text-white' : 'bg-[#2a2a2a] hover:bg-[#333] text-white'}`}>
                        <FaCheck size={10} /> Voy {going.length > 0 && <span className="opacity-80">· {going.length}</span>}
                      </button>
                      <button onClick={() => rsvp(ev, 'interesa')} aria-pressed={mine === 'interesa'} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mine === 'interesa' ? 'bg-amber-500 text-black' : 'bg-[#2a2a2a] hover:bg-[#333] text-white'}`}>
                        {mine === 'interesa' ? <FaStar size={10} /> : <FaRegStar size={10} />} Me interesa {interested > 0 && <span className="opacity-80">· {interested}</span>}
                      </button>
                      {going.length > 0 && (
                        <div className="flex items-center ml-auto -space-x-2" title={going.map(r => people[r.user_id]?.display_name).filter(Boolean).join(', ')}>
                          {going.slice(0, 5).map(r => (
                            <div key={r.user_id} className="rounded-full ring-2 ring-[#1a1a1a]">
                              <Avatar url={people[r.user_id]?.avatar_url || null} name={people[r.user_id]?.display_name || '?'} color={people[r.user_id]?.avatar_color || '#333'} size={24} />
                            </div>
                          ))}
                          {going.length > 5 && <span className="pl-3 text-xs text-gray-400">+{going.length - 5}</span>}
                        </div>
                      )}
                    </div>
                    {ev.creator && <p className="text-[11px] text-gray-500 mt-2">Publicado por <button onClick={() => navigate(`/perfil/${ev.created_by}`)} className="text-gray-300 hover:text-white">{ev.creator.display_name}</button></p>}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </main>

      {editing && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="event-form-title">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative w-full sm:max-w-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <h3 id="event-form-title" className="text-white font-semibold">{editing.id ? 'Editar evento' : 'Publicar evento'}</h3>
              <button onClick={() => setEditing(null)} className="p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><FaTimes /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(EVENT_TYPES).map(([key, t]) => (
                  <button key={key} type="button" onClick={() => setEditing({ ...editing, event_type: key })} className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[11px] transition-colors ${editing.event_type === key ? 'border-purple-500 bg-purple-900/30 text-white' : 'border-[#2a2a2a] bg-[#0f0f0f] text-gray-300'}`}>
                    <t.icon style={{ color: t.color }} size={15} /> {t.label}
                  </button>
                ))}
              </div>
              <div><label className="block text-xs text-gray-400 mb-1">Título *</label><input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} maxLength={80} className={input} placeholder="Ej: Jam de blues en el centro" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">Fecha y hora *</label><input type="datetime-local" value={toLocalInput(editing.starts_at!)} onChange={e => e.target.value && setEditing({ ...editing, starts_at: new Date(e.target.value).toISOString() })} className={`${input} [color-scheme:dark]`} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs text-gray-400 mb-1">Lugar *</label><input value={editing.place || ''} onChange={e => setEditing({ ...editing, place: e.target.value })} maxLength={80} className={input} placeholder="Ej: Bar La Cueva" /></div>
                <div><label className="block text-xs text-gray-400 mb-1">Dirección</label><input value={editing.address || ''} onChange={e => setEditing({ ...editing, address: e.target.value })} maxLength={120} className={input} placeholder="Opcional" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Departamento</label>
                  <select value={editing.departamento} onChange={e => setEditing({ ...editing, departamento: e.target.value })} className={input}>{DEPARTAMENTOS.map(d => <option key={d}>{d}</option>)}</select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Banda</label>
                  <select value={editing.band_id || ''} onChange={e => setEditing({ ...editing, band_id: e.target.value || null })} className={input}>
                    <option value="">Sin banda</option>
                    {myBands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    {editing.band_id && !myBands.some(b => b.id === editing.band_id) && <option value={editing.band_id}>{editing.band?.name || 'Banda actual'}</option>}
                  </select>
                </div>
              </div>
              <div><label className="block text-xs text-gray-400 mb-1">Descripción</label><textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} maxLength={800} rows={3} className={`${input} resize-none`} placeholder="Entrada, quiénes tocan, si hay que llevar instrumento..." /></div>
              {formError && <p className="text-sm text-red-400">{formError}</p>}
            </div>
            <div className="p-4 border-t border-[#2a2a2a]">
              <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                {saving && <FaSpinner className="animate-spin" />} {editing.id ? 'Guardar cambios' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
