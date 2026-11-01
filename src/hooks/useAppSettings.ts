// src/hooks/useAppSettings.ts
// Configuración global de la app (fila única en public.app_settings).
// Se actualiza en tiempo real cuando el admin la cambia.
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface AppSettings {
  banner_enabled: boolean
  banner_text: string
  // Donaciones (columnas agregadas por DONACIONES.sql; pueden no existir todavía)
  donation_enabled?: boolean
  donation_text?: string
  donation_alias?: string
  donation_link?: string
}

export const DEFAULT_DONATION_TEXT = 'SANAT es gratis y sin publicidad. Si te sirve y querés ayudar a pagar los servidores para que siga creciendo, podés colaborar con lo que quieras.'

export const DEFAULT_BANNER_TEXT = 'Versión de prueba: puede haber errores y los datos podrían reiniciarse.'

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      // select('*'): así funciona aunque todavía no existan las columnas de donación
      const { data } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle()
      if (active && data) setSettings(data)
    }
    load()

    // Nombre único: el hook se usa en varios componentes a la vez
    const channel = supabase
      .channel(`app-settings-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, (payload) => {
        setSettings(payload.new as AppSettings)
      })
      .subscribe()

    return () => { active = false; supabase.removeChannel(channel) }
  }, [])

  const updateSettings = async (changes: Partial<AppSettings> | Record<string, unknown>) => {
    const { error } = await supabase.from('app_settings').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', 1)
    if (!error) setSettings(prev => prev ? { ...prev, ...changes } : prev)
    return error
  }

  return { settings, updateSettings }
}
