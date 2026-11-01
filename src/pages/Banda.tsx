// src/pages/Banda.tsx
// Perfil de una banda: integrantes, demos, próximas fechas y postulaciones.
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useDialog } from '../components/DialogProvider'
import { ADMIN_EMAIL } from '../hooks/useAdminAlerts'
import AnimatedBackground from '../components/AnimatedBackground'
import Avatar from '../components/Avatar'
import Toast from '../components/Toast'
import BandFormModal from '../components/BandFormModal'
import { ProfileAudioPlayer } from '../components/ProfileAudio'
import { ProfileSkeleton } from '../components/Skeleton'
import { BandLogo, type BandRow } from './Bandas'
import { friendlySendError } from '../components/ShareModal'
import {
  FaArrowLeft, FaMapMarkerAlt, FaUserPlus, FaPen, FaTrash, FaCheck, FaTimes, FaSpinner,
  FaCrown, FaSignOutAlt, FaCalendarAlt, FaComment, FaHourglassHalf,
} from 'react-icons/fa'

interface Member {
  user_id: string
  role: 'admin' | 'member'
  status: 'active' | 'pending'
  instrument: string
  message: string
  created_at: string
  profile?: any
}

export default function Banda() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { confirm } = useDialog()
  const [band, setBand] = useState<BandRow | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showApply, setShowApply] = useState(false)
  const [instrument, setInstrument] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const load = async () => {
    if (!id) return
    const { data } = await supabase.from('bands').select('*').eq('id', id).maybeSingle()
    if (!data) { setNotFound(true); setLoading(false); return }
    const [membersRes, eventsRes] = await Promise.all([
      supabase.from('band_members').select('user_id, role, status, instrument, message, created_at').eq('band_id', id).order('created_at'),
      supabase.from('events').select('id, title, starts_at, place, event_type').eq('band_id', id).gte('starts_at', new Date().toISOString()).order('starts_at').limit(5),
    ])
    const ids = (membersRes.data || []).map(m => m.user_id)
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('id, display_name, avatar_url, avatar_color, instruments, audio_url').in('id', ids)
      : { data: [] as any[] }
    setBand(data)
    setMembers((membersRes.data || []).map(m => ({ ...m, profile: profiles?.find(p => p.id === m.user_id) })))
    setEvents(eventsRes.data || [])
    setLoading(false)
  }

  useEffect(() => { setLoading(true); load() }, [id])

  if (loading) return <div className="min-h-screen relative pb-24"><AnimatedBackground /><main className="max-w-3xl mx-auto px-4 pt-10"><ProfileSkeleton /></main></div>
  if (notFound || !band) return (
    <div className="min-h-screen relative pb-24 flex items-center justify-center text-center px-4">
      <AnimatedBackground />
      <div><p className="text-white font-semibold mb-3">Esta banda no existe o fue borrada.</p><button onClick={() => navigate('/bandas')} className="px-4 py-2 rounded-xl bg-purple-700 text-white text-sm">Ver bandas</button></div>
    </div>
  )

  const active = members.filter(m => m.status === 'active')
  const pending = members.filter(m => m.status === 'pending')
  const me = members.find(m => m.user_id === user?.id)
  const amAdmin = me?.role === 'admin' && me.status === 'active'
  const isSiteAdmin = user?.email === ADMIN_EMAIL
  const withAudio = active.filter(m => m.profile?.audio_url)

  const apply = async () => {
    if (!user) return
    setBusy(true)
    const { error } = await supabase.from('band_members').insert({ band_id: band.id, user_id: user.id, instrument: instrument.trim(), message: message.trim(), status: 'pending', role: 'member' })
    if (error) { setBusy(false); setToast({ message: 'No se pudo enviar la postulación', type: 'error' }); return }
    // Aviso por chat al creador de la banda
    const text = `Hola! Me postulé a ${band.name}${instrument.trim() ? ` como ${instrument.trim()}` : ''}.${message.trim() ? `\n\n${message.trim()}` : ''}`
    const sent = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: band.created_by, content: text })
    setBusy(false)
    setShowApply(false)
    setToast(sent.error
      ? { message: `Postulación enviada. No se pudo avisar por chat: ${friendlySendError(sent.error.message)}`, type: 'info' }
      : { message: 'Postulación enviada. Le avisamos por chat a la banda.', type: 'success' })
    load()
  }

  const accept = async (m: Member) => {
    const { data, error } = await supabase.from('band_members').update({ status: 'active' }).eq('band_id', band.id).eq('user_id', m.user_id).select('user_id')
    if (error || !data?.length) { setToast({ message: 'No se pudo aceptar', type: 'error' }); return }
    await supabase.from('messages').insert({ sender_id: user!.id, receiver_id: m.user_id, content: `¡Bienvenido/a a ${band.name}! Ya sos parte de la banda en SANAT.` })
    setToast({ message: `${m.profile?.display_name || 'Integrante'} ahora es parte de la banda`, type: 'success' })
    load()
  }

  const removeMember = async (m: Member, kind: 'reject' | 'remove' | 'leave') => {
    const name = m.profile?.display_name || 'esta persona'
    const texts = {
      reject: { title: `¿Rechazar a ${name}?`, label: 'Rechazar' },
      remove: { title: `¿Sacar a ${name} de la banda?`, label: 'Sacar' },
      leave: { title: `¿Salir de ${band.name}?`, label: 'Salir' },
    }[kind]
    if (kind === 'leave' && amAdmin && active.length === 1) {
      setToast({ message: 'Sos el único integrante. Si ya no existe la banda, usá "Borrar banda".', type: 'info' })
      return
    }
    if (kind === 'leave' && amAdmin && active.filter(a => a.role === 'admin').length === 1) {
      setToast({ message: 'Sos el único administrador. Hacé administrador a otro integrante antes de salir.', type: 'info' })
      return
    }
    if (!(await confirm({ title: texts.title, confirmLabel: texts.label, danger: true }))) return
    const { data, error } = await supabase.from('band_members').delete().eq('band_id', band.id).eq('user_id', m.user_id).select('user_id')
    if (error || !data?.length) { setToast({ message: 'No se pudo completar', type: 'error' }); return }
    load()
  }

  const makeAdmin = async (m: Member) => {
    if (!(await confirm({ title: `¿Hacer administrador a ${m.profile?.display_name}?`, message: 'Va a poder editar la banda, aceptar postulaciones y sacar integrantes.', confirmLabel: 'Hacer administrador' }))) return
    const { data } = await supabase.from('band_members').update({ role: 'admin' }).eq('band_id', band.id).eq('user_id', m.user_id).select('user_id')
    if (!data?.length) { setToast({ message: 'No se pudo cambiar el rol', type: 'error' }); return }
    load()
  }

  const deleteBand = async () => {
    if (!(await confirm({ title: `¿Borrar ${band.name}?`, message: 'Se borran la banda y sus integrantes. Los eventos quedan sin banda asociada. No se puede deshacer.', confirmLabel: 'Borrar banda', danger: true }))) return
    const { data, error } = await supabase.from('bands').delete().eq('id', band.id).select('id')
    if (error || !data?.length) { setToast({ message: 'No se pudo borrar la banda', type: 'error' }); return }
    navigate('/bandas')
  }

  const card = 'bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 md:p-5'
  const smallBtn = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors'

  return (
    <div className="min-h-screen relative text-gray-200 pb-24">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-4 space-y-4">
        <button onClick={() => navigate('/bandas')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"><FaArrowLeft size={12} /> Bandas</button>

        <section className={card}>
          <div className="flex items-start gap-4">
            <BandLogo band={band} size={84} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl text-white break-words">{band.name}</h1>
              <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-1"><FaMapMarkerAlt size={11} /> {[band.localidad, band.departamento].filter(Boolean).join(', ') || 'Tucumán'}</p>
              {band.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">{band.genres.map(g => <span key={g} className="px-2 py-0.5 rounded-full text-[11px] bg-purple-900/30 border border-purple-700/40 text-purple-200">{g}</span>)}</div>
              )}
            </div>
          </div>
          {band.bio && <p className="text-sm text-gray-200 whitespace-pre-wrap break-words mt-4">{band.bio}</p>}

          {band.looking_for.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-amber-900/15 border border-amber-600/40">
              <p className="text-xs font-semibold text-amber-200 flex items-center gap-1.5 mb-2"><FaUserPlus size={11} /> Buscamos</p>
              <div className="flex flex-wrap gap-1.5">{band.looking_for.map(i => <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-amber-500/15 border border-amber-500/40 text-amber-100">{i}</span>)}</div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {!me && (
              <button onClick={() => { setInstrument(band.looking_for[0] || ''); setMessage(''); setShowApply(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold">
                <FaUserPlus size={12} /> {band.looking_for.length ? 'Postularme' : 'Quiero unirme'}
              </button>
            )}
            {me?.status === 'pending' && <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a2a2a] text-gray-200 text-sm"><FaHourglassHalf size={11} /> Postulación enviada</span>}
            {user?.id !== band.created_by && (
              <button onClick={() => navigate(`/chat/${band.created_by}`)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#333] text-white text-sm"><FaComment size={12} /> Escribir a la banda</button>
            )}
            {amAdmin && <button onClick={() => setShowEdit(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#333] text-white text-sm"><FaPen size={11} /> Editar</button>}
            {me && <button onClick={() => removeMember(me, 'leave')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-red-300 text-sm"><FaSignOutAlt size={12} /> {me.status === 'pending' ? 'Cancelar postulación' : 'Salir'}</button>}
            {(amAdmin || isSiteAdmin) && <button onClick={deleteBand} className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-red-300 text-sm ml-auto"><FaTrash size={11} /> Borrar banda</button>}
          </div>
        </section>

        {amAdmin && pending.length > 0 && (
          <section className={`${card} border-amber-600/40`}>
            <h2 className="text-white font-semibold mb-3">Postulaciones <span className="text-gray-400 font-normal text-sm">({pending.length})</span></h2>
            <ul className="space-y-3">
              {pending.map(m => (
                <li key={m.user_id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-[#0f0f0f]">
                  <button onClick={() => navigate(`/perfil/${m.user_id}`)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                    <Avatar url={m.profile?.avatar_url || null} name={m.profile?.display_name || '?'} color={m.profile?.avatar_color || '#333'} size={40} />
                    <div className="min-w-0">
                      <p className="text-sm text-white font-semibold truncate">{m.profile?.display_name || 'Usuario'}{m.instrument && <span className="text-gray-400 font-normal"> · {m.instrument}</span>}</p>
                      {m.message && <p className="text-xs text-gray-300 break-words">{m.message}</p>}
                    </div>
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => accept(m)} className={`${smallBtn} bg-green-700 hover:bg-green-600 text-white`}><FaCheck size={10} /> Aceptar</button>
                    <button onClick={() => removeMember(m, 'reject')} className={`${smallBtn} bg-[#2a2a2a] hover:bg-[#333] text-white`}><FaTimes size={10} /> Rechazar</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={card}>
          <h2 className="text-white font-semibold mb-3">Integrantes <span className="text-gray-400 font-normal text-sm">({active.length})</span></h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {active.map(m => (
              <li key={m.user_id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0f0f0f]">
                <button onClick={() => navigate(`/perfil/${m.user_id}`)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                  <Avatar url={m.profile?.avatar_url || null} name={m.profile?.display_name || '?'} color={m.profile?.avatar_color || '#333'} size={38} />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate flex items-center gap-1.5">{m.profile?.display_name || 'Usuario'} {m.role === 'admin' && <FaCrown className="text-amber-300 flex-shrink-0" size={11} title="Administra la banda" />}</p>
                    <p className="text-xs text-gray-400 truncate">{m.instrument || m.profile?.instruments?.[0]?.name || 'Integrante'}</p>
                  </div>
                </button>
                {amAdmin && m.user_id !== user?.id && (
                  <div className="flex gap-1">
                    {m.role !== 'admin' && <button onClick={() => makeAdmin(m)} className="p-2 text-gray-400 hover:text-amber-300" aria-label="Hacer administrador" title="Hacer administrador"><FaCrown size={12} /></button>}
                    <button onClick={() => removeMember(m, 'remove')} className="p-2 text-gray-400 hover:text-red-300" aria-label="Sacar de la banda" title="Sacar de la banda"><FaTimes size={12} /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>

        {withAudio.length > 0 && (
          <section className={card}>
            <h2 className="text-white font-semibold mb-3">Cómo suenan</h2>
            <div className="space-y-2">
              {withAudio.map(m => <ProfileAudioPlayer key={m.user_id} url={m.profile.audio_url} name={m.profile.display_name} />)}
            </div>
          </section>
        )}

        <section className={card}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-white font-semibold">Próximas fechas</h2>
            <button onClick={() => navigate(amAdmin ? `/agenda?nuevo=1&banda=${band.id}` : '/agenda')} className="text-xs text-purple-300 hover:text-purple-200">{amAdmin ? '+ Agregar fecha' : 'Ver agenda'}</button>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-gray-400">No hay fechas anunciadas.</p>
          ) : (
            <ul className="space-y-2">
              {events.map(ev => {
                const date = new Date(ev.starts_at)
                return (
                  <li key={ev.id}>
                    <button onClick={() => navigate(`/agenda?evento=${ev.id}`)} className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#0f0f0f] hover:bg-[#151515] text-left">
                      <div className="w-12 text-center rounded-lg bg-purple-900/40 border border-purple-700/40 py-1 flex-shrink-0">
                        <p className="text-[10px] uppercase text-purple-200">{date.toLocaleDateString('es-AR', { month: 'short' })}</p>
                        <p className="text-lg font-bold text-white leading-none">{date.getDate()}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1"><FaCalendarAlt size={9} /> {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs · {ev.place}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </main>

      {showEdit && <BandFormModal band={band} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); load() }} />}

      {showApply && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="apply-title">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowApply(false)} />
          <div className="relative w-full sm:max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-[slideUp_0.25s_ease-out] space-y-3">
            <button onClick={() => setShowApply(false)} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><FaTimes /></button>
            <h3 id="apply-title" className="text-white text-lg">Postularme a {band.name}</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">¿Qué tocarías?</label>
              <input value={instrument} onChange={e => setInstrument(e.target.value)} maxLength={40} list="band-instruments" className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" placeholder="Ej: Bajo" />
              <datalist id="band-instruments">{band.looking_for.map(i => <option key={i} value={i} />)}</datalist>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Mensaje para la banda (opcional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={300} rows={3} className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white resize-none focus:outline-none focus:border-purple-500" placeholder="Contales tu experiencia, disponibilidad, influencias..." />
            </div>
            <p className="text-[11px] text-gray-500">También le llega este mensaje por chat a quien creó la banda.</p>
            <button onClick={apply} disabled={busy} className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
              {busy && <FaSpinner className="animate-spin" />} Enviar postulación
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
