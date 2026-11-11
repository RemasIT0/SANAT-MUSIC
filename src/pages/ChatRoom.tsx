// src/pages/ChatRoom.tsx
import { useState, useEffect, useRef, useCallback, Fragment, type CSSProperties } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { type Profile } from '../types'
import Avatar from '../components/Avatar'
import Mascot from '../components/Mascot'
import Toast from '../components/Toast'
import AnimatedBackground from '../components/AnimatedBackground'
import { useDialog } from '../components/DialogProvider'
import { isUserOnline, formatLastSeen } from '../hooks/useOnlineStatus'
import {
  FaArrowLeft, FaPaperPlane, FaSpinner, FaQuoteLeft, FaGuitar, FaMapMarkerAlt, FaEllipsisV,
  FaUser, FaBan, FaCopy, FaTrash, FaArrowDown, FaExternalLinkAlt,
  FaFire, FaHandRock, FaHeart, FaLaughSquint, FaThumbsUp, FaChevronRight,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'
import { ChatSkeleton } from '../components/Skeleton'
import { friendlySendError } from '../components/ShareModal'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  read_at?: string | null
  post_id: string | null
  post_content?: string | null
  post_user_id?: string | null
  shared_profile_id?: string | null
  created_at: string
}

// Reacciones disponibles (las mismas que acepta la base)
const REACTIONS: Record<string, { icon: IconType; color: string; label: string }> = {
  fuego: { icon: FaFire, color: '#f97316', label: 'Fuego' },
  rock: { icon: FaHandRock, color: '#a855f7', label: 'Rock' },
  corazon: { icon: FaHeart, color: '#ef4444', label: 'Me encanta' },
  risa: { icon: FaLaughSquint, color: '#facc15', label: 'Risa' },
  genial: { icon: FaThumbsUp, color: '#22d3ee', label: 'Genial' },
}

interface Reaction { message_id: string; user_id: string; reaction: string }

const PAGE_SIZE = 150
const MAX_LENGTH = 1000

const dayLabel = (iso: string) => {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Hoy'
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer'
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const renderWithLinks = (text: string) =>
  text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-cyan-300 break-all inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>{part}<FaExternalLinkAlt size={9} /></a>
      : <Fragment key={i}>{part}</Fragment>
  )

// Cada mensaje es un sticker pegado un poquito torcido (siempre igual para el mismo mensaje)
function stickerTilt(id: string, mine: boolean) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  const tilt = ((Math.abs(hash) % 13) / 10) + 0.3 // entre 0.3 y 1.5 grados
  return mine ? tilt : -tilt
}

