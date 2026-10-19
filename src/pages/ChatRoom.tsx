// src/pages/ChatRoom.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { type Profile } from '../types'
import Avatar from '../components/Avatar'
import Mascot from '../components/Mascot'
import AnimatedBackground from '../components/AnimatedBackground'
import { FaArrowLeft, FaPaperPlane, FaSpinner } from 'react-icons/fa'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

export default function ChatRoom() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Cargar perfil del otro usuario
  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) setOtherProfile(data)
    }
    if (userId) loadProfile()
  }, [userId])

  // Cargar mensajes existentes y suscribirse a nuevos
  useEffect(() => {
    if (!user || !userId) return
    
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data)
    }
    
    loadMessages()

    // Suscribirse a nuevos mensajes en tiempo real
    const channel = supabase
      .channel(`chat-${user.id}-${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, 
        (payload) => {
          const newMsg = payload.new as Message
          const isBetweenUs = 
            (newMsg.sender_id === user.id && newMsg.receiver_id === userId) ||
            (newMsg.sender_id === userId && newMsg.receiver_id === user.id)
          
          if (isBetweenUs) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
          }
        }
      )
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
      read: false,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticMessage])

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          content
        })

      if (error) throw error
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

  const themeColor = otherProfile.theme_color || '#a855f7'

  return (
    <div className="min-h-screen relative text-gray-200 font-sans flex flex-col">
      <AnimatedBackground />
      
      {/* Header del chat */}
      <header 
        className="sticky top-0 z-20 bg-[#1a1a1a]/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3"
        style={{ borderColor: themeColor + '40' }}
      >
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <FaArrowLeft className="text-white" />
        </button>
        
        <div className="flex items-center gap-3 flex-1">
          <Avatar 
            url={otherProfile.avatar_url || null}
            name={otherProfile.display_name}
            color={otherProfile.avatar_color || '#333'}
            size={40}
          />
          <div>
            <h2 className="text-white font-semibold text-sm">{otherProfile.display_name}</h2>
            <p className="text-gray-500 text-xs">@{otherProfile.username}</p>
          </div>
        </div>
      </header>

      {/* ✅ Contenedor principal con laterales visibles */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Panel lateral izquierdo (con borde y fondo sutil) */}
        <div 
          className="hidden lg:block w-1/4 min-w-[200px] bg-[#1a1a1a]/40 border-r"
          style={{ borderColor: themeColor + '40' }}
        />
        
        {/* Área de mensajes */}
        <main className="flex-1 overflow-y-auto py-2 space-y-1 max-w-3xl mx-auto w-full px-4 md:px-6">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Mascot 
                color={otherProfile.avatar_color || '#333'} 
                size={80} 
                expression="normal" 
              />
              <p className="mt-4 text-sm">Aún no hay mensajes.</p>
              <p className="text-xs mt-1">¡Sé el primero en saludar! 👋</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === user?.id
              return (
                <div 
                  key={msg.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] md:max-w-[60%] px-4 py-2.5 rounded-2xl ${
                      isMine 
                        ? 'rounded-br-sm text-white' 
                        : 'rounded-bl-sm text-gray-100 bg-[#2a2a2a]'
                    }`}
                    style={{ 
                      backgroundColor: isMine ? themeColor : undefined 
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('es-AR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Panel lateral derecho (con borde y fondo sutil) */}
        <div 
          className="hidden lg:block w-1/4 min-w-[200px] bg-[#1a1a1a]/40 border-l"
          style={{ borderColor: themeColor + '40' }}
        />
      </div>

      {/* Input para escribir */}
      <form 
        onSubmit={handleSend}
        className="sticky bottom-0 bg-[#1a1a1a]/95 backdrop-blur border-t px-4 py-3 flex items-center gap-2"
        style={{ borderColor: themeColor + '40' }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-600 transition-colors placeholder:text-gray-600"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className={`p-3 rounded-full transition-all ${
            !newMessage.trim() || sending
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'text-white hover:scale-105'
          }`}
          style={{ 
            backgroundColor: newMessage.trim() && !sending ? themeColor : undefined 
          }}
        >
          {sending ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaPaperPlane />
          )}
        </button>
      </form>
    </div>
  )
}