// src/hooks/useOnlineStatus.ts
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useOnlineStatus() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const updateLastSeen = async () => {
      const now = new Date().toISOString()
      
      await supabase
        .from('profiles')
        .update({ last_seen: now })
        .eq('id', user.id)
    }

    // Ejecutar inmediatamente al montar el componente
    updateLastSeen()

    // Ejecutar cada 60 segundos (óptimo para rendimiento y batería)
    const interval = setInterval(updateLastSeen, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [user])
}

export const isUserOnline = (lastSeen: string | null | undefined) => {
  if (!lastSeen) return false
  
  const lastSeenDate = new Date(lastSeen).getTime()
  const now = Date.now()
  const twoMinutes = 2 * 60 * 1000
  
  return (now - lastSeenDate) < twoMinutes
}

export const formatLastSeen = (lastSeen: string | null | undefined) => {
  if (isUserOnline(lastSeen)) return 'En línea'
  if (!lastSeen) return 'Desconectado'

  const minutes = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000)
  if (minutes < 60) return `Activo hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Activo hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `Activo hace ${days} ${days === 1 ? 'día' : 'días'}`
}