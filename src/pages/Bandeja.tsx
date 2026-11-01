// src/pages/Bandeja.tsx
import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import Mascot from '../components/Mascot'
import AnimatedBackground from '../components/AnimatedBackground'
import Toast from '../components/Toast'
import { useDialog } from '../components/DialogProvider'
import { useHiddenUsers } from '../hooks/useHiddenUsers'
import { isUserOnline } from '../hooks/useOnlineStatus'
import { ADMIN_THREAD_ID } from './AvisosAdmin'
import { RowSkeleton } from '../components/Skeleton'
import {
  FaUserFriends, FaBan, FaSearch, FaUserPlus, FaUserMinus, FaShieldAlt, FaComment,
  FaPenSquare, FaTimes, FaQuoteLeft, FaUser, FaGuitar, FaCommentDots,
} from 'react-icons/fa'

interface Conversation { userId: string; profile: any; lastMessage: any; unreadCount: number }
interface NoticeSummary { lastTitle: string; lastAt: string; unread: number }
type Tab = 'messages' | 'friends' | 'blocked'

const MESSAGES_LIMIT = 500

const timeLabel = (iso: string) => {
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(); yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer'
  if (now.getTime() - date.getTime() < 6 * 86400000) return date.toLocaleDateString('es-AR', { weekday: 'short' })
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

// Grupo de fecha para separar la lista
const dayGroup = (iso: string) => {
  if (new Date(iso).toDateString() === new Date().toDateString()) return 'Hoy'
  if ((Date.now() - new Date(iso).getTime()) / 86400000 < 7) return 'Esta semana'
  return 'Antes'
}

export default function Bandeja() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { confirm } = useDialog()
  const hiddenIds = useHiddenUsers()
  const theme = profile?.theme_color || '#a855f7'

  const [activeTab, setActiveTab] = useState<Tab>('messages')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatQuery, setNewChatQuery] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [notices, setNotices] = useState<NoticeSummary | null>(null)
  const [friends, setFriends] = useState<any[]>([])
  const [blocked, setBlocked] = useState<any[]>([])
  const reloadTimer = useRef<number | null>(null)

  const loadConversations = async () => {
    if (!user) return
    const { data: messages } = await supabase.from('messages').select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false }).limit(MESSAGES_LIMIT)
    if (!messages?.length) { setConversations([]); return }
    const otherIds = Array.from(new Set(messages.map(m => (m.sender_id === user.id ? m.receiver_id : m.sender_id))))
    const { data: profiles } = await supabase.from('profiles').select('id, display_name, username, avatar_url, avatar_color, last_seen, instruments').in('id', otherIds)
    const grouped: Record<string, Conversation> = {}
    messages.forEach(msg => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      if (!grouped[otherId]) grouped[otherId] = { userId: otherId, profile: profiles?.find(p => p.id === otherId), lastMessage: msg, unreadCount: 0 }
      if (msg.receiver_id === user.id && !msg.is_read) grouped[otherId].unreadCount += 1
    })
    setConversations(Object.values(grouped).filter(c => c.profile))
  }

  const loadNotices = async () => {
    if (!user) return
    const { data, error } = await supabase.from('system_notices').select('title, is_read, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
    if (error || !data?.length) { setNotices(null); return }
    setNotices({ lastTitle: data[0].title, lastAt: data[0].created_at, unread: data.filter(n => !n.is_read).length })
  }

  const loadPeople = async (table: 'friends' | 'blocks') => {
    if (!user) return []
    const query = table === 'friends'
      ? supabase.from('friends').select('friend_id').eq('user_id', user.id)
      : supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id)
    const { data } = await query
    const ids = (data || []).map((r: any) => r.friend_id || r.blocked_id)
    if (!ids.length) return []
    const { data: profiles } = await supabase.from('profiles').select('id, display_name, username, avatar_color, avatar_url, last_seen, instruments, localidad').in('id', ids)
    return profiles || []
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const [, , friendsList, blockedList] = await Promise.all([loadConversations(), loadNotices(), loadPeople('friends'), loadPeople('blocks')])
      setFriends(friendsList)
      setBlocked(blockedList)
    } catch (error) {
      console.error('Error al cargar bandeja:', error)
      setToast({ message: 'Error al cargar la bandeja', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const scheduleReload = () => {
    if (reloadTimer.current) window.clearTimeout(reloadTimer.current)
    reloadTimer.current = window.setTimeout(() => { loadConversations(); loadNotices() }, 400)
  }

  useEffect(() => {
    if (!user) return
    loadAll()
    const channel = supabase.channel(`bandeja-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, scheduleReload)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_notices', filter: `user_id=eq.${user.id}` }, scheduleReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends', filter: `user_id=eq.${user.id}` }, async () => setFriends(await loadPeople('friends')))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks', filter: `blocker_id=eq.${user.id}` }, async () => setBlocked(await loadPeople('blocks')))
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
      if (reloadTimer.current) window.clearTimeout(reloadTimer.current)
    }
  }, [user])

  const handleRemoveFriend = async (friend: any) => {
    if (!(await confirm({ title: `¿Quitar a ${friend.display_name} de tus amigos?`, message: 'Podés volver a agregarlo desde su perfil.', confirmLabel: 'Quitar', danger: true }))) return
    const { error } = await supabase.from('friends').delete().eq('user_id', user?.id).eq('friend_id', friend.id)
    if (error) { setToast({ message: 'Error: ' + error.message, type: 'error' }); return }
    setFriends(prev => prev.filter(f => f.id !== friend.id))
    setToast({ message: 'Amigo quitado', type: 'info' })
  }

  const handleUnblock = async (person: any) => {
    if (!(await confirm({ title: `¿Desbloquear a ${person.display_name}?`, message: 'Van a poder volver a escribirse y verse en el feed.', confirmLabel: 'Desbloquear' }))) return
    const { error } = await supabase.from('blocks').delete().eq('blocker_id', user?.id).eq('blocked_id', person.id)
    if (error) { setToast({ message: 'Error: ' + error.message, type: 'error' }); return }
    setBlocked(prev => prev.filter(b => b.id !== person.id))
    setToast({ message: 'Usuario desbloqueado', type: 'success' })
  }

  // ---------- Datos derivados ----------
  const q = searchQuery.toLowerCase().trim()
  const matches = (p: any) => !q || p?.display_name?.toLowerCase().includes(q) || p?.username?.toLowerCase().includes(q)
  const visibleConversations = conversations.filter(c => !hiddenIds.includes(c.userId))
  const filteredConversations = visibleConversations.filter(c => (!onlyUnread || c.unreadCount > 0) && (matches(c.profile) || c.lastMessage?.content?.toLowerCase().includes(q)))
  const filteredFriends = friends.filter(matches)
  const filteredBlocked = blocked.filter(matches)
  const unreadChats = visibleConversations.filter(c => c.unreadCount > 0).length
  const totalUnread = visibleConversations.reduce((sum, c) => sum + c.unreadCount, 0) + (notices?.unread || 0)
  const showNotices = !!notices && (!onlyUnread || notices.unread > 0) && (!q || 'administracion'.includes(q.normalize('NFD').replace(/[̀-ͯ]/g, '')))

  // Contactos (amigos + conversaciones) sin repetir, y quiénes están en línea
  const contacts = [...friends, ...visibleConversations.map(c => c.profile)].filter((p, i, arr) => p && arr.findIndex(x => x?.id === p.id) === i && !hiddenIds.includes(p.id))
  const onlineNow = contacts.filter(p => isUserOnline(p.last_seen))
  const newChatCandidates = contacts.filter(p => !newChatQuery || p.display_name?.toLowerCase().includes(newChatQuery.toLowerCase()) || p.username?.toLowerCase().includes(newChatQuery.toLowerCase()))

  const preview = (msg: any) => {
    if (msg.shared_profile_id) return <span className="inline-flex items-center gap-1"><FaUser size={10} /> Perfil compartido</span>
    if (msg.post_id) return <span className="inline-flex items-center gap-1"><FaQuoteLeft size={9} /> {msg.content}</span>
    return msg.content
  }

  const emptyState = (expression: any, title: string, text: string, action?: { label: string; onClick: () => void }) => (
    <div className="text-center py-12 bg-[#141414] border border-[#2a2a2a] rounded-2xl px-6">
      <div className="flex justify-center mb-3"><Mascot color={profile?.avatar_color || '#a855f7'} size={64} expression={expression} /></div>
      <p className="text-lg font-semibold text-gray-100">{title}</p>
      <p className="text-sm mt-1.5 text-gray-400 max-w-xs mx-auto">{text}</p>
      {action && <button onClick={action.onClick} className="mt-5 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90" style={{ backgroundColor: theme }}>{action.label}</button>}
    </div>
  )

  const tabButton = (id: Tab, icon: ReactNode, label: string, count?: number) => (
    <button
      key={id}
      onClick={() => { setActiveTab(id); setSearchQuery('') }}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === id ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
      style={activeTab === id ? { backgroundColor: theme } : undefined}
    >
      {icon} <span>{label}</span>
      {!!count && <span className={`text-[11px] px-1.5 rounded-full ${activeTab === id ? 'bg-black/25' : 'bg-[#2a2a2a]'}`}>{count}</span>}
    </button>
  )

  let lastGroup = ''

  return (
    <div className="min-h-screen relative text-gray-200 font-sans pb-24">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <main className="max-w-3xl mx-auto w-full px-4 pt-10 pb-4">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-3xl text-white">Mensajes</h1>
            <p className="text-sm text-gray-400 mt-1">
              {totalUnread > 0 ? <span className="text-white font-semibold">{totalUnread} sin leer</span> : 'Estás al día'}
              {onlineNow.length > 0 && <> · <span className="text-green-400">{onlineNow.length} en línea</span></>}
            </p>
          </div>
          <button onClick={() => setShowNewChat(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg hover:opacity-90 flex-shrink-0" style={{ backgroundColor: theme }}>
            <FaPenSquare /> <span className="hidden sm:inline">Nuevo mensaje</span>
          </button>
        </div>

        {/* En línea ahora */}
        {onlineNow.length > 0 && activeTab === 'messages' && (
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">En línea ahora</p>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
              {onlineNow.map(p => (
                <button key={p.id} onClick={() => navigate(`/chat/${p.id}`)} className="flex flex-col items-center gap-1.5 w-16 flex-shrink-0">
                  <div className="p-0.5 rounded-full" style={{ background: `linear-gradient(135deg, ${theme}, #22c55e)` }}>
                    <div className="p-0.5 rounded-full bg-[#0f0f0f]"><Avatar url={p.avatar_url || null} name={p.display_name} color={p.avatar_color || '#333'} size={52} isOnline /></div>
                  </div>
                  <span className="text-[11px] text-gray-200 truncate w-full text-center">{p.display_name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pestañas */}
        <div className="flex gap-1 p-1 mb-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
          {tabButton('messages', <FaCommentDots size={13} />, 'Chats', unreadChats + (notices?.unread ? 1 : 0))}
          {tabButton('friends', <FaUserFriends size={13} />, 'Amigos', friends.length)}
          {tabButton('blocked', <FaBan size={12} />, 'Bloqueados')}
        </div>

        {/* Buscador + filtro */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'messages' ? 'Buscar en tus chats...' : activeTab === 'friends' ? 'Buscar amigos...' : 'Buscar bloqueados...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-10 pr-9 bg-[#141414] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 placeholder:text-gray-500"
            />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label="Borrar búsqueda"><FaTimes size={12} /></button>}
          </div>
          {activeTab === 'messages' && (
            <button onClick={() => setOnlyUnread(!onlyUnread)} className={`px-3.5 rounded-xl border text-xs font-semibold flex-shrink-0 transition-colors ${onlyUnread ? 'text-white border-transparent' : 'bg-[#141414] border-[#2a2a2a] text-gray-300'}`} style={onlyUnread ? { backgroundColor: theme } : undefined}>
              No leídos
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3, 4].map(i => <RowSkeleton key={i} />)}</div>
        ) : (
          <div className="space-y-1.5">
            {/* ---------- Chats ---------- */}
            {activeTab === 'messages' && (
              <>
                {showNotices && (
                  <button onClick={() => navigate(`/chat/${ADMIN_THREAD_ID}`)} className="w-full flex items-center gap-3 p-3 mb-2 rounded-2xl bg-gradient-to-r from-amber-950/40 to-[#141414] border border-amber-700/40 hover:border-amber-500/60 transition-all text-left">
                    <div className="w-12 h-12 rounded-full bg-amber-900/40 border border-amber-600/50 flex items-center justify-center text-amber-300 flex-shrink-0"><FaShieldAlt size={19} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <h3 className="text-white font-semibold truncate flex items-center gap-2">Administración <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 uppercase tracking-wider">Oficial</span></h3>
                        <span className="text-xs text-gray-400 flex-shrink-0">{timeLabel(notices!.lastAt)}</span>
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${notices!.unread ? 'text-white font-medium' : 'text-gray-400'}`}>{notices!.lastTitle}</p>
                    </div>
                    {notices!.unread > 0 && <span className="bg-amber-500 text-black text-xs font-bold rounded-full min-w-[22px] h-[22px] px-1 flex items-center justify-center flex-shrink-0">{notices!.unread}</span>}
                  </button>
                )}

                {filteredConversations.length === 0 && !showNotices
                  ? (q || onlyUnread
                      ? emptyState('pensativo', 'No hay resultados', onlyUnread ? 'No tenés mensajes sin leer. ¡Estás al día!' : 'Probá con otro nombre o palabra.')
                      : emptyState('feliz', 'Todavía no tenés chats', 'Escribile a alguien desde su publicación o su perfil y la conversación aparece acá.', { label: 'Buscar músicos', onClick: () => navigate('/home') }))
                  : filteredConversations.map(conv => {
                      const isMine = conv.lastMessage.sender_id === user?.id
                      const unread = conv.unreadCount > 0
                      const group = dayGroup(conv.lastMessage.created_at)
                      const header = group !== lastGroup ? group : null
                      lastGroup = group
                      return (
                        <div key={conv.userId}>
                          {header && <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 pt-3 pb-1.5 px-1">{header}</p>}
                          <button onClick={() => navigate(`/chat/${conv.userId}`)} className={`relative w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left overflow-hidden ${unread ? 'bg-[#1c1c1c]' : 'hover:bg-[#161616]'}`}>
                            {unread && <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full" style={{ backgroundColor: theme }} />}
                            <Avatar url={conv.profile.avatar_url || null} name={conv.profile.display_name} color={conv.profile.avatar_color || '#333'} size={52} isOnline={isUserOnline(conv.profile.last_seen)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline gap-2">
                                <h3 className={`truncate ${unread ? 'text-white font-bold' : 'text-gray-100 font-semibold'}`}>{conv.profile.display_name}</h3>
                                <span className={`text-xs flex-shrink-0 ${unread ? 'font-semibold' : 'text-gray-500'}`} style={unread ? { color: theme } : undefined}>{timeLabel(conv.lastMessage.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className={`text-sm truncate flex-1 ${unread ? 'text-gray-100' : 'text-gray-400'}`}>
                                  {isMine && <span className={conv.lastMessage.is_read ? 'text-cyan-400' : 'text-gray-500'}>{conv.lastMessage.is_read ? '✓✓ ' : '✓ '}</span>}
                                  {isMine ? 'Vos: ' : ''}{preview(conv.lastMessage)}
                                </p>
                                {unread && <span className="text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme }}>{conv.unreadCount > 9 ? '9+' : conv.unreadCount}</span>}
                              </div>
                            </div>
                          </button>
                        </div>
                      )
                    })}
              </>
            )}

            {/* ---------- Amigos ---------- */}
            {activeTab === 'friends' && (
              filteredFriends.length === 0
                ? emptyState('normal', q ? 'No se encontraron amigos' : 'Todavía no tenés amigos', q ? 'Probá con otro nombre.' : 'Entrá al perfil de alguien y tocá "Agregar".', q ? undefined : { label: 'Buscar músicos', onClick: () => navigate('/home') })
                : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredFriends.map(friend => (
                      <div key={friend.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#141414] border border-[#2a2a2a]">
                        <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => navigate(`/perfil/${friend.id}`)}>
                          <Avatar url={friend.avatar_url || null} name={friend.display_name} color={friend.avatar_color || '#333'} size={46} isOnline={isUserOnline(friend.last_seen)} />
                          <div className="min-w-0">
                            <p className="text-white font-semibold truncate">{friend.display_name}</p>
                            <p className="text-gray-400 text-xs truncate flex items-center gap-1"><FaGuitar size={9} /> {friend.instruments?.[0]?.name || 'Músico'}{friend.localidad ? ` · ${friend.localidad}` : ''}</p>
                          </div>
                        </button>
                        <button onClick={() => navigate(`/chat/${friend.id}`)} className="p-2.5 rounded-xl text-white flex-shrink-0 hover:opacity-90" style={{ backgroundColor: theme }} aria-label={`Escribirle a ${friend.display_name}`}><FaComment size={13} /></button>
                        <button onClick={() => handleRemoveFriend(friend)} className="p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-900/20 flex-shrink-0" title="Quitar de amigos" aria-label={`Quitar a ${friend.display_name} de amigos`}><FaUserMinus size={13} /></button>
                      </div>
                    ))}
                  </div>
                )
            )}

            {/* ---------- Bloqueados ---------- */}
            {activeTab === 'blocked' && (
              filteredBlocked.length === 0
                ? emptyState('feliz', q ? 'No se encontraron bloqueados' : 'No bloqueaste a nadie', q ? 'Probá con otro nombre.' : 'Si alguien te molesta, podés bloquearlo desde su perfil o desde el chat.')
                : filteredBlocked.map(person => (
                    <div key={person.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#141414] border border-red-900/30">
                      <Avatar url={person.avatar_url || null} name={person.display_name} color={person.avatar_color || '#333'} size={44} />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 font-semibold truncate">{person.display_name}</p>
                        <p className="text-gray-400 text-xs truncate">@{person.username}</p>
                      </div>
                      <button onClick={() => handleUnblock(person)} className="text-green-400 hover:text-green-300 px-3 py-2 hover:bg-green-900/20 rounded-xl flex-shrink-0 text-sm font-semibold flex items-center gap-1.5"><FaUserPlus size={13} /> Desbloquear</button>
                    </div>
                  ))
            )}
          </div>
        )}
      </main>

      {/* Nuevo mensaje */}
      {showNewChat && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="new-chat-title">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNewChat(false)} />
          <div className="relative w-full sm:max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <h3 id="new-chat-title" className="text-white font-semibold">Nuevo mensaje</h3>
              <button onClick={() => setShowNewChat(false)} className="p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><FaTimes /></button>
            </div>
            <div className="p-4 pb-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                <input autoFocus value={newChatQuery} onChange={e => setNewChatQuery(e.target.value)} placeholder="Buscar entre tus contactos..." className="w-full p-2.5 pl-9 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 placeholder:text-gray-500" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-1">
              {newChatCandidates.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">{contacts.length ? 'No hay resultados.' : 'Todavía no tenés contactos.'}</p>
              ) : newChatCandidates.map(p => (
                <button key={p.id} onClick={() => { setShowNewChat(false); navigate(`/chat/${p.id}`) }} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#222] text-left">
                  <Avatar url={p.avatar_url || null} name={p.display_name} color={p.avatar_color || '#333'} size={38} isOnline={isUserOnline(p.last_seen)} />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{p.display_name}</p>
                    <p className="text-xs text-gray-400 truncate">@{p.username}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-[#2a2a2a]">
              <button onClick={() => { setShowNewChat(false); navigate('/home') }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-white text-sm"><FaSearch size={11} /> Buscar otros músicos en el directorio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
