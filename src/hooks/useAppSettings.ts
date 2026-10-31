// src/hooks/useAppSettings.ts
// Configuración global de la app (fila única en public.app_settings).
// Se actualiza en tiempo real cuando el admin la cambia.
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface AppSettings {
  banner_enabled: boolean
  banner_text: string
}

export const DEFAULT_BANNER_TEXT = 'Versión de prueba: puede haber errores y los datos podrían reiniciarse.'

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await supabase.from('app_settings').select('banner_enabled, banner_text').eq('id', 1).maybeSingle()
      if (active && data) setSettings(data)
    }
    load()

    // Nombre único: el hook se usa en varios componentes a la vez
    const channel = supabase
      .channel(`app-settings-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, (payload) => {
        const row = payload.new as AppSettings
        setSettings({ banner_enabled: row.banner_enabled, banner_text: row.banner_text })
      })
      .subscribe()

    return () => { active = false; supabase.removeChannel(channel) }
  }, [])

  const updateSettings = async (changes: Partial<AppSettings>) => {
    const { error } = await supabase.from('app_settings').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', 1)
    if (!error) setSettings(prev => prev ? { ...prev, ...changes } : prev)
    return error
  }

  return { settings, updateSettings }
}
