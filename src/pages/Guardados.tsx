// src/pages/Guardados.tsx
// Publicaciones guardadas + historial de coincidencias ("Te buscan").
import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import Toast from '../components/Toast'
import AnimatedBackground from '../components/AnimatedBackground'
import { PostSkeleton } from '../components/Skeleton'
import { FaBookmark, FaRegBookmark, FaBullhorn, FaComment, FaUser, FaTrash, FaGuitar, FaBullseye } from 'react-icons/fa'

type Tab = 'guardadas' | 'coincidencias'

const timeAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

export default function Guardados() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'coincidencias' ? 'coincidencias' : 'guardadas'
  const [saved, setSaved] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [missingTables, setMissingTables] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const since = new Date(Date.now() - 60 * 86400000).toISOString()
    const [savedRes, alertsRes] = await Promise.all([
      supabase.from('saved_posts').select('post_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('match_alerts').select('id, post_id, poster_id, kind, is_read, created_at').eq('user_id', user.id).gte('created_at', since).order('created_at', { ascending: false }),
    ])
    if (savedRes.error) setMissingTables(true)
    const postIds = [...new Set([...(savedRes.data || []).map(r => r.post_id), ...(alertsRes.data || []).map(a => a.post_id)])]
    const { data: posts } = postIds.length
      ? await supabase.from('posts').select('id, user_id, content, intention, genres, looking_for, updated_at').in('id', postIds)
      : { data: [] as any[] }
    const authorIds = [...new Set((posts || []).map(p => p.user_id))]
    const { data: authors } = authorIds.length
      ? await supabase.from('profiles').select('id, display_name, username, avatar_url, avatar_color, instruments, localidad').in('id', authorIds)
      : { data: [] as any[] }
    const withAuthor = (postId: string) => {
      const post = posts?.find(p => p.id === postId)
      return post ? { ...post, author: authors?.find(a => a.id === post.user_id) } : null
    }
    setSaved((savedRes.data || []).map(r => withAuthor(r.post_id)).filter(Boolean))
    setAlerts((alertsRes.data || []).map(a => ({ ...a, post: withAuthor(a.post_id) })).filter(a => a.post))
    setSavedIds(new Set((savedRes.data || []).map(r => r.post_id)))
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const toggleSave = async (postId: string) => {
    if (!user) return
    const isSaved = savedIds.has(postId)
    const { error } = isSaved
      ? await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId)
      : await supabase.from('saved_posts').insert({ user_id: user.id, post_id: postId })
    if (error) { setToast({ message: 'No se pudo guardar', type: 'error' }); return }
    setToast({ message: isSaved ? 'Quitada de guardados' : 'Publicación guardada', type: 'success' })
    load()
  }

  const deleteAlert = async (alertId: string) => {
    await supabase.from('match_alerts').delete().eq('id', alertId)
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const PostCard = ({ post, children }: { post: any; children?: ReactNode }) => (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
      <button onClick={() => navigate(`/perfil/${post.user_id}`)} className="flex items-center gap-3 mb-2 text-left">
        <Avatar url={post.author?.avatar_url || null} name={post.author?.display_name || '?'} color={post.author?.avatar_color || '#333'} size={42} />
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{post.author?.display_name || 'Usuario'}</p>
          <p className="text-xs text-gray-400 truncate flex items-center gap-1"><FaGuitar size={9} /> {post.author?.instruments?.[0]?.name || 'Músico'}{post.author?.localidad ? ` · ${post.author.localidad}` : ''}</p>
        </div>
      </button>
      <p className="text-sm text-gray-200 whitespace-pre-wrap break-words line-clamp-4">{post.content}</p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {post.intention && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/30 border border-purple-700/40 text-purple-200 flex items-center gap-1"><FaBullseye size={8} /> {post.intention}</span>}
        {(post.looking_for?.length || 0) > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/30 border border-amber-600/50 text-amber-200">Busca: {post.looking_for.join(', ')}</span>}
      </div>
      {children}
    </div>
  )

  const actionBtn = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors'

  return (
    <div className="min-h-screen relative text-gray-200 pb-24">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <main className="max-w-3xl mx-auto px-4 pt-10 pb-4 space-y-4">
        <h1 className="text-2xl text-white flex items-center gap-3"><FaBookmark className="text-purple-400" /> Guardados</h1>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#141414] border border-[#2a2a2a]">
          {([['guardadas', 'Publicaciones', saved.length], ['coincidencias', 'Coincidencias', alerts.length]] as const).map(([id, label, count]) => (
            <button key={id} onClick={() => setParams(id === 'guardadas' ? {} : { tab: id })} className={`py-2 rounded-lg text-sm font-semibold transition-colors ${tab === id ? 'bg-purple-700 text-white' : 'text-gray-300 hover:text-white'}`}>
              {label} {count > 0 && <span className="text-xs opacity-80">({count})</span>}
            </button>
          ))}
        </div>

        {missingTables && <p className="text-sm text-amber-200 bg-amber-900/20 border border-amber-700/40 rounded-lg p-3">Falta activar los guardados: corré el SQL de "Guardados" en Supabase.</p>}

        {loading ? (
          <div className="space-y-3"><PostSkeleton /><PostSkeleton /></div>
        ) : tab === 'guardadas' ? (
          saved.length === 0 ? (
            <div className="text-center py-14 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4">
              <FaRegBookmark className="text-4xl mx-auto mb-3 text-gray-500" />
              <p className="text-gray-200 font-semibold">Todavía no guardaste publicaciones</p>
              <p className="text-sm text-gray-400 mt-1">Tocá el ícono de guardar en cualquier publicación del feed para tenerla acá.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {saved.map(post => (
                <PostCard key={post.id} post={post}>
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#2a2a2a]">
                    <button onClick={() => navigate(`/chat/${post.user_id}?post=${post.id}`)} className={`${actionBtn} bg-purple-700 hover:bg-purple-600 text-white`}><FaComment size={10} /> Escribir</button>
                    <button onClick={() => navigate(`/perfil/${post.user_id}`)} className={`${actionBtn} bg-[#2a2a2a] hover:bg-[#333] text-white`}><FaUser size={10} /> Perfil</button>
                    <button onClick={() => toggleSave(post.id)} className={`${actionBtn} ml-auto text-gray-300 hover:text-red-300`}><FaTrash size={10} /> Quitar</button>
                  </div>
                </PostCard>
              ))}
            </div>
          )
        ) : alerts.length === 0 ? (
          <div className="text-center py-14 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4">
            <FaBullhorn className="text-4xl mx-auto mb-3 text-gray-500" />
            <p className="text-gray-200 font-semibold">No tenés coincidencias todavía</p>
            <p className="text-sm text-gray-400 mt-1">Cuando alguien de tu zona busque lo que tocás (o toque lo que buscás), aparece acá.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <PostCard key={alert.id} post={alert.post}>
                <p className="text-[11px] text-amber-300 mt-2">{alert.kind === 'te_buscan' ? 'Te buscan' : 'Toca lo que buscás'} · {timeAgo(alert.created_at)}</p>
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#2a2a2a]">
                  <button onClick={() => navigate(`/chat/${alert.poster_id}?post=${alert.post_id}`)} className={`${actionBtn} bg-amber-500 hover:bg-amber-400 text-black`}><FaComment size={10} /> Escribirle</button>
                  <button onClick={() => toggleSave(alert.post_id)} className={`${actionBtn} bg-[#2a2a2a] hover:bg-[#333] text-white`}>{savedIds.has(alert.post_id) ? <><FaBookmark size={10} /> Guardada</> : <><FaRegBookmark size={10} /> Guardar</>}</button>
                  <button onClick={() => deleteAlert(alert.id)} className={`${actionBtn} ml-auto text-gray-300 hover:text-red-300`}><FaTrash size={10} /> Borrar</button>
                </div>
              </PostCard>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