export default function ChatRoom() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  const { confirm } = useDialog()

  const initialPostId = new URLSearchParams(location.search).get('post')

  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [hasOlder, setHasOlder] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [replyToPost, setReplyToPost] = useState<any>(null)
  const [showUserInfo, setShowUserInfo] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const [blockState, setBlockState] = useState<'none' | 'byMe' | 'byThem'>('none')
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [showNewBelow, setShowNewBelow] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({})
  const [sharedProfiles, setSharedProfiles] = useState<Record<string, any>>({})
  const longPressRef = useRef<number | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<number | null>(null)
  const lastTypingSentRef = useRef(0)
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const myThemeColor = profile?.theme_color || '#a855f7'
  const otherThemeColor = otherProfile?.theme_color || '#a855f7'
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  // ---------- Scroll ----------
  const isNearBottom = () => {
    const el = scrollRef.current
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }
  const scrollToBottom = (smooth = true) => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    setShowNewBelow(false)
  }

  // ---------- Marcar como leídos ----------
  const markAsRead = useCallback(async () => {
    if (!user || !userId || document.visibilityState !== 'visible') return
    await supabase.from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('sender_id', userId).eq('receiver_id', user.id).eq('is_read', false)
  }, [user, userId])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') markAsRead() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [markAsRead])

  // ---------- Perfil, bloqueos y publicación citada ----------
  useEffect(() => {
    if (!userId || !user) return
    const load = async () => {
      const [{ data: other }, { data: blocks }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('blocks').select('blocker_id, blocked_id')
          .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${user.id})`),
      ])
      if (!other) { setNotFound(true); return }
      setOtherProfile(other)
      if (blocks?.some(b => b.blocker_id === user.id)) setBlockState('byMe')
      else if (blocks?.length) setBlockState('byThem')
    }
    load()
    if (initialPostId) {
      supabase.from('posts').select('*').eq('id', initialPostId).maybeSingle().then(({ data }) => { if (data) setReplyToPost(data) })
    }
  }, [userId, user])

  // Estado "en línea" del otro, cada 30 s
  useEffect(() => {
    if (!userId) return
    const interval = setInterval(async () => {
      const { data } = await supabase.from('profiles').select('last_seen').eq('id', userId).maybeSingle()
      if (data) setOtherProfile(prev => (prev ? { ...prev, last_seen: data.last_seen } : prev))
    }, 30000)
    return () => clearInterval(interval)
  }, [userId])

  // ---------- Mensajes ----------
  const withPost = (rows: any[]): Message[] => rows.map(m => ({ ...m, post_content: m.post?.content ?? m.post_content ?? null, post_user_id: m.post?.user_id ?? m.post_user_id ?? null }))

  const loadExtras = async (rows: Message[]) => {
    const ids = rows.filter(m => !m.id.startsWith('temp-')).map(m => m.id)
    if (ids.length) {
      const { data } = await supabase.from('message_reactions').select('message_id, user_id, reaction').in('message_id', ids)
      if (data) {
        setReactions(prev => {
          const next = { ...prev }
          ids.forEach(id => { next[id] = [] })
          data.forEach((r: Reaction) => { next[r.message_id] = [...(next[r.message_id] || []), r] })
          return next
        })
      }
    }
    const profileIds = [...new Set(rows.map(m => m.shared_profile_id).filter(Boolean))] as string[]
    if (profileIds.length) {
      const { data } = await supabase.from('profiles').select('id, display_name, username, avatar_url, avatar_color, instruments, localidad').in('id', profileIds)
      if (data) setSharedProfiles(prev => { const next = { ...prev }; data.forEach(pr => { next[pr.id] = pr }); return next })
    }
  }

  const toggleReaction = async (msg: Message, key: string) => {
    if (!user) return
    setActiveMessageId(null)
    const mine = reactions[msg.id]?.find(r => r.user_id === user.id)
    const previous = reactions[msg.id] || []
    const others = previous.filter(r => r.user_id !== user.id)
    const removing = mine?.reaction === key
    setReactions(prev => ({ ...prev, [msg.id]: removing ? others : [...others, { message_id: msg.id, user_id: user.id, reaction: key }] }))
    const { error } = removing
      ? await supabase.from('message_reactions').delete().eq('message_id', msg.id).eq('user_id', user.id)
      : await supabase.from('message_reactions').upsert({ message_id: msg.id, user_id: user.id, reaction: key }, { onConflict: 'message_id,user_id' })
    if (error) {
      setReactions(prev => ({ ...prev, [msg.id]: previous }))
      setToast({ message: /message_reactions/.test(error.message) ? 'Las reacciones todavía no están activadas.' : 'No se pudo reaccionar', type: 'error' })
    }
  }

  // Mantener apretado un mensaje abre sus opciones (en celular)
  const startLongPress = (msgId: string) => {
    if (longPressRef.current) window.clearTimeout(longPressRef.current)
    longPressRef.current = window.setTimeout(() => setActiveMessageId(msgId), 450)
  }
  const cancelLongPress = () => { if (longPressRef.current) window.clearTimeout(longPressRef.current) }

  const conversationFilter = `and(sender_id.eq.${user?.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user?.id})`

  useEffect(() => {
    if (!user || !userId) return
    let active = true

    const loadMessages = async () => {
      setLoadingMessages(true)
      const { data } = await supabase.from('messages')
        .select('*, post:post_id (content, user_id)')
        .or(conversationFilter)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      if (!active) return
      const rows = withPost((data || []).reverse())
      setMessages(rows)
      setHasOlder((data || []).length === PAGE_SIZE)
      setLoadingMessages(false)
      loadExtras(rows)
      requestAnimationFrame(() => scrollToBottom(false))
      markAsRead()
    }
    loadMessages()

    const addIncoming = (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        // Si es mi mensaje optimista, reemplazarlo por el real
        const tempIndex = prev.findIndex(m => m.id.startsWith('temp-') && m.sender_id === msg.sender_id && m.content === msg.content)
        if (tempIndex !== -1) { const copy = [...prev]; copy[tempIndex] = { ...msg, post_content: prev[tempIndex].post_content }; return copy }
        return [...prev, msg]
      })
    }

    const channel = supabase.channel(`chat-${user.id}-${userId}-${Math.random().toString(36).slice(2)}`)
      // Mensajes que me mandan
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, (payload) => {
        const msg = payload.new as Message
        if (msg.sender_id !== userId) return
        const nearBottom = isNearBottom()
        addIncoming({ ...msg, post_content: null })
        loadExtras([msg])
        setIsOtherTyping(false)
        if (nearBottom) requestAnimationFrame(() => scrollToBottom())
        else setShowNewBelow(true)
        markAsRead()
      })
      // Mis mensajes enviados desde otro dispositivo
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, (payload) => {
        const msg = payload.new as Message
        if (msg.receiver_id === userId) addIncoming({ ...msg, post_content: null })
      })
      // Leídos (✓✓) en vivo
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${user.id}` }, (payload) => {
        const msg = payload.new as Message
        setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, is_read: msg.is_read, read_at: msg.read_at } : m)))
      })
      // Reacciones en vivo
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, async (payload) => {
        const row = (payload.new && Object.keys(payload.new).length ? payload.new : payload.old) as Partial<Reaction>
        if (!row?.message_id) return
        const { data } = await supabase.from('message_reactions').select('message_id, user_id, reaction').eq('message_id', row.message_id)
        setReactions(prev => (row.message_id! in prev || (data && data.length) ? { ...prev, [row.message_id!]: data || [] } : prev))
      })
      // Mensajes borrados
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        const old = payload.old as { id?: string }
        if (old?.id) setMessages(prev => prev.filter(m => m.id !== old.id))
      })
      .subscribe()

    // "Escribiendo..." (canal compartido entre los dos)
    const typingChannel = supabase.channel(`typing-${[user.id, userId].sort().join('-')}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.senderId === user.id) return
        setIsOtherTyping(true)
        if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = window.setTimeout(() => setIsOtherTyping(false), 3000)
      })
      .subscribe()
    typingChannelRef.current = typingChannel

    return () => {
      active = false
      supabase.removeChannel(channel)
      supabase.removeChannel(typingChannel)
      typingChannelRef.current = null
    }
  }, [user, userId])

  const loadOlder = async () => {
    if (!messages.length) return
    setLoadingOlder(true)
    const el = scrollRef.current
    const previousHeight = el?.scrollHeight || 0
    const { data } = await supabase.from('messages')
      .select('*, post:post_id (content, user_id)')
      .or(conversationFilter)
      .lt('created_at', messages[0].created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    const older = withPost((data || []).reverse())
    setMessages(prev => [...older, ...prev])
    setHasOlder((data || []).length === PAGE_SIZE)
    loadExtras(older)
    setLoadingOlder(false)
    // Mantener la posición de lectura
    requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - previousHeight })
  }

  // ---------- Escribir y enviar ----------
  const notifyTyping = () => {
    const now = Date.now()
    if (now - lastTypingSentRef.current < 1500) return
    lastTypingSentRef.current = now
    typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { senderId: user?.id } })
  }

  const autoGrow = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  const handleSend = async () => {
    const content = newMessage.trim()
    if (!content || !user || !userId || sending || blockState !== 'none') return
    setSending(true)
    setNewMessage('')
    requestAnimationFrame(autoGrow)
    const tempId = `temp-${Date.now()}`
    setMessages(prev => [...prev, {
      id: tempId, sender_id: user.id, receiver_id: userId, content, is_read: false, read_at: null,
      post_id: replyToPost?.id || null, post_content: replyToPost?.content || null, created_at: new Date().toISOString(),
    }])
    requestAnimationFrame(() => scrollToBottom())
    try {
      const { data, error } = await supabase.from('messages')
        .insert({ sender_id: user.id, receiver_id: userId, content, post_id: replyToPost?.id || null })
        .select().single()
      if (error) throw error
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev.filter(m => m.id !== tempId)
        return prev.map(m => (m.id === tempId ? { ...data, post_content: replyToPost?.content || null } : m))
      })
      if (replyToPost) { setReplyToPost(null); navigate(`/chat/${userId}`, { replace: true }) }
    } catch (error: any) {
      console.error('Error al enviar:', error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
      setToast({ message: friendlySendError(error?.message || ''), type: 'error' })
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // En compu: Enter envía y Shift+Enter hace un salto de línea. En celular, Enter es salto de línea.
    if (e.key === 'Enter' && !e.shiftKey && !isTouch) {
      e.preventDefault()
      handleSend()
    }
  }

  // ---------- Acciones sobre mensajes ----------
  const copyMessage = async (msg: Message) => {
    try { await navigator.clipboard.writeText(msg.content); setToast({ message: 'Mensaje copiado', type: 'success' }) } catch { setToast({ message: 'No se pudo copiar', type: 'error' }) }
    setActiveMessageId(null)
  }

  const deleteMessage = async (msg: Message) => {
    setActiveMessageId(null)
    if (!(await confirm({ title: '¿Eliminar mensaje?', message: 'Se borra para los dos. No se puede deshacer.', confirmLabel: 'Eliminar', danger: true }))) return
    const { data, error } = await supabase.from('messages').delete().eq('id', msg.id).select('id')
    if (error || !data?.length) {
      setToast({ message: 'No se pudo eliminar el mensaje', type: 'error' })
      return
    }
    setMessages(prev => prev.filter(m => m.id !== msg.id))
  }

  const blockUser = async () => {
    setShowMenu(false)
    if (!user || !otherProfile) return
    if (!(await confirm({ title: `¿Bloquear a ${otherProfile.display_name}?`, message: 'No van a poder enviarse mensajes ni verse en el feed. Podés desbloquearlo desde tu Bandeja.', confirmLabel: 'Bloquear', danger: true }))) return
    const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: otherProfile.id })
    if (error) { setToast({ message: 'No se pudo bloquear: ' + error.message, type: 'error' }); return }
    setBlockState('byMe')
    setToast({ message: 'Usuario bloqueado', type: 'success' })
  }

  // ---------- Render ----------
  if (notFound) {
    return (
      <div className="h-[calc(100dvh-var(--banner-h,0px))] flex flex-col items-center justify-center gap-3 text-gray-300 bg-[#0f0f0f] px-6 text-center">
        <p>Este usuario ya no existe.</p>
        <button onClick={() => navigate('/bandeja')} className="text-cyan-400 underline">Volver a la bandeja</button>
      </div>
    )
  }

  if (!otherProfile) {
    return (
      <div className="h-[calc(100dvh-var(--banner-h,0px))] flex items-center justify-center text-gray-400 bg-[#0f0f0f]">
        <FaSpinner className="animate-spin text-3xl text-cyan-400 mr-3" />
        <span className="text-cyan-400 font-medium">Conectando al canal...</span>
      </div>
    )
  }

  const online = isUserOnline(otherProfile.last_seen)

  return (
    <div className="h-[calc(100dvh-var(--banner-h,0px))] relative text-gray-200 font-sans flex flex-col overflow-hidden bg-[#0f0f0f]">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Cabecera */}
      <header className="sticky top-0 z-30 bg-[#1a1a1a]/90 backdrop-blur-md border-b px-3 py-2.5 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)]" style={{ borderColor: otherThemeColor + '60' }}>
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/bandeja'))} className="p-2 rounded-full hover:bg-white/10 text-cyan-400" aria-label="Volver"><FaArrowLeft /></button>
        <button onClick={() => setShowUserInfo(!showUserInfo)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <Avatar url={otherProfile.avatar_url || null} name={otherProfile.display_name} color={otherProfile.avatar_color || '#333'} size={40} isOnline={online} />
          <div className="min-w-0">
            <h2 className="text-white font-semibold text-sm truncate">{otherProfile.display_name}</h2>
            <p className="text-xs truncate">
              {isOtherTyping
                ? <span className="text-cyan-400">escribiendo...</span>
                : <span className={online ? 'text-green-400' : 'text-gray-400'}>{formatLastSeen(otherProfile.last_seen)}</span>}
            </p>
          </div>
        </button>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2.5 rounded-full hover:bg-white/10 text-gray-300" aria-label="Más opciones"><FaEllipsisV /></button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-11 z-50 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
                <button onClick={() => navigate(`/perfil/${otherProfile.id}`)} className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-200 hover:bg-[#2a2a2a]"><FaUser className="text-cyan-400" /> Ver perfil</button>
                {blockState !== 'byMe' && (
                  <button onClick={blockUser} className="w-full px-4 py-3 flex items-center gap-3 text-sm text-red-300 hover:bg-red-900/20 border-t border-[#2a2a2a]"><FaBan /> Bloquear</button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {showUserInfo && (
        <div className="bg-[#1a1a1a]/95 backdrop-blur-md border-b z-20 shadow-lg animate-[slideDown_0.3s_ease-out]" style={{ borderColor: otherThemeColor + '60' }}>
          <div className="p-4 max-w-3xl mx-auto flex items-start gap-4">
            <Avatar url={otherProfile.avatar_url || null} name={otherProfile.display_name} color={otherProfile.avatar_color || '#333'} size={64} />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg">{otherProfile.display_name}</h3>
              <p className="text-cyan-400 text-sm mb-2">@{otherProfile.username}</p>
              {otherProfile.bio && <p className="text-gray-300 text-sm mb-3 line-clamp-3">{otherProfile.bio}</p>}
              <div className="flex flex-wrap gap-2 mb-3">
                {otherProfile.instruments?.map((inst, i) => (
                  <span key={i} className="text-xs bg-purple-900/30 text-purple-200 px-2 py-1 rounded-full border border-purple-500/40 flex items-center gap-1"><FaGuitar size={10} /> {inst.name} <span className="text-gray-400">({inst.level})</span></span>
                ))}
              </div>
              {otherProfile.localidad && <p className="flex items-center gap-1 text-xs text-gray-300 mb-3"><FaMapMarkerAlt className="text-cyan-400" /> {otherProfile.localidad}, {otherProfile.departamento}</p>}
              <button onClick={() => navigate(`/perfil/${otherProfile.id}`)} className="text-xs bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg border border-cyan-500/30">Ver perfil completo</button>
            </div>
          </div>
        </div>
      )}

      {/* Conversación */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div
          ref={scrollRef}
          onScroll={() => { if (isNearBottom()) setShowNewBelow(false) }}
          onClick={() => setActiveMessageId(null)}
          className="flex-1 overflow-y-auto py-4 max-w-3xl mx-auto w-full px-3 custom-scrollbar"
        >
          {hasOlder && (
            <div className="flex justify-center mb-3">
              <button onClick={loadOlder} disabled={loadingOlder} className="text-xs px-4 py-2 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-200 hover:text-white flex items-center gap-2">
                {loadingOlder && <FaSpinner className="animate-spin" />} Cargar mensajes anteriores
              </button>
            </div>
          )}

          {loadingMessages ? (
            <ChatSkeleton />
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Mascot color={otherProfile.avatar_color || '#333'} size={80} expression={otherProfile.expression || 'normal'} />
              <p className="mt-4 text-sm font-medium text-cyan-400">Todavía no hay mensajes.</p>
              <p className="text-xs mt-1">¡Saludá a {otherProfile.display_name.split(' ')[0]}! 👋</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine = msg.sender_id === user?.id
              const showDay = index === 0 || new Date(messages[index - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString()
              const sameAuthorAsPrev = index > 0 && messages[index - 1].sender_id === msg.sender_id && !showDay
              const isActive = activeMessageId === msg.id
              const pending = msg.id.startsWith('temp-')
              return (
                <Fragment key={msg.id}>
                  {showDay && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] px-3 py-1 rounded-full bg-[#1a1a1a]/90 border border-[#2a2a2a] text-gray-300 capitalize">{dayLabel(msg.created_at)}</span>
                    </div>
                  )}
                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${sameAuthorAsPrev ? 'mt-1' : 'mt-3'}`}>
                    <div className={`relative max-w-[85%] md:max-w-[65%] ${pending ? 'opacity-70' : ''}`}>
                      <div
                        onClick={(e) => { e.stopPropagation(); if (!pending) setActiveMessageId(isActive ? null : msg.id) }}
                        onPointerDown={() => { if (!pending) startLongPress(msg.id) }}
                        onPointerUp={cancelLongPress}
                        onPointerLeave={cancelLongPress}
                        onContextMenu={(e) => { e.preventDefault(); if (!pending) setActiveMessageId(msg.id) }}
                        className={`chat-sticker px-3.5 py-2.5 cursor-pointer ${isMine ? 'chat-sticker--mine' : 'chat-sticker--other'} ${isActive ? 'ring-2 ring-cyan-400/70 ring-offset-2 ring-offset-[#0f0f0f]' : ''}`}
                        style={{ '--sticker-tilt': `${stickerTilt(msg.id, isMine)}deg` } as CSSProperties}
                      >
                        {msg.post_content && (
                          <button
                            onClick={(e) => { e.stopPropagation(); if (msg.post_user_id) navigate(`/perfil/${msg.post_user_id}`) }}
                            className={`block w-full text-left mb-2 p-2 rounded-lg bg-black/30 border ${isMine ? 'border-purple-500/30' : 'border-gray-600/50'}`}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5 mb-1"><FaQuoteLeft className="text-cyan-400" /> Publicación</p>
                            <p className="text-xs line-clamp-2 text-gray-200">{msg.post_content}</p>
                          </button>
                        )}
                        {msg.shared_profile_id && sharedProfiles[msg.shared_profile_id] && (() => {
                          const shared = sharedProfiles[msg.shared_profile_id!]
                          return (
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/perfil/${shared.id}`) }} className="flex items-center gap-3 w-full text-left mb-2 p-2.5 rounded-xl bg-black/30 border border-cyan-500/30 hover:border-cyan-400">
                              <Avatar url={shared.avatar_url} name={shared.display_name} color={shared.avatar_color || '#333'} size={40} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{shared.display_name}</p>
                                <p className="text-[11px] text-gray-300 truncate">{shared.instruments?.[0]?.name || 'Músico'}{shared.localidad ? ` · ${shared.localidad}` : ''}</p>
                              </div>
                              <FaChevronRight className="text-cyan-400 flex-shrink-0" size={11} />
                            </button>
                          )
                        })()}
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{renderWithLinks(msg.content)}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <span className={`text-[10px] ${isMine ? 'text-purple-200/80' : 'text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                          {isMine && (
                            pending
                              ? <FaSpinner className="animate-spin text-gray-400" size={9} />
                              : <span className={`text-[11px] font-bold ${msg.is_read ? 'text-cyan-300' : 'text-purple-200'}`} title={msg.is_read ? 'Leído' : 'Enviado'}>{msg.is_read ? '✓✓' : '✓'}</span>
                          )}
                        </div>
                      </div>
                      {(reactions[msg.id]?.length || 0) > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(REACTIONS).map(([key, info]) => {
                            const list = reactions[msg.id].filter(r => r.reaction === key)
                            if (!list.length) return null
                            const mineToo = list.some(r => r.user_id === user?.id)
                            return (
                              <button key={key} onClick={(e) => { e.stopPropagation(); toggleReaction(msg, key) }} title={info.label} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${mineToo ? 'bg-white/15 border-white/40' : 'bg-[#1a1a1a] border-[#333]'}`}>
                                <info.icon style={{ color: info.color }} size={11} /> {list.length > 1 && <span className="text-gray-200">{list.length}</span>}
                              </button>
                            )
                          })}
                        </div>
                      )}
                      {isActive && (
                        <div className={`absolute z-20 top-full mt-1 flex flex-col gap-1 ${isMine ? 'right-0 items-end' : 'left-0 items-start'}`} onClick={e => e.stopPropagation()}>
                          <div className="flex gap-0.5 p-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] shadow-xl">
                            {Object.entries(REACTIONS).map(([key, info]) => (
                              <button key={key} onClick={() => toggleReaction(msg, key)} title={info.label} aria-label={info.label} className={`p-2 rounded-full hover:bg-white/10 ${reactions[msg.id]?.some(r => r.user_id === user?.id && r.reaction === key) ? 'bg-white/15' : ''}`}>
                                <info.icon style={{ color: info.color }} size={16} />
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1">
                          <button onClick={() => copyMessage(msg)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-gray-100 shadow-xl"><FaCopy size={10} /> Copiar</button>
                          {isMine && <button onClick={() => deleteMessage(msg)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-red-900/50 text-xs text-red-300 shadow-xl"><FaTrash size={10} /> Eliminar</button>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Fragment>
              )
            })
          )}
          {isOtherTyping && (
            <div className="flex justify-start mt-3">
              <div className="chat-sticker chat-sticker--other flex gap-1 px-3 py-2.5" style={{ '--sticker-tilt': '-1deg' } as CSSProperties}>
                {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          )}
          <div className="h-2" />
        </div>

        {showNewBelow && (
          <button onClick={() => scrollToBottom()} className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-600 text-white text-xs font-semibold shadow-xl">
            <FaArrowDown size={10} /> Nuevos mensajes
          </button>
        )}

        {replyToPost && (
          <div className="relative bg-[#141414] border-t px-4 py-3 flex items-start gap-3 max-w-3xl mx-auto w-full" style={{ borderColor: otherThemeColor + '60' }}>
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: otherThemeColor }} />
            <FaQuoteLeft style={{ color: otherThemeColor }} className="mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-300">Respondiendo a su publicación</p>
              <p className="text-sm text-white line-clamp-2">{replyToPost.content}</p>
            </div>
            <button onClick={() => { setReplyToPost(null); navigate(`/chat/${userId}`, { replace: true }) }} className="text-gray-400 hover:text-white p-1.5" aria-label="Quitar cita">✕</button>
          </div>
        )}

        {/* Caja de texto */}
        {blockState !== 'none' ? (
          <div className="bg-[#1a1a1a]/95 border-t border-red-900/40 px-4 py-4 text-center text-sm text-gray-300 max-w-3xl mx-auto w-full">
            <FaBan className="inline mr-2 text-red-400" />
            {blockState === 'byMe' ? 'Bloqueaste a este usuario. Podés desbloquearlo desde tu Bandeja.' : 'No podés enviarle mensajes a este usuario.'}
          </div>
        ) : (
          <div className="bg-[#1a1a1a]/90 backdrop-blur-md border-t px-3 py-2.5 max-w-3xl mx-auto w-full" style={{ borderColor: otherThemeColor + '60' }}>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value.slice(0, MAX_LENGTH)); autoGrow(); notifyTyping() }}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={replyToPost ? 'Escribí tu respuesta...' : 'Escribí un mensaje...'}
                className="flex-1 resize-none bg-[#0f0f0f]/80 border border-gray-700/50 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder:text-gray-500 max-h-[140px]"
                aria-label="Mensaje"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="p-3.5 rounded-full flex items-center justify-center text-white transition-transform active:scale-95 disabled:bg-gray-800 disabled:text-gray-400 flex-shrink-0"
                style={{ backgroundColor: newMessage.trim() && !sending ? myThemeColor : undefined }}
                aria-label="Enviar"
              >
                {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              </button>
            </div>
            {newMessage.length > MAX_LENGTH - 100 && <p className="text-[11px] text-right text-gray-400 mt-1">{newMessage.length}/{MAX_LENGTH}</p>}
            {!isTouch && <p className="text-[10px] text-gray-500 mt-1 pl-2">Enter para enviar · Shift + Enter para un salto de línea</p>}
          </div>
        )}
      </div>
    </div>
  )
}
