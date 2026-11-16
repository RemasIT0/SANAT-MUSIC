// src/pages/VerificarEmail.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'
import ConfirmEmailSteps from '../components/ConfirmEmailSteps'
import { FaArrowLeft } from 'react-icons/fa'
import AnimatedBackground from '../components/AnimatedBackground'

export default function VerificarEmail() {
  // ✅ Agregamos emailConfirmed para detectar cuando el usuario valida su correo
  const { user, emailConfirmed } = useAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // ✅ NUEVO: Redirigir automáticamente cuando el email sea confirmado
  useEffect(() => {
    if (emailConfirmed) {
      navigate('/onboarding', { replace: true })
    }
  }, [emailConfirmed, navigate])

  const handleResendEmail = async () => {
    if (!user?.email) return false
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email, options: { emailRedirectTo: window.location.origin } })
    if (error) {
      setToast({ message: /rate limit|seconds/i.test(error.message) ? 'Esperá un poquito antes de pedir otro mail.' : 'No se pudo reenviar: ' + error.message, type: 'error' })
      return false
    }
    setToast({ message: 'Te mandamos otro mail. Revisá también Spam y Promociones.', type: 'success' })
    return true
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
        <div className="flex flex-col">
          <h1 className="nota text-2xl self-center mb-6">¡Revisá tu email!</h1>
          <ConfirmEmailSteps email={user?.email || ''} onResend={handleResendEmail} sentAt={0} />
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