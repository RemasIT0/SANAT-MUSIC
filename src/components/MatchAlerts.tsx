// src/components/MatchAlerts.tsx
// "Te buscan": publicaciones que coinciden con tus instrumentos y tu zona.
// Las genera la base de datos (trigger notify_post_matches) al publicar.
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Avatar from './Avatar'
import { FaBullhorn, FaTimes, FaComment, FaGuitar, FaBookmark, FaRegBookmark } from 'react-icons/fa'
import { useSavedPosts } from '../hooks/useSavedPosts'

interface Alert {
  id: string
  post_id: string
  poster_id: string
  kind: 'te_buscan' | 'para_vos'
  post?: { content: string; looking_for?: string[]; intention?: string }
  poster?: { display_name: string; avatar_url: string | null; avatar_color: string }
}

export default function MatchAlerts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const { savedIds, toggleSave, available: canSave } = useSavedPosts()

  const load = async () => {
    if (!user) return
    const { data, error } = await supabase.from('match_alerts')
      .select('id, post_id, poster_id, kind').eq('user_id', user.id).eq('is_read', false)
      .order('created_at', { ascending: false }).limit(5)
    if (error || !data?.length) { setAlerts([]); return }
    const [{ data: posts }, { data: posters }] = await Promise.all([
      supabase.from('posts').select('id, content, looking_for, intention').in('id', data.map(a => a.post_id)),
      supabase.from('profiles').select('id, display_name, avatar_url, avatar_color').in('id', data.map(a => a.poster_id)),
    ])
    setAlerts(data
      .map(a => ({ ...a, post: posts?.find(p => p.id === a.post_id), poster: posters?.find(p => p.id === a.poster_id) }) as Alert)
      .filter(a => a.post && a.poster))
  }

  useEffect(() => {
    if (!user) return
    load()
    const channel = supabase.channel(`match-alerts-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_alerts', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const dismiss = async (alert: Alert) => {
    setAlerts(prev => prev.filter(a => a.id !== alert.id))
    await supabase.from('match_alerts').update({ is_read: true }).eq('id', alert.id)
  }

  const reply = async (alert: Alert) => {
    await supabase.from('match_alerts').update({ is_read: true }).eq('id', alert.id)
    navigate(`/chat/${alert.poster_id}?post=${alert.post_id}`)
  }

  if (!alerts.length) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2"><FaBullhorn /> {alerts.length === 1 ? 'Hay una coincidencia para vos' : `Hay ${alerts.length} coincidencias para vos`}</p>
        <button onClick={() => navigate('/guardados?tab=coincidencias')} className="text-xs text-amber-200 hover:text-white underline flex-shrink-0">Ver todas</button>
      </div>
      {alerts.map(alert => {
        const wanted = alert.post?.looking_for || []
        const title = alert.kind === 'te_buscan'
          ? `${alert.poster!.display_name} busca ${wanted.length ? wanted.join(', ').toLowerCase() : 'músicos'}`
          : `${alert.poster!.display_name} toca lo que buscás`
        return (
          <div key={alert.id} className="relative flex gap-3 p-3 pr-10 rounded-xl bg-gradient-to-r from-amber-950/50 to-[#1a1a1a] border border-amber-700/50 animate-[fadeIn_0.3s_ease-out]">
            <Avatar url={alert.poster!.avatar_url} name={alert.poster!.display_name} color={alert.poster!.avatar_color || '#333'} size={44} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-semibold flex items-center gap-1.5"><FaGuitar className="text-amber-300 flex-shrink-0" size={12} /> <span className="truncate">{title}</span></p>
              <p className="text-xs text-gray-300 line-clamp-2 mt-0.5">{alert.post!.content}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => reply(alert)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold"><FaComment size={10} /> Escribirle</button>
                <button onClick={() => navigate(`/perfil/${alert.poster_id}`)} className="px-3 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white text-xs">Ver perfil</button>
                {canSave && (
                  <button onClick={() => toggleSave(alert.post_id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white text-xs" aria-label="Guardar publicación">
                    {savedIds.has(alert.post_id) ? <><FaBookmark size={10} className="text-amber-300" /> Guardada</> : <><FaRegBookmark size={10} /> Guardar</>}
                  </button>
                )}
              </div>
            </div>
            <button onClick={() => dismiss(alert)} className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white" aria-label="Descartar"><FaTimes size={12} /></button>
          </div>
        )
      })}
    </div>
  )
}
