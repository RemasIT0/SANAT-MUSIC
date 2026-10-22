// src/hooks/useOnlineStatus.ts
import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useOnlineStatus() {
  const { user } = useAuth()

  useEffect(() => {
    console.log("👀 HOOK: useOnlineStatus montado. user =", user ? user.id : "NULL")

    if (!user) {
      console.log("⚠️ HOOK: No hay usuario, saliendo.")
      return
    }

    const updateLastSeen = async () => {
      const now = new Date().toISOString()
      console.log("🔄 HOOK: Intentando actualizar last_seen a:", now)
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ last_seen: now })
        .eq('id', user.id)
        .select() // Agregamos .select() para ver qué responde Supabase
      
      if (error) {
        console.error("❌ HOOK: ERROR DE SUPABASE:", error)
      } else {
        console.log("✅ HOOK: Actualización exitosa. Respuesta:", data)
      }
    }

    // Ejecutar inmediatamente
    updateLastSeen()

    // Ejecutar cada 30 segundos (más rápido para probar)
    const interval = setInterval(updateLastSeen, 30000)
    console.log("⏱️ HOOK: Intervalo configurado cada 30s")

    return () => {
      clearInterval(interval)
      console.log("🛑 HOOK: Intervalo limpiado")
    }
  }, [user])
}

export const isUserOnline = (lastSeen: string | null | undefined) => {
  if (!lastSeen) {
    console.log("⏱️ isUserOnline: last_seen es nulo/undefined")
    return false
  }
  const lastSeenDate = new Date(lastSeen).getTime()
  const now = Date.now()
  const twoMinutes = 2 * 60 * 1000
  const isOnline = (now - lastSeenDate) < twoMinutes
  
  console.log(`⏱️ isUserOnline: lastSeen=${lastSeen}, Diferencia=${Math.round((now - lastSeenDate)/1000)}s, Resultado=${isOnline}`)
  
  return isOnline
}