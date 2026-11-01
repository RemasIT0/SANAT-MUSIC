// src/components/ShareModal.tsx
// Compartir un perfil o una publicación: dentro de SANAT (como tarjeta en un
// chat) o afuera (WhatsApp y demás, con el menú de compartir del celular).
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import { FaTimes, FaShareAlt, FaLink, FaCheck, FaPaperPlane, FaSpinner, FaSearch } from 'react-icons/fa'

export interface ShareTarget {
  kind: 'profile' | 'post'
  id: string            // id del perfil o de la publicación
  ownerId: string       // dueño del perfil o autor de la publicación
  label: string         // nombre del perfil o primeras palabras del post
}

// Traduce los errores del envío (antispam, bloqueos)
export const friendlySendError = (message: string) => {
  if (/ANTISPAM:/.test(message)) return message.replace(/^.*ANTISPAM:\s*/, '')
  if (/row-level security|policy/i.test(message)) return 'No se pudo enviar: hay un bloqueo entre ustedes.'
  return 'No se pudo enviar. Revisá tu conexión.'
}

export default function ShareModal({ target, onClose }: { target: ShareTarget; onClose: () => void }) {
  const { user } = useAuth()
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())
  const [sendingTo, setSendingTo] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // /p/ arma la vista previa con foto y nombre al pegarlo en WhatsApp
  const link = `${window.location.origin}/p/${target.ownerId}`

  useEffect(() => {
    if (!user) return
    const load = async () => {
      // Conversaciones recientes + amigos
      const [{ data: recent }, { data: friends }] = await Promise.all([
        supabase.from('messages').select('sender_id, receiver_id').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(200),
        supabase.from('friends').select('friend_id').eq('user_id', user.id),
      ])
      const ids: string[] = []
      recent?.forEach(m => { const other = m.sender_id === user.id ? m.receiver_id : m.sender_id; if (!ids.includes(other)) ids.push(other) })
      friends?.forEach(f => { if (!ids.includes(f.friend_id)) ids.push(f.friend_id) })
      const candidates = ids.filter(id => id !== target.ownerId || target.kind === 'post').slice(0, 30)
      if (!candidates.length) { setLoading(false); return }
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, username, avatar_url, avatar_color').in('id', candidates)
      setPeople(candidates.map(id => profiles?.find(p => p.id === id)).filter(Boolean))
      setLoading(false)
    }
    load()
  }, [user])

  const sendTo = async (person: any) => {
    if (!user) return
    setSendingTo(person.id)
    setError('')
    const base = { sender_id: user.id, receiver_id: person.id }
    let result = target.kind === 'profile'
      ? await supabase.from('messages').insert({ ...base, content: `Te comparto el perfil de ${target.label}`, shared_profile_id: target.id })
      : await supabase.from('messages').insert({ ...base, content: 'Mirá esta publicación', post_id: target.id })
    // Si la base todavía no tiene la columna para compartir perfiles, mandar el link
    if (result.error && /shared_profile_id/.test(result.error.message)) {
      result = await supabase.from('messages').insert({ ...base, content: `Te comparto el perfil de ${target.label}: ${link}` })
    }
    setSendingTo(null)
    if (result.error) { setError(friendlySendError(result.error.message)); return }
    setSentTo(prev => new Set(prev).add(person.id))
  }

  const shareOutside = async () => {
    const text = target.kind === 'profile' ? `Mirá el perfil de ${target.label} en SANAT` : `Mirá esta publicación en SANAT: "${target.label}"`
    if (navigator.share) {
      try { await navigator.share({ title: 'SANAT', text, url: link }) } catch { /* cancelado */ }
    } else {
      copyLink()
    }
  }

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setError('No se pudo copiar el link') }
  }

  const q = query.toLowerCase().trim()
  const filtered = people.filter(p => !q || p.display_name?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q))

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-[slideUp_0.25s_ease-out]">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <h3 id="share-title" className="text-white font-semibold">{target.kind === 'profile' ? 'Compartir perfil' : 'Compartir publicación'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><FaTimes /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 border-b border-[#2a2a2a]">
          <button onClick={shareOutside} className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-semibold"><FaShareAlt size={13} /> WhatsApp y más</button>
          <button onClick={copyLink} className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white text-sm font-semibold">{copied ? <><FaCheck className="text-green-400" /> Copiado</> : <><FaLink size={12} /> Copiar link</>}</button>
        </div>

        <div className="p-4 pb-2">
          <p className="text-xs text-gray-400 mb-2">Mandalo por mensaje en SANAT</p>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar..." className="w-full p-2.5 pl-9 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-500" />
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
          {loading ? (
            <div className="flex justify-center py-6"><FaSpinner className="animate-spin text-purple-400" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">{people.length ? 'No hay resultados.' : 'Todavía no tenés conversaciones ni amigos para compartir.'}</p>
          ) : filtered.map(person => (
            <div key={person.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#222]">
              <Avatar url={person.avatar_url} name={person.display_name} color={person.avatar_color || '#333'} size={38} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{person.display_name}</p>
                <p className="text-xs text-gray-400 truncate">@{person.username}</p>
              </div>
              <button
                onClick={() => sendTo(person)}
                disabled={sentTo.has(person.id) || sendingTo === person.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 ${sentTo.has(person.id) ? 'bg-green-900/40 text-green-300' : 'bg-purple-700 hover:bg-purple-600 text-white'}`}
              >
                {sendingTo === person.id ? <FaSpinner className="animate-spin" /> : sentTo.has(person.id) ? <><FaCheck size={10} /> Enviado</> : <><FaPaperPlane size={10} /> Enviar</>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
