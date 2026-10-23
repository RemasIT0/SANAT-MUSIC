// src/pages/Notificaciones.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import Toast from '../components/Toast'
import AnimatedBackground from '../components/AnimatedBackground'
import { FaHeart, FaArrowLeft, FaCheck, FaInbox } from 'react-icons/fa'

interface Notification {
  id: string
  user_id: string
  actor_id: string
  post_id: string
  type: string
  is_read: boolean
  created_at: string
  actor?: {
    id: string
    display_name: string
    username: string
    avatar_url: string | null
    avatar_color: string
  }[]  // ✅ Ahora es un array
  post?: {
    id: string
    content: string
  }[]  // ✅ Ahora es un array
}

export default function Notificaciones() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    if (!user) return
    fetchNotifications()
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id, user_id, actor_id, post_id, type, is_read, created_at,
          actor:actor_id(id, display_name, username, avatar_url, avatar_color),
          post:post_id(id, content)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
      setToast({ message: 'Error al cargar notificaciones', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
      setToast({ message: 'Todas las notificaciones marcadas como leídas', type: 'success' })
    } catch (error) {
      console.error('Error al marcar como leídas:', error)
      setToast({ message: 'Error al actualizar', type: 'error' })
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id)
        .then(() => {
          setNotifications(notifications.map(n => 
            n.id === notification.id ? { ...n, is_read: true } : n
          ))
        })
    }
    if (notification.actor_id) {
      navigate(`/perfil/${notification.actor_id}`)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'hace unos segundos'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `hace ${hours} h`
    const days = Math.floor(hours / 24)
    return `hace ${days} días`
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen relative text-gray-200 font-sans pb-24">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft /> Volver
          </button>
          <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
          <div className="w-20"></div>
        </div>

        {/* Botón Marcar todas como leídas */}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="w-full mb-4 py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <FaCheck /> Marcar todas como leídas ({unreadCount})
          </button>
        )}

        {/* Lista de notificaciones */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl">
            <FaInbox className="text-gray-600 text-5xl mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No tenés notificaciones</p>
            <p className="text-gray-500 text-sm mt-2">Cuando alguien le dé like a tu post, aparecerá aquí</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-[#1a1a1a] border rounded-xl p-4 cursor-pointer transition-all hover:border-purple-600/50 ${
                  !notification.is_read ? 'border-purple-600/50 bg-purple-900/10' : 'border-[#2a2a2a]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar del actor */}
                 {notification.actor?.[0] && (
  <Avatar
    url={notification.actor[0].avatar_url || null}
    name={notification.actor[0].display_name}
    color={notification.actor[0].avatar_color || '#333'}
    size={50}
  />
)}

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {notification.actor?.[0] && (
                          <p className="text-white font-semibold text-sm">
                            {notification.actor[0].display_name}
                            <span className="text-gray-400 font-normal"> @{notification.actor[0].username}</span>
                          </p>
                        )}
                        <p className="text-gray-300 text-xs mt-1 flex items-center gap-1">
                          <FaHeart className="text-red-500" size={10} />
                          le gustó tu publicación
                        </p>
                        {notification.post?.[0] && (
                          <p className="text-gray-500 text-xs mt-2 line-clamp-2 italic">
                            "{notification.post[0].content}"
                          </p>
                        )}
                      </div>
                      
                      {/* Indicador de no leído */}
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-[10px] mt-2">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}