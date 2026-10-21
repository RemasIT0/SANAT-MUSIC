// src/pages/Bandeja.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import AnimatedBackground from '../components/AnimatedBackground'
import Toast from '../components/Toast'
import { useHiddenUsers } from '../hooks/useHiddenUsers'
import { 
  FaSpinner, FaInbox, FaEnvelope, FaUserFriends, FaBan, 
  FaSearch, FaUserPlus 
} from 'react-icons/fa'

interface Conversation {
  userId: string
  profile: any
  lastMessage: any
  unreadCount: number
}

export default function Bandeja() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const hiddenIds = useHiddenUsers() // ✅ NUEVO: Lista de usuarios bloqueados
  
  const [activeTab, setActiveTab] = useState<'messages' | 'friends' | 'blocked'>('messages')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [blocked, setBlocked] = useState<any[]>([])

  const loadFriends = async () => {
    if (!user) return
    try {
      const { data: friendRelations, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)

      if (friendsError) {
        console.error('Error cargando amigos:', friendsError)
        setFriends([])
        return
      }

      if (!friendRelations || friendRelations.length === 0) {
        setFriends([])
        return
      }

      const friendIds = friendRelations.map(f => f.friend_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_color, avatar_url')
        .in('id', friendIds)

      if (profilesError) {
        console.error('Error cargando perfiles de amigos:', profilesError)
        setFriends([])
        return
      }

      setFriends(profiles || [])
    } catch (error) {
      console.error('Error inesperado cargando amigos:', error)
      setFriends([])
    }
  }

  const loadBlocked = async () => {
    if (!user) return
    try {
      const { data: blockRelations, error: blocksError } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id)

      if (blocksError) {
        console.error('Error cargando bloqueados:', blocksError)
        setBlocked([])
        return
      }

      if (!blockRelations || blockRelations.length === 0) {
        setBlocked([])
        return
      }

      const blockedIds = blockRelations.map(b => b.blocked_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_color, avatar_url')
        .in('id', blockedIds)

      if (profilesError) {
        console.error('Error cargando perfiles de bloqueados:', profilesError)
        setBlocked([])
        return
      }

      setBlocked(profiles || [])
    } catch (error) {
      console.error('Error inesperado cargando bloqueados:', error)
      setBlocked([])
    }
  }

  useEffect(() => {
    if (!user) return
    loadAllData()

    const friendsChannel = supabase
      .channel('bandeja-friends')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'friends', filter: `user_id=eq.${user.id}` }, 
        () => { loadFriends() }
      )
      .subscribe()

    const blocksChannel = supabase
      .channel('bandeja-blocks')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocks', filter: `blocker_id=eq.${user.id}` }, 
        () => { loadBlocked() }
      )
      .subscribe()

    return () => { 
      supabase.removeChannel(friendsChannel)
      supabase.removeChannel(blocksChannel)
    }
  }, [user])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (messages && messages.length > 0) {
        const uniqueUserIds = Array.from(new Set(
          messages.map(m => m.sender_id === user?.id ? m.receiver_id : m.sender_id)
        ))

        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', uniqueUserIds)

        const grouped: Record<string, Conversation> = {}
        
        messages.forEach(msg => {
          const otherUserId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id
          
          if (!grouped[otherUserId]) {
            const profile = profiles?.find(p => p.id === otherUserId)
            grouped[otherUserId] = {
              userId: otherUserId,
              profile,
              lastMessage: msg,
              unreadCount: 0
            }
          }

          if (msg.receiver_id === user?.id && !msg.is_read) {
            grouped[otherUserId].unreadCount += 1
          }
        })

        const sortedConversations = Object.values(grouped).sort((a, b) => 
          new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
        )
        setConversations(sortedConversations)
      } else {
        setConversations([])
      }

      await Promise.all([loadFriends(), loadBlocked()])

    } catch (error) {
      console.error('Error al cargar bandeja:', error)
      setToast({ message: 'Error al cargar datos', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('user_id', user?.id)
        .eq('friend_id', friendId)

      if (error) throw error
      setFriends(friends.filter(f => f.id !== friendId))
      setToast({ message: 'Amigo eliminado', type: 'info' })
    } catch (error: any) {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    }
  }

  const handleUnblock = async (blockedId: string) => {
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', user?.id)
        .eq('blocked_id', blockedId)

      if (error) throw error
      setBlocked(blocked.filter(b => b.id !== blockedId))
      setToast({ message: 'Usuario desbloqueado', type: 'success' })
    } catch (error: any) {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    }
  }

  // ✅ CORREGIDO: Excluye conversaciones con usuarios bloqueados
  const filteredConversations = conversations.filter(conv =>
    !hiddenIds.includes(conv.userId) &&
    (conv.profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredFriends = friends.filter((f: any) =>
    f.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredBlocked = blocked.filter((b: any) =>
    b.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen relative text-gray-200 font-sans pb-24">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <main className="max-w-3xl mx-auto w-full px-4 py-4">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FaEnvelope className="text-purple-500" /> Bandeja
          </h1>
        </div>

        <div className="flex gap-2 mb-4 border-b border-[#2a2a2a] pb-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('messages'); setSearchQuery('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'messages' 
                ? 'bg-purple-700 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            <FaEnvelope size={14} /> Mensajes
          </button>
          <button
            onClick={() => { setActiveTab('friends'); setSearchQuery('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'friends' 
                ? 'bg-green-700 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            <FaUserFriends size={14} /> Amigos ({friends.length})
          </button>
          <button
            onClick={() => { setActiveTab('blocked'); setSearchQuery('') }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === 'blocked' 
                ? 'bg-red-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            <FaBan size={14} /> Bloqueados ({blocked.length})
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder={
                activeTab === 'messages' ? 'Buscar conversaciones o mensajes...' :
                activeTab === 'friends' ? 'Buscar entre tus amigos...' :
                'Buscar usuarios bloqueados...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-purple-600 transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="animate-spin text-3xl text-purple-600" />
          </div>
        ) : (
          <div className="space-y-2">
            
            {activeTab === 'messages' && (
              filteredConversations.length === 0 ? (
                <div className="text-center py-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl">
                  <FaInbox className="text-5xl mx-auto mb-4 opacity-50 text-gray-600" />
                  <p className="text-lg font-semibold text-gray-400">
                    {searchQuery ? 'No se encontraron conversaciones' : 'Tu bandeja está vacía'}
                  </p>
                  <p className="text-sm mt-2 text-gray-500">
                    {searchQuery ? 'Prueba con otro término' : 'Aún no has iniciado ninguna conversación.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  if (!conv.profile) return null
                  const isMine = conv.lastMessage.sender_id === user?.id
                  const time = new Date(conv.lastMessage.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                  const date = new Date(conv.lastMessage.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
                  const isToday = new Date(conv.lastMessage.created_at).toDateString() === new Date().toDateString()
                  const timeLabel = isToday ? time : date

                  return (
                    <div 
                      key={conv.userId}
                      onClick={() => navigate(`/chat/${conv.userId}`)}
                      className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:bg-[#222] hover:border-purple-600/30 transition-all cursor-pointer"
                    >
                      <Avatar 
                        url={conv.profile.avatar_url || null}
                        name={conv.profile.display_name}
                        color={conv.profile.avatar_color || '#333'}
                        size={50}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-white font-semibold truncate">{conv.profile.display_name}</h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{timeLabel}</span>
                        </div>
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                          {isMine ? 'Tú: ' : ''}{conv.lastMessage.content}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="bg-purple-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                      )}
                    </div>
                  )
                })
              )
            )}

            {activeTab === 'friends' && (
              filteredFriends.length === 0 ? (
                <div className="text-center py-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl">
                  <FaUserFriends className="text-5xl mx-auto mb-4 opacity-50 text-gray-600" />
                  <p className="text-lg font-semibold text-gray-400">
                    {searchQuery ? 'No se encontraron amigos' : 'Aún no tienes amigos'}
                  </p>
                  <p className="text-sm mt-2 text-gray-500">
                    {searchQuery ? 'Prueba con otro nombre' : 'Ve al perfil de alguien y agrégalo como amigo.'}
                  </p>
                </div>
              ) : (
                filteredFriends.map((friend: any) => (
                  <div key={friend.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" 
                      onClick={() => navigate(`/perfil/${friend.id}`)}
                    >
                      <Avatar 
                        url={friend.avatar_url || null} 
                        name={friend.display_name} 
                        color={friend.avatar_color || '#333'} 
                        size={45} 
                      />
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{friend.display_name}</p>
                        <p className="text-gray-500 text-xs truncate">@{friend.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0 ml-2"
                      title="Eliminar amigo"
                    >
                      <FaUserFriends size={18} />
                    </button>
                  </div>
                ))
              )
            )}

            {activeTab === 'blocked' && (
              filteredBlocked.length === 0 ? (
                <div className="text-center py-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl">
                  <FaBan className="text-5xl mx-auto mb-4 opacity-50 text-gray-600" />
                  <p className="text-lg font-semibold text-gray-400">
                    {searchQuery ? 'No se encontraron bloqueados' : 'No has bloqueado a nadie'}
                  </p>
                  <p className="text-sm mt-2 text-gray-500">
                    {searchQuery ? 'Prueba con otro nombre' : 'Cuando bloquees a alguien aparecerá aquí.'}
                  </p>
                </div>
              ) : (
                filteredBlocked.map((userBlocked: any) => (
                  <div key={userBlocked.id} className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-red-900/20 rounded-xl">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar 
                        url={userBlocked.avatar_url || null} 
                        name={userBlocked.display_name} 
                        color={userBlocked.avatar_color || '#333'} 
                        size={45} 
                      />
                      <div className="min-w-0">
                        <p className="text-gray-400 font-semibold truncate">{userBlocked.display_name}</p>
                        <p className="text-gray-600 text-xs truncate">@{userBlocked.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(userBlocked.id)}
                      className="text-green-400 hover:text-green-300 px-3 py-2 hover:bg-green-900/20 rounded-lg transition-all flex-shrink-0 ml-2 text-sm font-semibold flex items-center gap-1"
                      title="Desbloquear"
                    >
                      <FaUserPlus size={14} /> Desbloquear
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </main>
    </div>
  )
}