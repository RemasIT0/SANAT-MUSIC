// src/pages/ChatRoom.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { type Profile } from '../types'
import Avatar from '../components/Avatar'
import Mascot from '../components/Mascot'
import AnimatedBackground from '../components/AnimatedBackground'
import { FaArrowLeft, FaPaperPlane, FaSpinner, FaQuoteLeft, FaChevronDown, FaChevronUp, FaGuitar, FaMapMarkerAlt } from 'react-icons/fa'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  read_at?: string | null
  post_id: string | null
  post_content?: string | null
  post_intention?: string | null
  post_genres?: string[] | null
  created_at: string
}

export default function ChatRoom() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile } = useAuth()
  
  const searchParams = new URLSearchParams(location.search)
  const initialPostId = searchParams.get('post')
  
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [replyToPost, setReplyToPost] = useState<any>(null)
  const [showUserInfo, setShowUserInfo] = useState(false)

  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const typingTimeoutRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const myThemeColor = profile?.theme_color || '#a855f7'
  const otherThemeColor = otherProfile?.theme_color || '#a855f7'

  // ✅ FIX CRÍTICO: Canal compartido para "Escribiendo..."
  // Ordenamos los IDs para que ambos usuarios usen el mismo canal
  const typingChannelId = [user?.id, userId].sort().join('-')

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) setOtherProfile(data)
    }
    if (userId) loadProfile()
  }, [userId])

  useEffect(() => {
    if (initialPostId) {
      supabase.from('posts').select('*').eq('id', initialPostId).single()
        .then(({ data }) => { if (data) setReplyToPost(data) })
    }
  }, [initialPostId])

  useEffect(() => {
    if (!user || !userId) return
    
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`*, post:post_id (id, content, intention, genres)`)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      
      if (data) {
        const formatted = data.map((msg: any) => ({
          ...msg,
          post_content: msg.post?.content || null,
          post_intention: msg.post?.intention || null,
          post_genres: msg.post?.genres || null
        }))
        setMessages(formatted)

        // ✅ Marcar como leído con timestamp
        await supabase
          .from('messages')
          .update({ 
            is_read: true,
            read_at: new Date().toISOString() 
          })
          .eq('sender_id', userId)
          .eq('receiver_id', user.id)
          .eq('is_read', false)
      }
    }
    
    loadMessages()

    // Canal de mensajes nuevos (Realtime)
    const channel = supabase
      .channel(`chat-${user.id}-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const newMsg = payload.new as any
        const isBetweenUs = (newMsg.sender_id === user.id && newMsg.receiver_id === userId) || (newMsg.sender_id === userId && newMsg.receiver_id === user.id)
        
        if (isBetweenUs) {
          setMessages(prev => {
            // Evitar duplicados: si ya existe por ID real, no hacer nada
            if (prev.some(m => m.id === newMsg.id)) return prev
            
            // Reemplazar mensaje optimista (temp) por el real
            const optimisticIndex = prev.findIndex(m => m.sender_id === newMsg.sender_id && m.content === newMsg.content && m.id.startsWith('temp-'))
            if (optimisticIndex !== -1) {
              const newPrev = [...prev]
              newPrev[optimisticIndex] = { 
                ...newMsg, 
                post_content: newMsg.post?.content || null, 
                post_intention: newMsg.post?.intention || null, 
                post_genres: newMsg.post?.genres || null 
              }
              return newPrev
            }

            // Si no existe, agregarlo nuevo
            if (newMsg.post_id) {
              supabase.from('posts').select('content, intention, genres').eq('id', newMsg.post_id).single()
                .then(({ data }) => {
                  if (data) {
                    setMessages(prev2 => prev2.map(m => m.id === newMsg.id ? { ...m, post_content: data.content, post_intention: data.intention, post_genres: data.genres } : m))
                  }
                })
            }
            return [...prev, { ...newMsg, post_content: null, post_intention: null, post_genres: null }]
          })
        }
      })
      .subscribe()

    // ✅ Canal de "Escribiendo..." (Broadcast) - Canal compartido
    const typingChannel = supabase.channel(`typing-${typingChannelId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.senderId !== user?.id) {
          setIsOtherTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000)
        }
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(channel)
      supabase.removeChannel(typingChannel)
    }
  }, [user, userId, typingChannelId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ✅ Función para avisar que estoy escribiendo (usa el canal compartido)
  const handleTyping = () => {
    supabase.channel(`typing-${typingChannelId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { senderId: user?.id }
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !userId || sending) return

    setSending(true)

     if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current)
    setIsOtherTyping(false)
     }
    const content = newMessage.trim()
    setNewMessage('')
    const tempId = `temp-${Date.now()}`



    // Mensaje optimista para UI instantánea
    const optimisticMessage: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: userId,
      content,
      is_read: false,
      read_at: null,
      post_id: replyToPost?.id || null,
      post_content: replyToPost?.content || null,
      post_intention: replyToPost?.intention || null,
      post_genres: replyToPost?.genres || null,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticMessage])

    try {
      // .select().single() devuelve el mensaje real con su ID de la BD
      const { data, error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: userId,
        content,
        post_id: replyToPost?.id || null
      }).select().single()
      
      if (error) throw error
      
      // Reemplazar el mensaje optimista por el real (evita duplicados)
      setMessages(prev => prev.map(m => m.id === tempId ? { 
        ...data, 
        post_content: replyToPost?.content || null, 
        post_intention: replyToPost?.intention || null, 
        post_genres: replyToPost?.genres || null 
      } : m))
      
      setReplyToPost(null)
    } catch (error: any) {
      console.error('Error al enviar:', error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  if (!otherProfile) {
    return (
      <div className="h-[100dvh] flex items-center justify-center text-gray-400 bg-[#0f0f0f]">
        <FaSpinner className="animate-spin text-3xl text-cyan-400 mr-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        <span className="text-cyan-400 font-medium">Conectando al canal...</span>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] relative text-gray-200 font-sans flex flex-col overflow-hidden bg-[#0f0f0f]">
      <AnimatedBackground />
      
      {/* ✅ FONDO CYBERPUNK: Grid sutil */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      
      <header 
        className="sticky top-0 z-30 bg-[#1a1a1a]/90 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[#222] transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        style={{ borderColor: otherThemeColor + '60' }}
        onClick={() => setShowUserInfo(!showUserInfo)}
      >
        <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="p-2 rounded-full hover:bg-white/10 transition-colors text-cyan-400 hover:text-cyan-300 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
          <FaArrowLeft />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <Avatar url={otherProfile.avatar_url || null} name={otherProfile.display_name} color={otherProfile.avatar_color || '#333'} size={40} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a] shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{otherProfile.display_name}</h2>
            <p className="text-gray-400 text-xs truncate">@{otherProfile.username}</p>
          </div>
          {showUserInfo ? <FaChevronUp className="text-cyan-400" /> : <FaChevronDown className="text-gray-400" />}
        </div>
      </header>

      {showUserInfo && (
        <div className="bg-[#1a1a1a]/95 backdrop-blur-md border-b animate-[slideDown_0.3s_ease-out] z-20 shadow-lg" style={{ borderColor: otherThemeColor + '60' }}>
          <div className="p-4 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <Avatar url={otherProfile.avatar_url || null} name={otherProfile.display_name} color={otherProfile.avatar_color || '#333'} size={64} />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{otherProfile.display_name}</h3>
                <p className="text-cyan-400 text-sm mb-2">@{otherProfile.username}</p>
                {otherProfile.bio && <p className="text-gray-400 text-sm italic mb-3 line-clamp-3">"{otherProfile.bio}"</p>}
                <div className="flex flex-wrap gap-2 mb-3">
                  {otherProfile.instruments?.map((inst: any, i: number) => (
                    <span key={i} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full border border-purple-500/40 flex items-center gap-1 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                      <FaGuitar size={10} /> {inst.name} <span className="text-gray-500">({inst.level})</span>
                    </span>
                  ))}
                </div>
                {otherProfile.localidad && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                    <FaMapMarkerAlt size={12} className="text-cyan-400" /> {otherProfile.localidad}, {otherProfile.departamento}
                  </div>
                )}
                <button onClick={(e) => { e.stopPropagation(); navigate(`/perfil/${otherProfile.id}`); }} className="text-xs bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg transition-all border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                  Ver perfil completo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto py-4 space-y-4 max-w-3xl mx-auto w-full px-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="relative">
                <Mascot color={otherProfile.avatar_color || '#333'} size={80} expression="normal" />
                <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full animate-pulse"></div>
              </div>
              <p className="mt-4 text-sm font-medium text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Aún no hay mensajes.</p>
              <p className="text-xs mt-1 text-gray-500">¡Sé el primero en saludar! 👋</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id
              const bubbleColor = isMine 
                ? 'bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/40' 
                : 'bg-[#1a1a1a]/60 border-gray-700/40'
              const textColor = isMine ? 'text-white' : 'text-gray-100'
              const timeColor = isMine ? 'text-purple-300/70' : 'text-gray-500'

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
                  <div className={`max-w-[85%] md:max-w-[65%] px-4 py-3 rounded-2xl backdrop-blur-sm shadow-[0_4px_15px_rgba(0,0,0,0.3)] border ${isMine ? 'rounded-br-md' : 'rounded-bl-md'} ${bubbleColor}`}>
                    {msg.post_content && (
                      <div className={`mb-2 pb-2 border-b ${isMine ? 'border-purple-500/30' : 'border-gray-600/50'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <FaQuoteLeft className="text-xs opacity-60 text-cyan-400" />
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isMine ? 'text-purple-300/80' : 'text-gray-400'}`}>Respondiendo a</p>
                        </div>
                        <p className={`text-xs line-clamp-2 ${isMine ? 'text-white/80' : 'text-gray-300'}`}>{msg.post_content}</p>
                      </div>
                    )}
                    
                    <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${textColor} drop-shadow-sm`}>{msg.content}</p>
                    
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                      <p className={`text-[10px] ${timeColor}`}>
                        {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {msg.sender_id === user?.id && (
                        <span className={`text-[10px] font-bold ${msg.read_at ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]' : 'text-gray-600'}`}>
                          {msg.read_at ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} className="h-2" />
        </main>

        {replyToPost && (
          <div className="relative bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] border-t border-l border-r px-4 py-3 flex items-start gap-3 max-w-3xl mx-auto w-full animate-[slideUp_0.2s_ease-out] overflow-hidden shadow-lg" style={{ borderColor: otherThemeColor + '60' }}>
            <div className="absolute left-0 top-0 bottom-0 w-1.5 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: otherThemeColor, color: otherThemeColor }} />
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md" style={{ backgroundColor: otherThemeColor + '25', border: `1px solid ${otherThemeColor}50` }}>
              <FaQuoteLeft style={{ color: otherThemeColor }} size={14} />
            </div>
            <div className="flex-1 min-w-0 pl-1">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: otherThemeColor }}>Respondiendo a su publicación</p>
              <p className="text-sm text-white line-clamp-2 leading-relaxed">{replyToPost.content}</p>
              {replyToPost.genres && replyToPost.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {replyToPost.genres.slice(0, 3).map((genre: string, i: number) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shadow-[0_0_5px_rgba(0,0,0,0.5)]" style={{ backgroundColor: otherThemeColor + '15', color: otherThemeColor, border: `1px solid ${otherThemeColor}40` }}>#{genre}</span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => { setReplyToPost(null); navigate(`/chat/${userId}`, { replace: true }) }} className="text-gray-500 hover:text-cyan-400 flex-shrink-0 p-1.5 hover:bg-white/10 rounded-full transition-colors ml-2">✕</button>
          </div>
        )}

        {/* ✅ Indicador "Escribiendo..." con estilo Neon */}
        {isOtherTyping && (
          <div className="max-w-3xl mx-auto w-full px-4 pb-2">
            <div className="flex items-center gap-2 text-xs text-cyan-400 italic font-medium">
              <div className="flex gap-1 bg-cyan-900/20 px-3 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)] backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_6px_rgba(34,211,238,1)]" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_6px_rgba(34,211,238,1)]" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_6px_rgba(34,211,238,1)]" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="animate-pulse drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Escribiendo...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="sticky bottom-0 bg-[#1a1a1a]/90 backdrop-blur-md border-t px-4 py-3 flex items-center gap-3 max-w-3xl mx-auto w-full shadow-[0_-4px_20px_rgba(0,0,0,0.5)]" style={{ borderColor: otherThemeColor + '60' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            placeholder={replyToPost ? "Escribe tu respuesta..." : "Escribe un mensaje..."}
            className="flex-1 bg-[#0f0f0f]/80 border border-gray-700/50 rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all placeholder:text-gray-600 backdrop-blur-sm"
            disabled={sending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`p-3.5 rounded-full transition-all duration-300 flex items-center justify-center ${!newMessage.trim() || sending ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'text-white hover:scale-105 active:scale-95'}`}
            style={{ 
              backgroundColor: newMessage.trim() && !sending ? myThemeColor : undefined, 
              boxShadow: newMessage.trim() && !sending ? `0 0 15px ${myThemeColor}60` : 'none',
              border: newMessage.trim() && !sending ? `1px solid ${myThemeColor}80` : 'none'
            }}
          >
            {sending ? <FaSpinner className="animate-spin text-cyan-400" /> : <FaPaperPlane className={newMessage.trim() && !sending ? 'ml-0.5 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : ''} />}
          </button>
        </form>
      </div>
    </div>
  )
}