// src/components/asistente/adminQueries.ts
// Respuestas del asistente del admin: consultan Supabase y devuelven un
// mensaje listo para mostrar en el chat. Solo funcionan con la sesión de
// admin verificada (las políticas de la base lo exigen).
import { supabase } from '../../lib/supabaseClient'
import { normalize, type BotAction } from './helpTopics'

export interface AdminAnswer {
  text: string
  lines?: string[]
  actions?: BotAction[]
}

const timeAgo = (date: string) => {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (minutes < 60) return `hace ${Math.max(1, minutes)} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`
}

const short = (text: string, max = 70) => (text.length > max ? text.slice(0, max) + '…' : text)

const namesById = async (ids: string[]) => {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return {} as Record<string, string>
  const { data } = await supabase.from('profiles').select('id, display_name, username').in('id', unique)
  const map: Record<string, string> = {}
  data?.forEach(p => { map[p.id] = `${p.display_name} (@${p.username})` })
  return map
}

const PANEL: BotAction = { label: 'Abrir panel admin', to: '/admin' }

export const ADMIN_QUERIES: Record<string, { label: string; keywords: string[]; run: () => Promise<AdminAnswer> }> = {
  resumen: {
    label: '📊 Resumen general',
    keywords: ['resumen', 'estadistica', 'hoy', 'semana', 'como va', 'numeros', 'total'],
    run: async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const count = (q: any) => q.then((r: any) => r.count ?? 0)
      const [users, newUsers, posts, reports, suggestions, banned] = await Promise.all([
        count(supabase.from('profiles').select('*', { count: 'exact', head: true })),
        count(supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo)),
        count(supabase.from('posts').select('*', { count: 'exact', head: true })),
        count(supabase.from('reports').select('*', { count: 'exact', head: true })),
        count(supabase.from('suggestions').select('*', { count: 'exact', head: true })),
        count(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true)),
      ])
      return {
        text: 'Así está SANAT ahora:',
        lines: [
          `👥 ${users} usuarios (${newUsers} nuevos esta semana)`,
          `📝 ${posts} publicaciones activas`,
          `🚩 ${reports} reportes sin archivar`,
          `💡 ${suggestions} sugerencias en el buzón`,
          `⛔ ${banned} usuarios baneados`,
        ],
        actions: [PANEL],
      }
    },
  },
  reportes: {
    label: '🚩 Reportes pendientes',
    keywords: ['reporte', 'denuncia', 'reportaron', 'pendiente'],
    run: async () => {
      const { data } = await supabase.from('reports').select('reporter_id, reported_user_id, reason, created_at').order('created_at', { ascending: false }).limit(5)
      if (!data?.length) return { text: 'No hay reportes pendientes. Todo tranquilo 🎉' }
      const names = await namesById(data.flatMap(r => [r.reporter_id, r.reported_user_id]))
      return {
        text: `Últimos ${data.length} reportes:`,
        lines: data.map(r => `${names[r.reported_user_id] || 'Usuario eliminado'}: "${short(r.reason, 40)}" — lo reportó ${names[r.reporter_id] || 'alguien'}, ${timeAgo(r.created_at)}`),
        actions: [PANEL],
      }
    },
  },
  masReportados: {
    label: '⚠️ Más reportados',
    keywords: ['mas reportado', 'problematico', 'peligroso', 'top reportes'],
    run: async () => {
      const { data } = await supabase.from('reports').select('reported_user_id')
      if (!data?.length) return { text: 'Nadie tiene reportes pendientes.' }
      const counts: Record<string, number> = {}
      data.forEach(r => { if (r.reported_user_id) counts[r.reported_user_id] = (counts[r.reported_user_id] || 0) + 1 })
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
      const names = await namesById(top.map(([id]) => id))
      return {
        text: 'Usuarios con más reportes pendientes:',
        lines: top.map(([id, n]) => `${names[id] || 'Usuario eliminado'} — ${n} ${n === 1 ? 'reporte' : 'reportes'}`),
        actions: [PANEL],
      }
    },
  },
  sugerencias: {
    label: '💡 Últimas sugerencias',
    keywords: ['sugerencia', 'buzon', 'idea', 'opinion', 'propuesta'],
    run: async () => {
      const { data } = await supabase.from('suggestions').select('user_id, content, created_at').order('created_at', { ascending: false }).limit(5)
      if (!data?.length) return { text: 'El buzón de sugerencias está vacío.' }
      const names = await namesById(data.map(s => s.user_id))
      return {
        text: `Últimas ${data.length} sugerencias:`,
        lines: data.map(s => `${names[s.user_id] || 'Anónimo'} (${timeAgo(s.created_at)}): "${short(s.content)}"`),
        actions: [PANEL],
      }
    },
  },
  historial: {
    label: '🗂️ Qué hice / borré',
    keywords: ['borre', 'borrado', 'elimine', 'eliminado', 'historial', 'hice', 'acciones', 'registro', 'banee'],
    run: async () => {
      const { data, error } = await supabase.from('admin_log').select('action, details, created_at').order('created_at', { ascending: false }).limit(10)
      if (error) return { text: 'El historial todavía no está activado: falta correr ADMIN_historial.sql en Supabase.' }
      if (!data?.length) return { text: 'Todavía no hay acciones registradas. A partir de ahora, todo lo que hagas en el panel queda anotado acá.' }
      return {
        text: 'Tus últimas acciones:',
        lines: data.map(a => `${a.action}: ${short(a.details, 60)} — ${timeAgo(a.created_at)}`),
      }
    },
  },
  baneados: {
    label: '⛔ Usuarios baneados',
    keywords: ['baneado', 'ban', 'suspendido', 'bloqueado'],
    run: async () => {
      const { data } = await supabase.from('profiles').select('display_name, username, ban_reason').eq('is_banned', true).limit(10)
      if (!data?.length) return { text: 'No hay usuarios baneados.' }
      return {
        text: `${data.length} ${data.length === 1 ? 'usuario baneado' : 'usuarios baneados'}:`,
        lines: data.map(u => `${u.display_name} (@${u.username}) — ${short(u.ban_reason || 'sin motivo', 50)}`),
        actions: [PANEL],
      }
    },
  },
  nuevos: {
    label: '🆕 Usuarios nuevos',
    keywords: ['nuevo', 'registro', 'registraron', 'ultimos usuarios', 'quien entro'],
    run: async () => {
      const { data } = await supabase.from('profiles').select('display_name, username, localidad, created_at').order('created_at', { ascending: false }).limit(5)
      if (!data?.length) return { text: 'No hay usuarios todavía.' }
      return {
        text: 'Últimos usuarios registrados:',
        lines: data.map(u => `${u.display_name} (@${u.username})${u.localidad ? ` de ${u.localidad}` : ''} — ${timeAgo(u.created_at)}`),
      }
    },
  },
}

export const matchAdminQuery = (input: string): string | null => {
  const text = normalize(input)
  let best: { id: string; score: number } | null = null
  for (const [id, query] of Object.entries(ADMIN_QUERIES)) {
    const score = query.keywords.reduce((acc, kw) => acc + (text.includes(kw) ? kw.length : 0), 0)
    if (score > 0 && (!best || score > best.score)) best = { id, score }
  }
  return best?.id ?? null
}
