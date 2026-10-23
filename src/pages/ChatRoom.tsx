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

  // ✅ NUEVO: Estados para el indicador "Escribiendo..."
  const [isOtherTyping, setIsOtherTyping] = useState(false)
const typingTimeoutRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const myThemeColor = profile?.theme_color || '#a855f7'
  const otherThemeColor = otherProfile?.theme_color || '#a855f7'

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

        // ✅ TU LÓGICA ORIGINAL DE MARCAR COMO LEÍDO (Intacta)
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', userId)
          .eq('receiver_id', user.id)
          .eq('is_read', false)
      }
    }
    
    loadMessages()

    // Canal de mensajes nuevos
    const channel = supabase
      .channel(`chat-${user.id}-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const newMsg = payload.new as any
        const isBetweenUs = (newMsg.sender_id === user.id && newMsg.receiver_id === userId) || (newMsg.sender_id === userId && newMsg.receiver_id === user.id)
        
        if (isBetweenUs) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            
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

    // ✅ NUEVO: Canal de "Escribiendo..." (Broadcast)
    const typingChannel = supabase.channel(`typing-room-${userId}`)
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
  }, [user, userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ✅ NUEVO: Función para avisar que estoy escribiendo
  const handleTyping = () => {
    supabase.channel(`typing-room-${userId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { senderId: user?.id }
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !userId || sending) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: userId,
      content,
      is_read: false,
      post_id: replyToPost?.id || null,
      post_content: replyToPost?.content || null,
      post_intention: replyToPost?.intention || null,
      post_genres: replyToPost?.genres || null,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticMessage])

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: userId,
        content,
        post_id: replyToPost?.id || null
      })
      if (error) throw error
      
      setReplyToPost(null)
      navigate(`/chat/${userId}`, { replace: true })
    } catch (error: any) {
      console.error('Error al enviar:', error)
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id))
      setNewMessage(content)
    } finally {
      setSending(false)
    }
  }

  if (!otherProfile) {
    return (
      <div className="h-[100dvh] flex items-center justify-center text-gray-400 bg-[#0f0f0f]">
        <FaSpinner className="animate-spin text-3xl text-purple-600 mr-3" />
        Cargando chat...
      </div>
    )
  }

  return (
    <div className="h-[100dvh] relative text-gray-200 font-sans flex flex-col overflow-hidden bg-[#0f0f0f]">
      <AnimatedBackground />
      
      <header 
        className="sticky top-0 z-30 bg-[#1a1a1a]/95 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[#222] transition-colors"
        style={{ borderColor: otherThemeColor + '40' }}
        onClick={() => setShowUserInfo(!showUserInfo)}
      >
        <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <FaArrowLeft className="text-white" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar url={otherProfile.avatar_url || null} name={otherProfile.display_name} color={otherProfile.avatar_color || '#333'} size={40} />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm truncate">{otherProfile.display_name}</h2>
            <p className="text-gray-500 text-xs truncate">@{otherProfile.username}</p>
          </div>
          {showUserInfo ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
        </div>
      </header>

      {showUserInfo && (
        <div className="bg-[#1a1a1a]/95 backdrop-blur-md border-b animate-[slideDown_0.3s_ease-out] z-20" style={{ borderColor: otherThemeColor + '40' }}>
          <div className="p-4 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <Avatar url={otherProfile.avatar_url || null} name={otherProfile.display_name} color={otherProfile.avatar_color || '#333'} size={64} />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg">{otherProfile.display_name}</h3>
                <p className="text-purple-400 text-sm mb-2">@{otherProfile.username}</p>
                {otherProfile.bio && <p className="text-gray-400 text-sm italic mb-3 line-clamp-3">"{otherProfile.bio}"</p>}
                <div className="flex flex-wrap gap-2 mb-3">
                  {otherProfile.instruments?.map((inst: any, i: number) => (
                    <span key={i} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full border border-purple-700/40 flex items-center gap-1">
                      <FaGuitar size={10} /> {inst.name} <span className="text-gray-500">({inst.level})</span>
                    </span>
                  ))}
                </div>
                {otherProfile.localidad && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <FaMapMarkerAlt size={12} /> {otherProfile.localidad}, {otherProfile.departamento}
                  </div>
                )}
                <button onClick={(e) => { e.stopPropagation(); navigate(`/perfil/${otherProfile.id}`); }} className="text-xs bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg transition-colors border border-[#3a3a3a]">
                  Ver perfil completo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto py-4 space-y-3 max-w-3xl mx-auto w-full px-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Mascot color={otherProfile.avatar_color || '#333'} size={80} expression="normal" />
              <p className="mt-4 text-sm font-medium">Aún no hay mensajes.</p>
              <p className="text-xs mt-1 text-gray-600">¡Sé el primero en saludar! 👋</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id
              const bubbleColor = isMine ? myThemeColor : '#2a2a2a'
              const textColor = isMine ? 'text-white' : 'text-gray-100'
              const timeColor = isMine ? 'text-white/60' : 'text-gray-500'

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}>
                  <div className={`max-w-[85%] md:max-w-[65%] px-4 py-3 rounded-2xl shadow-sm ${isMine ? 'rounded-br-md' : 'rounded-bl-md'}`} style={{ backgroundColor: bubbleColor }}>
                    {msg.post_content && (
                      <div className={`mb-2 pb-2 border-b ${isMine ? 'border-white/20' : 'border-gray-600/50'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <FaQuoteLeft className="text-xs opacity-60" />
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isMine ? 'text-white/70' : 'text-gray-400'}`}>Respondiendo a</p>
                        </div>
                        <p className={`text-xs line-clamp-2 ${isMine ? 'text-white/80' : 'text-gray-300'}`}>{msg.post_content}</p>
                      </div>
                    )}
                    <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${textColor}`}>{msg.content}</p>
                    <p className={`text-[10px] mt-1.5 text-right ${timeColor}`}>
                      {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} className="h-2" />
        </main>

        {replyToPost && (
          <div className="relative bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] border-t border-l border-r px-4 py-3 flex items-start gap-3 max-w-3xl mx-auto w-full animate-[slideUp_0.2s_ease-out] overflow-hidden" style={{ borderColor: otherThemeColor + '40' }}>
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: otherThemeColor }} />
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md" style={{ backgroundColor: otherThemeColor + '25', border: `1px solid ${otherThemeColor}50` }}>
              <FaQuoteLeft style={{ color: otherThemeColor }} size={14} />
            </div>
            <div className="flex-1 min-w-0 pl-1">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: otherThemeColor }}>Respondiendo a su publicación</p>
              <p className="text-sm text-white line-clamp-2 leading-relaxed">{replyToPost.content}</p>
              {replyToPost.genres && replyToPost.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {replyToPost.genres.slice(0, 3).map((genre: string, i: number) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: otherThemeColor + '15', color: otherThemeColor, border: `1px solid ${otherThemeColor}30` }}>#{genre}</span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => { setReplyToPost(null); navigate(`/chat/${userId}`, { replace: true }) }} className="text-gray-500 hover:text-white flex-shrink-0 p-1.5 hover:bg-white/10 rounded-full transition-colors ml-2">✕</button>
          </div>
        )}

        {/* ✅ NUEVO: UI del indicador "Escribiendo..." */}
        {isOtherTyping && (
          <div className="max-w-3xl mx-auto w-full px-4 pb-2">
            <div className="flex items-center gap-2 text-xs text-purple-400 italic animate-pulse">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              Escribiendo...
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="sticky bottom-0 bg-[#1a1a1a]/95 backdrop-blur-md border-t px-4 py-3 flex items-center gap-3 max-w-3xl mx-auto w-full" style={{ borderColor: otherThemeColor + '40' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping() // ✅ Aquí se dispara la señal de que estás escribiendo
            }}
            placeholder={replyToPost ? "Escribe tu respuesta..." : "Escribe un mensaje..."}
            className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-full px-5 py-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-gray-600"
            disabled={sending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`p-3.5 rounded-full transition-all duration-300 flex items-center justify-center ${!newMessage.trim() || sending ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'text-white hover:scale-105 active:scale-95 shadow-lg'}`}
            style={{ backgroundColor: newMessage.trim() && !sending ? myThemeColor : undefined, boxShadow: newMessage.trim() && !sending ? `0 0 15px ${myThemeColor}40` : 'none' }}
          >
            {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane className={newMessage.trim() && !sending ? 'ml-0.5' : ''} />}
          </button>
        </form>
      </div>
    </div>
  )
}