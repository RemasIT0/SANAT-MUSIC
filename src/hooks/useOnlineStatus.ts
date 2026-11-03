// src/hooks/useOnlineStatus.ts
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

// Se figura "en línea" si el último aviso tiene menos de 2 minutos
const ONLINE_WINDOW = 2 * 60 * 1000
// Mientras la app está a la vista, se avisa "sigo acá" cada 30 segundos
const HEARTBEAT = 30 * 1000

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export function useOnlineStatus() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    let interval: number | undefined
    let accessToken: string | null = null

    // Guardamos el token para poder avisar "me fui" aunque la pestaña se esté cerrando
    const rememberToken = async () => {
      const { data } = await supabase.auth.getSession()
      accessToken = data.session?.access_token ?? null
    }

    const markOnline = async () => {
      await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id)
      rememberToken()
    }

    // "Me fui": se guarda una hora ya vencida, así los demás lo ven desconectado al instante.
    // Se manda con keepalive para que llegue aunque se cierre la pestaña o la app.
    const markOffline = () => {
      if (!accessToken || !SUPABASE_URL || !SUPABASE_KEY) return
      const lastSeen = new Date(Date.now() - ONLINE_WINDOW - 1000).toISOString()
      fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
        method: 'PATCH',
        keepalive: true,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ last_seen: lastSeen }),
      }).catch(() => {})
    }

    const start = () => {
      markOnline()
      window.clearInterval(interval)
      interval = window.setInterval(markOnline, HEARTBEAT)
    }
    const stop = () => {
      window.clearInterval(interval)
      interval = undefined
      markOffline()
    }

    // Pestaña de fondo, app minimizada o cerrada = desconectado; al volver = en línea
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop())

    if (document.visibilityState === 'visible') start()
    else rememberToken()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', stop)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', stop)
    }
  }, [user])
}

export const isUserOnline = (lastSeen: string | null | undefined) => {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW
}

export const formatLastSeen = (lastSeen: string | null | undefined) => {
  if (isUserOnline(lastSeen)) return 'En línea'
  if (!lastSeen) return 'Desconectado'

  // Al salir se guarda una hora "vencida" (2 min antes): se descuenta para mostrar el tiempo real
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(lastSeen).getTime() - ONLINE_WINDOW) / 60000))
  if (minutes < 1) return 'Activo hace un momento'
  if (minutes < 60) return `Activo hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Activo hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `Activo hace ${days} ${days === 1 ? 'día' : 'días'}`
}
