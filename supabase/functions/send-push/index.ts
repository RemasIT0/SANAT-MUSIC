// supabase/functions/send-push/index.ts
// Manda notificaciones push (con la app cerrada) cuando se inserta una fila en
// messages, system_notices o match_alerts. La disparan los "Database Webhooks".
//
// Secretos necesarios (Supabase → Edge Functions → Secrets):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, WEBHOOK_SECRET
// (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya los pone Supabase solo.)
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

webpush.setVapidDetails(
  'mailto:remaslove281@gmail.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

interface Push { userId: string; title: string; body: string; url: string; tag: string }

const short = (text: string, max = 110) => (text || '').length > max ? text.slice(0, max) + '…' : (text || '')

const nameOf = async (id: string) => {
  const { data } = await supabase.from('profiles').select('display_name').eq('id', id).maybeSingle()
  return data?.display_name || 'Alguien'
}

// Arma el aviso según la tabla (mismas "tag" que usa la app, para no repetir)
async function buildPush(table: string, record: any): Promise<Push | null> {
  if (table === 'messages') {
    if (!record.receiver_id || record.receiver_id === record.sender_id) return null
    const name = await nameOf(record.sender_id)
    const body = record.shared_profile_id ? 'Te compartió un perfil' : record.post_id ? 'Te compartió una publicación' : short(record.content)
    return { userId: record.receiver_id, title: `💬 ${name}`, body, url: `/chat/${record.sender_id}`, tag: `chat-${record.sender_id}` }
  }
  if (table === 'system_notices') {
    return { userId: record.user_id, title: '🛡️ SANAT', body: short(record.title || 'Tenés un aviso nuevo'), url: '/chat/administracion', tag: 'admin-notice' }
  }
  if (table === 'match_alerts') {
    const name = await nameOf(record.poster_id)
    return record.kind === 'te_buscan'
      ? { userId: record.user_id, title: '🥁 ¡Te buscan!', body: `${name} busca lo que tocás. Escribile.`, url: '/guardados?tab=coincidencias', tag: `match-${record.post_id}` }
      : { userId: record.user_id, title: '🎸 Hay alguien para tu proyecto', body: `${name} toca lo que estás buscando.`, url: '/guardados?tab=coincidencias', tag: `match-${record.post_id}` }
  }
  return null
}

Deno.serve(async (req) => {
  // Solo acepta llamadas de nuestros webhooks (llevan este encabezado secreto)
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) {
    return new Response('No autorizado', { status: 401 })
  }

  const payload = await req.json().catch(() => null)
  if (!payload || payload.type !== 'INSERT' || !payload.record) return new Response('ignorado')

  const push = await buildPush(payload.table, payload.record)
  if (!push) return new Response('ignorado')

  // No avisar a cuentas baneadas
  const { data: profile } = await supabase.from('profiles').select('is_banned').eq('id', push.userId).maybeSingle()
  if (profile?.is_banned) return new Response('ignorado')

  const { data: subscriptions } = await supabase.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', push.userId)
  if (!subscriptions?.length) return new Response('sin dispositivos')

  const message = JSON.stringify({ title: push.title, body: push.body, url: push.url, tag: push.tag })
  let sent = 0
  await Promise.all(subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, message, { TTL: 60 * 60 * 24 })
      sent++
    } catch (error: any) {
      // El dispositivo ya no existe (desinstaló, borró datos...): lo sacamos
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      } else {
        console.error('Error enviando push:', error?.statusCode, error?.body || error?.message)
      }
    }
  }))

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})
