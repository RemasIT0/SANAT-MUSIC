// src/hooks/useAdminAlerts.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const ADMIN_EMAIL = 'remaslove281@gmail.com'

const LAST_SEEN_KEY = 'sanat_admin_last_seen'
const SEEN_EVENT = 'sanat-admin-seen'

const getLastSeen = () => {
  try { return localStorage.getItem(LAST_SEEN_KEY) || new Date(0).toISOString() } catch { return new Date(0).toISOString() }
}

// Llamar al abrir el panel de admin: lo que había hasta ahora deja de contar como nuevo
export function markAdminAlertsSeen() {
  try { localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString()) } catch {}
  window.dispatchEvent(new Event(SEEN_EVENT))
}

// Cuenta reportes y sugerencias nuevos (solo para el admin)
export function useAdminAlerts() {
  const { user } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL
  const [alerts, setAlerts] = useState({ reports: 0, suggestions: 0 })

  useEffect(() => {
    if (!isAdmin) return

    const fetchAlerts = async () => {
      const since = getLastSeen()
      const [reports, suggestions] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }).gt('created_at', since),
        supabase.from('suggestions').select('*', { count: 'exact', head: true }).gt('created_at', since),
      ])
      setAlerts({ reports: reports.count || 0, suggestions: suggestions.count || 0 })
    }

    fetchAlerts()

    // Nombre único por instancia: el hook se usa en varios componentes a la vez
    // y Supabase reutiliza un canal con el mismo nombre (ya suscrito)
    const channel = supabase
      .channel(`admin-alerts-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, fetchAlerts)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'suggestions' }, fetchAlerts)
      .subscribe()

    // Respaldo por si Realtime no está activado en esas tablas
    const interval = setInterval(fetchAlerts, 60000)
    window.addEventListener(SEEN_EVENT, fetchAlerts)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
      window.removeEventListener(SEEN_EVENT, fetchAlerts)
    }
  }, [isAdmin])

  return { isAdmin, ...alerts, total: alerts.reports + alerts.suggestions }
}
