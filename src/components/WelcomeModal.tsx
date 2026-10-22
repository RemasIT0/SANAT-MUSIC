// src/components/WelcomeModal.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import Mascot from './Mascot'
import { FaBullhorn, FaLock, FaHandRock } from 'react-icons/fa'

export default function WelcomeModal() {
  const { user, profile } = useAuth()
  const [visible, setVisible] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Si no hay usuario o perfil, no hacemos nada
    if (!user || !profile) return

    // 1️⃣ CHEQUEO RÁPIDO: Si el navegador ya sabe que lo vio, ni siquiera consultamos la DB
    const hasSeenInStorage = localStorage.getItem(`sanat_welcome_seen_${user.id}`)
    if (hasSeenInStorage === 'true') return

    // 2️⃣ CHEQUEO EN BASE DE DATOS: Verificamos la columna 'welcome_seen'
    const yaVioEnDB = (profile as any)?.welcome_seen === true

    if (!yaVioEnDB) {
      // Pequeño delay para que la animación de entrada de la app termine suavemente
      const timer = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(timer)
    }
  }, [user, profile])

  const handleClose = async () => {
    if (isSaving) return // Evita doble clic
    setIsSaving(true)
    setVisible(false)

    if (user) {
      // A. Guardamos en el navegador para que sea instantáneo en futuros reloads
      localStorage.setItem(`sanat_welcome_seen_${user.id}`, 'true')

      // B. Guardamos en la base de datos para que persista si cambia de dispositivo
      const { error } = await supabase
        .from('profiles')
        .update({ welcome_seen: true })
        .eq('id', user.id)
      
      if (error) {
        console.error('No se pudo guardar welcome_seen en DB:', error)
        // No pasa nada grave, el localStorage ya lo protege en este dispositivo
      }
    }
    setIsSaving(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-[scaleIn_0.3s_ease-out]">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-purple-600/40 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl shadow-purple-900/30">
        
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-600/30 rounded-full blur-2xl"></div>
            <div className="relative mascot-wiggle">
              <Mascot color="#a855f7" size={90} expression="feliz" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          ¡Bienvenido a SANAT! 
        </h2>
        
        {/* ✅ TEXTO AJUSTADO: Más inclusivo, sin asumir que todos son músicos */}
        <p className="text-gray-400 text-sm text-center mb-6">
          La comunidad de amantes del sonido en Tucumán. Antes de empezar, tené en cuenta estas 3 reglas:
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3">
            <div className="w-9 h-9 bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaBullhorn className="text-purple-400" size={14} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Una publicación a la vez</p>
              <p className="text-gray-500 text-xs">Podés editarla cuando quieras, pero solo una activa por usuario.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3">
            <div className="w-9 h-9 bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaLock className="text-blue-400" size={14} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Cuidá tus datos</p>
              <p className="text-gray-500 text-xs">No publiques teléfono ni dirección exacta. Coordiná por el chat interno.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl p-3">
            <div className="w-9 h-9 bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <FaHandRock className="text-green-400" size={14} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Respeto ante todo</p>
              {/* ✅ TEXTO AJUSTADO: "Somos una comunidad" en lugar de "Somos músicos" */}
              <p className="text-gray-500 text-xs">Somos una comunidad buscando conectar. El maltrato no tiene lugar acá.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          disabled={isSaving}
          className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-purple-800 disabled:cursor-wait text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-900/40 hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  )
}