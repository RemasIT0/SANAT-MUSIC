// src/components/DeviceNotifications.tsx
// Escucha mensajes nuevos y likes a mi publicación y los muestra como
// notificación del dispositivo (si el usuario las activó).
// Funciona mientras la app está abierta o en segundo plano.
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { showDeviceNotification, notificationPermission, subscribePush, NOTIFICATIONS_EVENT } from '../lib/pwa'

export default function DeviceNotifications() {
  const { user } = useAuth()
  const location = useLocation()
  // Cambia cuando el usuario activa los avisos, para empezar a escuchar sin recargar
  const [permissionVersion, setPermissionVersion] = useState(0)

  useEffect(() => {
    const bump = () => setPermissionVersion(v => v + 1)
    window.addEventListener(NOTIFICATIONS_EVENT, bump)
    return () => window.removeEventListener(NOTIFICATIONS_EVENT, bump)
  }, [])

  // Avisos con la app cerrada: registrar este dispositivo en el servidor
  useEffect(() => {
    if (user && notificationPermission() === 'granted') subscribePush(user.id)
  }, [user, permissionVersion])

  useEffect(() => {
    if (!user || notificationPermission() !== 'granted') return
    let active = true
    const channelName = `device-notifications-${Math.random().toString(36).slice(2)}`
    let channel = supabase.channel(channelName)

    const nameOf = async (id: string) => {
      const { data } = await supabase.from('profiles').select('display_name').eq('id', id).maybeSingle()
      return data?.display_name || 'Alguien'
    }

    // Mensajes nuevos (no avisar si ya estoy mirando ese chat)
    channel = channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, async (payload) => {
      const msg = payload.new as any
      const viewingThisChat = document.visibilityState === 'visible' && window.location.pathname === `/chat/${msg.sender_id}`
      if (viewingThisChat) return
      const name = await nameOf(msg.sender_id)
      const body = (msg.content || '').length > 90 ? msg.content.slice(0, 90) + '…' : msg.content
      showDeviceNotification(`💬 ${name}`, body, `/chat/${msg.sender_id}`, `chat-${msg.sender_id}`)
    })

    channel = channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_notices', filter: `user_id=eq.${user.id}` }, (payload) => {
      const notice = payload.new as any
      showDeviceNotification('🛡️ Administración', notice.title || 'Tenés un aviso nuevo', '/chat/administracion', 'admin-notice')
    })

    channel = channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_alerts', filter: `user_id=eq.${user.id}` }, async (payload) => {
      const alert = payload.new as any
      const name = await nameOf(alert.poster_id)
      showDeviceNotification(alert.kind === 'te_buscan' ? '🥁 ¡Te buscan!' : '🎸 Hay alguien para tu proyecto', alert.kind === 'te_buscan' ? `${name} busca lo que tocás. Escribile.` : `${name} toca lo que estás buscando.`, '/home', `match-${alert.post_id}`)
    })

    const subscribe = async () => {
      // Likes a mi publicación
      const { data: myPost } = await supabase.from('posts').select('id').eq('user_id', user.id).limit(1).maybeSingle()
      if (!active) return
      if (myPost) {
        channel = channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_likes', filter: `post_id=eq.${myPost.id}` }, async (payload) => {
          const like = payload.new as any
          if (like.user_id === user.id) return
          const name = await nameOf(like.user_id)
          showDeviceNotification('❤️ Nuevo like', `A ${name} le gustó tu publicación`, '/home', 'likes')
        })
      }
      channel.subscribe()
    }
    subscribe()

    return () => { active = false; supabase.removeChannel(channel) }
    // Se vuelve a armar al cambiar de sección, por si el usuario creó su publicación o activó los avisos
  }, [user, permissionVersion, location.pathname === '/home'])

  return null
}
