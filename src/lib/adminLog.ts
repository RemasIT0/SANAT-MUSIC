// src/lib/adminLog.ts
// Historial de acciones del admin (tabla admin_log). Si la tabla todavía no
// existe en Supabase, falla en silencio y la acción principal sigue igual.
import { supabase } from './supabaseClient'

export async function logAdminAction(action: string, details: string) {
  try {
    await supabase.from('admin_log').insert({ action, details })
  } catch {
    // sin historial: no bloquea nada
  }
}
