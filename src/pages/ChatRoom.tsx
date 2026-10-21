// src/pages/ChatRoom.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { type Profile } from '../types'
import Avatar from '../components/Avatar'
import Mascot from '../components/Mascot'
import AnimatedBackground from '../components/AnimatedBackground'
import { FaArrowLeft, FaPaperPlane, FaSpinner, FaQuoteLeft } from 'react-icons/fa'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Colores de tema (El tuyo y el del otro)
  const myThemeColor = profile?.theme_color || '#a855f7'
  const otherThemeColor = otherProfile?.theme_color || '#a855f7'

  // Cargar perfil del otro usuario
  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) setOtherProfile(data)
    }
    if (userId) loadProfile()
  }, [userId])

  // Cargar la publicación si viene el parámetro post
  useEffect(() => {
    if (initialPostId) {
      supabase.from('posts').select('*').eq('id', initialPostId).single()
        .then(({ data }) => { if (data) setReplyToPost(data) })
    }
  }, [initialPostId])

  // Cargar mensajes y suscribirse
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

        // Marcar como leídos
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', userId)
          .eq('receiver_id', user.id)
          .eq('is_read', false)
      }
    }
    
    loadMessages()

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

    return () => { supabase.removeChannel(channel) }
  }, [user, userId])

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        <FaSpinner className="animate-spin text-3xl text-purple-600 mr-3" />
        Cargando chat...
      </div>
    )
  }

  return (
    // ✅ SIN pb-24: Pantalla completa real, el input se pega al fondo
    <div className="min-h-screen relative text-gray-200 font-sans flex flex-col">
      <AnimatedBackground />
      
      {/* Header del chat */}
      <header 
        className="sticky top-0 z-20 bg-[#1a1a1a]/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3"
        style={{ borderColor: otherThemeColor + '40' }}
      >
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <FaArrowLeft className="text-white" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar url={otherProfile.avatar_url || null} name={otherProfile.display_name} color={otherProfile.avatar_color || '#333'} size={40} />
          <div>
            <h2 className="text-white font-semibold text-sm">{otherProfile.display_name}</h2>
            <p className="text-gray-500 text-xs">@{otherProfile.username}</p>
          </div>
        </div>
      </header>

      {/* Área de mensajes */}
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden lg:block w-1/4 min-w-[200px] bg-[#1a1a1a]/40 border-r" style={{ borderColor: otherThemeColor + '40' }} />
        
        <main className="flex-1 overflow-y-auto py-2 space-y-1 max-w-3xl mx-auto w-full px-4 md:px-6">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mascot color={otherProfile.avatar_color || '#333'} size={80} expression="normal" />
              <p className="mt-4 text-sm">Aún no hay mensajes.</p>
              <p className="text-xs mt-1">¡Sé el primero en saludar! 👋</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id
              // ✅ BURBUJAS CON DOBLE COLOR: Tu color para ti, su color para él/ella
              const bubbleColor = isMine ? myThemeColor : otherThemeColor

              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] md:max-w-[60%] px-4 py-2.5 rounded-2xl ${
                      isMine ? 'rounded-br-sm text-white' : 'rounded-bl-sm text-gray-100 bg-[#2a2a2a]'
                    }`}
                    style={{ backgroundColor: isMine ? bubbleColor : undefined }}
                  >
                    {msg.post_content && (
                      <div className={`mb-2 pb-2 border-b ${isMine ? 'border-white/20' : 'border-gray-600/50'}`}>
                        <div className="flex items-center gap-1 mb-1">
                          <FaQuoteLeft className="text-xs opacity-60" />
                          <p className={`text-[10px] font-semibold ${isMine ? 'text-white/70' : 'text-gray-400'}`}>Respondiendo a publicación</p>
                        </div>
                        <p className={`text-xs line-clamp-2 ${isMine ? 'text-white/80' : 'text-gray-300'}`}>{msg.post_content}</p>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        <div className="hidden lg:block w-1/4 min-w-[200px] bg-[#1a1a1a]/40 border-l" style={{ borderColor: otherThemeColor + '40' }} />
      </div>

      {/* Bloque "Respondiendo a" */}
      {replyToPost && (
        <div className="bg-[#1a1a1a]/95 backdrop-blur border-t border-l border-r px-4 py-2 flex items-start gap-2 max-w-3xl mx-auto w-full" style={{ borderColor: otherThemeColor + '40' }}>
          <FaQuoteLeft className="text-gray-500 mt-1 flex-shrink-0" size={12} />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-0.5">Respondiendo a:</p>
            <p className="text-sm text-gray-200 line-clamp-2 truncate">{replyToPost.content}</p>
          </div>
          <button onClick={() => { setReplyToPost(null); navigate(`/chat/${userId}`, { replace: true }) }} className="text-gray-500 hover:text-white flex-shrink-0 ml-2">✕</button>
        </div>
      )}

      {/* Input para escribir */}
      <form onSubmit={handleSend} className="sticky bottom-0 bg-[#1a1a1a]/95 backdrop-blur border-t px-4 py-3 flex items-center gap-2" style={{ borderColor: otherThemeColor + '40' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={replyToPost ? "Escribe tu respuesta..." : "Escribe un mensaje..."}
          className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-full px-4 py-2.5 text-sm text-white focus:outline-none transition-colors placeholder:text-gray-600"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className={`p-3 rounded-full transition-all ${!newMessage.trim() || sending ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'text-white hover:scale-105'}`}
          style={{ backgroundColor: newMessage.trim() && !sending ? myThemeColor : undefined }}
        >
          {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
        </button>
      </form>
    </div>
  )
}