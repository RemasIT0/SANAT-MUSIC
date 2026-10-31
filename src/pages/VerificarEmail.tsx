// src/pages/VerificarEmail.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Mascot from '../components/Mascot'
import Toast from '../components/Toast'
import { FaEnvelope, FaSpinner, FaArrowLeft } from 'react-icons/fa'
import AnimatedBackground from '../components/AnimatedBackground'

export default function VerificarEmail() {
  // ✅ Agregamos emailConfirmed para detectar cuando el usuario valida su correo
  const { user, emailConfirmed } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // ✅ NUEVO: Redirigir automáticamente cuando el email sea confirmado
  useEffect(() => {
    if (emailConfirmed) {
      navigate('/onboarding', { replace: true })
    }
  }, [emailConfirmed, navigate])

  const handleResendEmail = async () => {
    if (!user?.email) return
    
    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: { emailRedirectTo: window.location.origin },
      })

      if (error) throw error
      
      setToast({ 
        message: '¡Email de confirmación reenviado! Revisa tu bandeja de entrada.', 
        type: 'success' 
      })
    } catch (error: any) {
      setToast({ 
        message: 'Error al reenviar: ' + error.message, 
        type: 'error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen relative text-gray-200 font-sans flex items-center justify-center p-4">
      <AnimatedBackground />
      
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex flex-col items-center text-center">
          
          <div className="mb-6">
            <Mascot color="#a855f7" size={100} expression="feliz" />
          </div>

          <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center border-2 border-purple-600/40 mb-6">
            <FaEnvelope className="text-purple-400 text-4xl" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">¡Revisa tu email!</h1>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Te enviamos un link de confirmación a:<br />
            <span className="text-purple-400 font-semibold break-all">{user?.email}</span>
          </p>

          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 mb-6 w-full">
            <p className="text-xs text-gray-500 mb-2">¿No lo encuentras?</p>
            <ul className="text-xs text-gray-400 space-y-1 text-left">
              <li>• Revisa tu carpeta de <strong>Spam</strong> o <strong>Correo no deseado</strong></li>
              <li>• Asegúrate de que el email sea correcto</li>
              <li>• Espera unos minutos, puede tardar en llegar</li>
            </ul>
          </div>

          <button
            onClick={handleResendEmail}
            disabled={loading}
            className={`w-full py-3 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 mb-3 ${
              loading
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-purple-700 text-white hover:bg-purple-600 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]'
            }`}
          >
            {loading ? (
              <><FaSpinner className="animate-spin" /> Reenviando...</>
            ) : (
              <><FaEnvelope /> Reenviar email de confirmación</>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <FaArrowLeft /> Volver al login
          </button>
        </div>
      </div>
    </div>
  )
}