// src/hooks/useNotifications.ts
// Junta en una sola lista los avisos que estaban repartidos por la app:
// likes a mi publicación, coincidencias, invitaciones a bandas, avisos de la
// administración y eventos a los que dije "voy" que se acercan.
// Lo "nuevo" se cuenta desde la última vez que se abrió el centro (guardado en este dispositivo).
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ADMIN_THREAD_ID } from '../pages/AvisosAdmin'

export type NotificationKind = 'like' | 'match' | 'invite' | 'admin' | 'event'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  text: string
  date: string        // cuándo pasó (para los eventos: cuándo empiezan)
  href: string
  actor?: { name: string; avatar_url: string | null; avatar_color: string }
}

const seenKey = (userId: string) => `sanat_notif_seen_${userId}`
const EVENT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000
const TIME_ZONE = 'America/Argentina/Tucuman'
// Pide que se vuelvan a contar los avisos (por ejemplo, al abrir el centro)
export const NOTIFICATIONS_CHANGED = 'sanat-notifications-changed'

function readSeen(userId: string) {
  try { return localStorage.getItem(seenKey(userId)) || '1970-01-01T00:00:00Z' } catch { return '1970-01-01T00:00:00Z' }
}

export function useNotifications() {
  const { user } = useAuth()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [seenAt, setSeenAt] = useState(() => (user ? readSeen(user.id) : ''))

  const load = useCallback(async () => {
    if (!user) return
    const uid = user.id
    // Cada fuente es independiente: si una falla (tabla que falta, sin permiso), las demás siguen
    const safe = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => { try { return await fn() } catch { return [] } }

    const [admin, matches, likes, invites, events] = await Promise.all([
      safe<AppNotification>(async () => {
        const { data } = await supabase.from('system_notices').select('id, title, body, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(20)
        return (data || []).map((n: any) => ({ id: `admin-${n.id}`, kind: 'admin', title: n.title || 'Aviso de SANAT', text: n.body || '', date: n.created_at, href: `/chat/${ADMIN_THREAD_ID}` }))
      }),
      safe<AppNotification>(async () => {
        const { data } = await supabase.from('match_alerts').select('id, post_id, poster_id, kind, created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(20)
        if (!data?.length) return []
        const { data: people } = await supabase.from('profiles').select('id, display_name, avatar_url, avatar_color').in('id', [...new Set(data.map(a => a.poster_id))])
        return data.map((a: any) => {
          const p = people?.find(x => x.id === a.poster_id)
          const name = p?.display_name || 'Alguien'
          return {
            id: `match-${a.id}`, kind: 'match' as const, date: a.created_at, href: `/perfil/${a.poster_id}`,
            title: a.kind === 'te_buscan' ? `${name} busca lo que tocás` : `${name} puede servirle a tu proyecto`,
            text: a.kind === 'te_buscan' ? 'Coincide tu instrumento, tu zona y algún género.' : 'Publicó que busca banda u ofrece lo que pedís.',
            actor: p ? { name, avatar_url: p.avatar_url, avatar_color: p.avatar_color } : undefined,
          }
        })
      }),
      safe<AppNotification>(async () => {
        const { data: post } = await supabase.from('posts').select('id').eq('user_id', uid).limit(1).maybeSingle()
        if (!post) return []
        const { data } = await supabase.from('post_likes').select('user_id, created_at').eq('post_id', post.id).order('created_at', { ascending: false }).limit(20)
        if (!data?.length) return []
        const { data: people } = await supabase.from('profiles').select('id, display_name, avatar_url, avatar_color').in('id', data.map(l => l.user_id))
        return data.filter(l => l.user_id !== uid).map((l: any) => {
          const p = people?.find(x => x.id === l.user_id)
          const name = p?.display_name || 'Alguien'
          return {
            id: `like-${l.user_id}`, kind: 'like' as const, date: l.created_at, href: `/perfil/${l.user_id}`,
            title: `A ${name} le gustó tu publicación`, text: 'Tocá para ver su perfil.',
            actor: p ? { name, avatar_url: p.avatar_url, avatar_color: p.avatar_color } : undefined,
          }
        })
      }),
      safe<AppNotification>(async () => {
        const { data } = await supabase.from('band_members').select('band_id, created_at').eq('user_id', uid).eq('status', 'invited')
        if (!data?.length) return []
        const { data: bands } = await supabase.from('bands').select('id, name, logo_url').in('id', data.map(m => m.band_id))
        return data.map((m: any) => {
          const band = bands?.find(b => b.id === m.band_id)
          return {
            id: `invite-${m.band_id}`, kind: 'invite' as const, date: m.created_at, href: `/banda/${m.band_id}`,
            title: `Te invitaron a ${band?.name || 'una banda'}`, text: 'Entrá para aceptar o rechazar la invitación.',
            actor: band ? { name: band.name, avatar_url: band.logo_url, avatar_color: '#7e22ce' } : undefined,
          }
        })
      }),
      safe<AppNotification>(async () => {
        const { data: rsvps } = await supabase.from('event_rsvps').select('event_id').eq('user_id', uid).eq('status', 'voy')
        if (!rsvps?.length) return []
        const now = new Date()
        const { data } = await supabase.from('events').select('id, title, place, starts_at').in('id', rsvps.map(r => r.event_id))
          .gte('starts_at', new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString())
          .lte('starts_at', new Date(now.getTime() + EVENT_WINDOW_MS).toISOString())
        return (data || []).map((e: any) => {
          const when = new Intl.DateTimeFormat('es-AR', { timeZone: TIME_ZONE, weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(e.starts_at))
          return { id: `event-${e.id}`, kind: 'event' as const, date: e.starts_at, href: '/agenda', title: `Se viene: ${e.title}`, text: `${when} h · ${e.place}` }
        })
      }),
    ])

    const news = [...admin, ...matches, ...likes, ...invites].sort((a, b) => b.date.localeCompare(a.date))
    setItems([...events.sort((a, b) => a.date.localeCompare(b.date)), ...news])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) return
    setSeenAt(readSeen(user.id))
    load()
    // Se actualiza al volver a la app, cada minuto y cuando otra parte avisa que cambió algo
    const onFocus = () => { if (document.visibilityState === 'visible') load() }
    const onChanged = () => { setSeenAt(readSeen(user.id)); load() }
    const timer = window.setInterval(load, 60_000)
    document.addEventListener('visibilitychange', onFocus)
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged)
    }
  }, [user, load])

  // Los eventos no suman al número: son recordatorios, no novedades
  const isNew = useCallback((n: AppNotification) => n.kind !== 'event' && n.date > seenAt, [seenAt])
  const unreadCount = items.filter(isNew).length

  const markAllSeen = useCallback(() => {
    if (!user) return
    const now = new Date().toISOString()
    try { localStorage.setItem(seenKey(user.id), now) } catch {}
    setSeenAt(now)
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
  }, [user])

  return { items, loading, unreadCount, isNew, markAllSeen, refresh: load }
}
