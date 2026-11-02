// src/lib/moderation.ts
// Advertencias y avisos de "Administración".
// Los avisos NO salen de la cuenta del admin: se guardan en system_notices y el
// usuario los ve en su bandeja como una conversación de solo lectura.
import { supabase } from './supabaseClient'
import { logAdminAction } from './adminLog'

export const MAX_WARNINGS = 3

export const MODERATION_REASONS = [
  'Spam o publicidad',
  'Contenido inapropiado',
  'Acoso o falta de respeto',
  'Información falsa',
  'Contenido que no es propio (derechos de autor)',
  'Otro motivo',
]

// Freno de seguridad: el admin nunca se modera a sí mismo (ni por error)
async function assertNotSelf(userId: string) {
  const { data } = await supabase.auth.getSession()
  if (data.session?.user.id === userId) throw new Error('No podés advertir ni banear tu propia cuenta')
}

export async function sendSystemNotice(userId: string, title: string, body: string) {
  const { error } = await supabase.from('system_notices').insert({ user_id: userId, title, body })
  if (error) throw error
}

export async function countWarnings(userId: string): Promise<number> {
  const { count, error } = await supabase.from('user_warnings').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  if (error) throw error
  return count || 0
}

interface ModerationInput {
  userId: string
  userName: string
  reason: string
  details: string
  warn: boolean
  notify: boolean
  postContent?: string | null   // si se borró una publicación
}

export interface ModerationResult {
  warnings: number | null
  banned: boolean
}

// Registra la advertencia, avisa al usuario y suspende la cuenta al llegar a 3
export async function applyModeration(input: ModerationInput): Promise<ModerationResult> {
  await assertNotSelf(input.userId)
  const { userId, userName, reason, details, warn, notify, postContent } = input
  const fullReason = details.trim() ? `${reason}: ${details.trim()}` : reason
  let warnings: number | null = null
  let banned = false

  if (warn) {
    const { error } = await supabase.from('user_warnings').insert({ user_id: userId, reason, details: details.trim(), post_content: postContent?.slice(0, 500) || null })
    if (error) throw error
    warnings = await countWarnings(userId)
    logAdminAction('Advertencia', `${userName} (${warnings}/${MAX_WARNINGS}) — ${fullReason}`)

    if (warnings >= MAX_WARNINGS) {
      const { data, error: banError } = await supabase.from('profiles')
        .update({ is_banned: true, ban_reason: `Acumuló ${MAX_WARNINGS} advertencias. Última: ${fullReason}` })
        .eq('id', userId).select('id')
      if (banError) throw banError
      if (!data?.length) throw new Error('No se pudo suspender la cuenta (¿sesión de admin verificada?)')
      banned = true
      logAdminAction('Baneo automático', `${userName} — llegó a ${MAX_WARNINGS} advertencias`)
    }
  }

  if (notify && !banned) {
    const title = postContent ? 'Tu publicación fue eliminada' : 'Recibiste una advertencia'
    const lines = [
      postContent ? `Eliminamos tu publicación porque no cumple las normas de la comunidad.` : `Te escribimos porque detectamos una conducta que no cumple las normas de la comunidad.`,
      `Motivo: ${fullReason}.`,
    ]
    if (warnings !== null) {
      lines.push(`Esta es tu advertencia ${warnings} de ${MAX_WARNINGS}. Al llegar a ${MAX_WARNINGS}, la cuenta se suspende.`)
    }
    lines.push('Podés revisar las normas en "Opciones → Términos y privacidad". Si creés que es un error, escribinos desde el buzón de sugerencias.')
    await sendSystemNotice(userId, title, lines.join('\n\n'))
  }

  return { warnings, banned }
}
