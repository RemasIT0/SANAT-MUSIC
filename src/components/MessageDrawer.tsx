import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { FaTimes, FaEnvelope, FaSpinner, FaUser } from 'react-icons/fa'

interface MessageDrawerProps {
  isOpen: boolean
  onClose: () => void
  currentUserId: string | undefined
}

interface Conversation {
  userId: string
  displayName: string
  username: string
  avatar_color: string
  lastMessage: string
  createdAt: string
  unreadCount: number
}

export default function MessageDrawer({ isOpen, onClose, currentUserId }: MessageDrawerProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchConversations()
    }
  }, [isOpen, currentUserId])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (messages) {
        const grouped: Record<string, Conversation> = {}
        
        for (const msg of messages) {
          const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
          
          if (!grouped[otherUserId]) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, username, avatar_color')
              .eq('id', otherUserId)
              .single()

            grouped[otherUserId] = {
              userId: otherUserId,
              displayName: profile?.display_name || 'Usuario',
              username: profile?.username || 'desconocido',
              avatar_color: profile?.avatar_color || '#333',
              lastMessage: msg.content,
              createdAt: msg.created_at,
              unreadCount: msg.receiver_id === currentUserId && !msg.is_read ? 1 : 0
            }
          } else {
            if (msg.receiver_id === currentUserId && !msg.is_read) {
              grouped[otherUserId].unreadCount += 1
            }
          }
        }
        setConversations(Object.values(grouped))
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
      
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#1a1a1a] border-l border-[#2a2a2a] z-50 shadow-2xl transform transition-transform duration-300 flex flex-col">
        <div className="p-5 border-b border-[#2a2a2a] flex items-center justify-between bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-900/30 rounded-full flex items-center justify-center">
              <FaEnvelope className="text-purple-400" size={18} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Bandeja de entrada</h2>
              <p className="text-gray-500 text-xs">{conversations.length} conversaciones</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 bg-transparent">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <FaSpinner className="animate-spin text-2xl text-purple-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <FaEnvelope className="text-4xl mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aún no tenés mensajes.</p>
              <p className="text-xs mt-1 text-gray-600">Cuando alguien te escriba, aparecerá aquí.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.userId} 
                className="flex items-center gap-3 p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl hover:border-purple-600/50 transition-colors cursor-pointer group"
                onClick={() => alert(`Aquí se abrirá el chat con ${conv.displayName} (Próximo paso)`)}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border border-[#2a2a2a]"
                  style={{ backgroundColor: conv.avatar_color }}
                >
                  <FaUser className="text-white/80" size={18} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-semibold text-sm truncate group-hover:text-purple-400 transition-colors">
                      {conv.displayName}
                    </h4>
                    <span className="text-gray-600 text-[10px]">
                      {new Date(conv.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs truncate">@{conv.username}</p>
                  <p className="text-gray-500 text-xs truncate mt-1">{conv.lastMessage}</p>
                </div>

                {conv.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}