// src/components/BandInviteModal.tsx
// Invitar perfiles a una banda: se buscan por nombre o @usuario.
// La persona invitada acepta o rechaza desde el perfil de la banda.
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import { friendlySendError } from './ShareModal'
import { FaTimes, FaSearch, FaSpinner, FaUserPlus, FaCheck } from 'react-icons/fa'

interface Props {
  band: { id: string; name: string; looking_for: string[] }
  memberIds: string[]          // ya están en la banda (activos, pendientes o invitados)
  onClose: () => void
  onInvited: () => void
}

export default function BandInviteModal({ band, memberIds, onClose, onInvited }: Props) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [instrument, setInstrument] = useState(band.looking_for[0] || '')
  const [sendingTo, setSendingTo] = useState<string | null>(null)
  const [invited, setInvited] = useState<string[]>([])
  const [error, setError] = useState('')
  const busyRef = useRef(false)

  // Búsqueda con una pequeña espera mientras se escribe
  useEffect(() => {
    const term = query.trim().replace(/^@/, '').replace(/[%,()*]/g, '')
    if (term.length < 2) { setResults([]); return }
    setSearching(true)
    const timer = window.setTimeout(async () => {
      const { data } = await supabase.from('profiles')
        .select('id, display_name, username, avatar_url, avatar_color, instruments, localidad, is_banned')
        .or(`display_name.ilike.%${term}%,username.ilike.%${term}%`)
        .limit(15)
      setResults((data || []).filter(p => !p.is_banned && p.id !== user?.id))
      setSearching(false)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query, user])

  const invite = async (person: any) => {
    if (!user || busyRef.current) return
    busyRef.current = true
    setSendingTo(person.id)
    setError('')
    const { error } = await supabase.from('band_members').insert({
      band_id: band.id, user_id: person.id, role: 'member', status: 'invited', instrument: instrument.trim(),
    })
    if (error) {
      busyRef.current = false
      setSendingTo(null)
      setError(/duplicate|unique/i.test(error.message) ? `${person.display_name} ya está en la banda o tiene una invitación.`
        : /invitaciones/i.test(error.message) ? error.message
        : /row-level|policy|status/i.test(error.message) ? 'Falta activar las invitaciones en Supabase (SQL de la etapa 5).'
        : 'No se pudo invitar.')
      return
    }
    // Aviso por chat (si falla, la invitación igual queda hecha)
    const text = `Te invito a ${band.name}. Aceptá o rechazá acá: ${window.location.origin}/banda/${band.id}`
    const sent = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: person.id, content: text })
    if (sent.error) setError(`Invitación hecha, pero no se pudo avisar por chat: ${friendlySendError(sent.error.message)}`)
    setInvited(prev => [...prev, person.id])
    setSendingTo(null)
    busyRef.current = false
    onInvited()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] animate-[slideUp_0.25s_ease-out]">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h3 id="invite-title" className="text-white font-semibold">Invitar a {band.name}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><FaTimes /></button>
        </div>
        <div className="p-4 space-y-3 border-b border-[#2a2a2a]">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={13} />
            <input value={query} onChange={e => setQuery(e.target.value)} autoFocus placeholder="Buscar por nombre o @usuario" className="w-full pl-9 pr-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">¿Para qué instrumento? (opcional)</label>
            <input value={instrument} onChange={e => setInstrument(e.target.value)} maxLength={40} list="invite-instruments" placeholder="Ej: Bajo" className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-500" />
            <datalist id="invite-instruments">{band.looking_for.map(i => <option key={i} value={i} />)}</datalist>
          </div>
          {error && <p className="text-xs text-amber-300">{error}</p>}
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="text-sm text-gray-400 text-center py-8 px-4">Escribí al menos 2 letras para buscar músicos.</p>
          ) : searching ? (
            <div className="flex justify-center py-8 text-gray-400"><FaSpinner className="animate-spin" /></div>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No encontramos a nadie con ese nombre.</p>
          ) : results.map(person => {
            const already = memberIds.includes(person.id)
            const done = invited.includes(person.id)
            return (
              <div key={person.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#222]">
                <Avatar url={person.avatar_url || null} name={person.display_name} color={person.avatar_color || '#333'} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-semibold truncate">{person.display_name}</p>
                  <p className="text-xs text-gray-400 truncate">@{person.username}{person.instruments?.[0]?.name ? ` · ${person.instruments[0].name}` : ''}{person.localidad ? ` · ${person.localidad}` : ''}</p>
                </div>
                {already || done ? (
                  <span className="flex items-center gap-1 text-xs text-gray-400 px-2"><FaCheck size={10} /> {done ? 'Invitado' : 'Ya está'}</span>
                ) : (
                  <button onClick={() => invite(person)} disabled={!!sendingTo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold disabled:opacity-50">
                    {sendingTo === person.id ? <FaSpinner className="animate-spin" size={10} /> : <FaUserPlus size={10} />} Invitar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
