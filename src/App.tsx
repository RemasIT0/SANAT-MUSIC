// src/App.tsx
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabaseClient'

import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import VerificarEmail from './pages/VerificarEmail' 
import Home from './pages/Inicio'
import VerPerfil from './pages/VerPerfil'
import EditarPerfil from './pages/EditarPerfil'
import ChatRoom from './pages/ChatRoom'
import Bandeja from './pages/Bandeja'
import AdminPanel from './pages/AdminPanel'
import RestablecerContrasena from './pages/RestablecerContrasena'
import Baneado from './pages/Baneado'
import BottomNav from './components/BottomNav'
import AnimatedBackground from './components/AnimatedBackground'
import RetroRadio from './components/RetroRadio'
import Toast from './components/Toast'
import MaintenanceScreen from './components/MaintenanceScreen'

import { FaTimes, FaRegEnvelope, FaQuestionCircle, FaEnvelopeOpenText, FaEnvelope, FaPaperPlane, FaSpinner } from 'react-icons/fa'

// CONFIGURACIÓN DE MANTENIMIENTO
//================================= Poner false para desactivar el modo mantenimiento y permitir el acceso a todos los usuarios, incluso si no son administradores. Poner true para activar el modo mantenimiento y bloquear el acceso a todos los usuarios que no sean administradores.

const IS_MAINTENANCE_MODE = true 


//=====================================
const ADMIN_EMAIL = 'remaslove281@gmail.com'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      <p className="text-gray-400 text-sm animate-pulse">Cargando SANAT...</p>
    </div>
  )
}

function BanRedirect() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!loading && !user && localStorage.getItem('sanat_ban_reason')) {
      navigate('/baneado', { replace: true })
    }
  }, [loading, user, navigate])
  return null
}

function LayoutWithNav() {
  // ... (Mantené todo tu código de LayoutWithNav igual que antes, no hace falta cambiarlo) ...
  const { showSuggestionModal, showHelpModal, closeSuggestionModal, closeHelpModal, user } = useAuth()
  const [suggestionText, setSuggestionText] = useState('')
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !user) return;
    setIsSendingSuggestion(true);
    try {
      const { error } = await supabase.from('suggestions').insert({ user_id: user.id, content: suggestionText });
      if (error) throw error;
      setToast({ message: '¡Gracias por tu sugerencia! Nos ayuda a mejorar.', type: 'success' });
      setSuggestionText('');
      closeSuggestionModal();
    } catch (error: any) {
      setToast({ message: 'Error al enviar: ' + error.message, type: 'error' });
    } finally {
      setIsSendingSuggestion(false);
    }
  }

  return (
    <div className="min-h-screen relative">
      <RetroRadio />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="pb-32"><Outlet /></div>
      <BottomNav />
      {/* ... (Aquí va el resto de tus modales de sugerencia y ayuda, cópialos de tu archivo original) ... */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeHelpModal} />
          <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="mb-4"><h3 className="text-xl font-bold text-white flex items-center gap-2"><FaQuestionCircle className="text-blue-400" /> Centro de Ayuda</h3></div>
            <div className="space-y-4 mb-6">
              <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2"><FaEnvelopeOpenText className="text-purple-400" /> ¿No podés iniciar sesión?</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Verificá que tu email esté confirmado (revisá tu bandeja de entrada o spam)</li>
                  <li>• Si olvidaste tu contraseña, usá "¿Olvidaste tu contraseña?" en el login</li>
                </ul>
              </div>
            </div>
            <button onClick={closeHelpModal} className="w-full py-3 bg-[#2a2a2a] hover:bg-[#333] text-white font-semibold rounded-lg transition-all">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ✅ GUARDIA SIMPLE: Solo verifica que haya usuario
function RequireUser() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

// ✅ GUARDIA VERIFICADA: Verifica usuario, email confirmado y perfil
function RequireVerified() {
  const { user, profile, emailConfirmed, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!emailConfirmed) return <Navigate to="/verificar-email" replace />
  if (!profile) return <Navigate to="/onboarding" replace />
  
  // ✅ Doble chequeo de seguridad: Si está en mantenimiento y NO es el admin, lo expulsa
  if (IS_MAINTENANCE_MODE && user.email !== ADMIN_EMAIL) {
    return <MaintenanceScreen />
  }
  
  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedBackground />
      <BanRedirect /> 
      <Routes>
        {/* El login SIEMPRE es accesible. La lógica de mantenimiento va DENTRO del Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
        <Route path="/baneado" element={<Baneado />} /> 
        
        <Route element={<RequireUser />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/verificar-email" element={<VerificarEmail />} />
        </Route>
        
        <Route element={<RequireVerified />}>
          <Route element={<LayoutWithNav />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/perfil/:id" element={<VerPerfil />} />
            <Route path="/editar-perfil" element={<EditarPerfil />} />
            <Route path="/bandeja" element={<Bandeja />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
          <Route path="/chat/:userId" element={<ChatRoom />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App