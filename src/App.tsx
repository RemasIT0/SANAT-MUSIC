// src/App.tsx
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabaseClient'
import { useOnlineStatus } from './hooks/useOnlineStatus' // ✅ NUEVO IMPORT


import Notificaciones from './pages/Notificaciones'
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

import ProfileEditor from './components/ProfileEditor'

import { FaTimes, FaRegEnvelope, FaQuestionCircle, FaEnvelopeOpenText, FaEnvelope, FaPaperPlane, FaSpinner, } from 'react-icons/fa'
import { FaRadio } from "react-icons/fa6";
import { FaUser } from "react-icons/fa";
import { FaMusic } from "react-icons/fa";

const IS_MAINTENANCE_MODE = false 
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
  const { showSuggestionModal, showHelpModal, closeSuggestionModal, closeHelpModal, user } = useAuth()
  const [suggestionText, setSuggestionText] = useState('')
  const [isSendingSuggestion, setIsSendingSuggestion] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // ✅ ACTIVAR RASTREO DE "EN LÍNEA" PARA ESTE USUARIO
  useOnlineStatus()

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
      
      {showSuggestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeSuggestionModal} />
          <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><FaRegEnvelope className="text-purple-400" /> Buzón de Sugerencias</h3>
              <button onClick={closeSuggestionModal} className="text-gray-500 hover:text-white transition-colors"><FaTimes size={20} /></button>
            </div>
            <p className="text-gray-400 text-sm mb-4">¿Tenés una idea, encontraste un error o querés pedir una función? ¡Tu opinión nos ayuda a mejorar SANAT!</p>
            <textarea value={suggestionText} onChange={(e) => setSuggestionText(e.target.value)} placeholder="Escribí tu sugerencia aquí..." className="w-full h-32 p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 resize-none mb-4 placeholder:text-gray-600" />
            <button onClick={handleSendSuggestion} disabled={isSendingSuggestion || !suggestionText.trim()} className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
              {isSendingSuggestion ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />} {isSendingSuggestion ? 'Enviando...' : 'Enviar Sugerencia'}
            </button>
          </div>
        </div>
      )}

{showHelpModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out] ">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeHelpModal} />
<div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">      
      <div className="mb-4 ">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <FaQuestionCircle className="text-blue-400" /> Centro de Ayuda
        </h3>
      </div>
      
      <div className="space-y-4 mb-6 ">
        {/* Sección 1: Cuenta */}
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
          <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <FaEnvelopeOpenText className="text-purple-400" /> ¿No podés iniciar sesión?
          </h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Verificá que tu email esté confirmado (revisá spam)</li>
            <li>• Si olvidaste tu contraseña, usá "¿Olvidaste tu contraseña?"</li>
            <li>• Si ves "email rate limit exceeded", esperá 1 hora e intentá de nuevo</li>
          </ul>
        </div>

        {/* Sección 2: Perfil */}
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
          <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <FaUser className="text-green-400" /> Mi Perfil
          </h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Podés cambiar tu foto, colores y géneros en "Editar Perfil"</li>
            <li>• El punto verde  significa que estás en línea</li>
            <li>• Solo podés tener UNA publicación activa a la vez</li>
          </ul>
        </div>

        {/* Sección 3: Publicaciones */}
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
          <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <FaMusic className="text-pink-400" /> Publicaciones
          </h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Usá los filtros para buscar por género o zona</li>
            <li>• Dale ❤️ a los posts que te gusten</li>
            <li>• Envíá mensajes privados desde el botón "Enviar mensaje"</li>
          </ul>
        </div>

        {/* Sección 4: Radio */}
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
          <h4 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
            <FaRadio className="text-yellow-400" /> Radio SANAT
          </h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Tocá el cassette para expandir los controles</li>
            <li>• La radio recuerda tu última estación y volumen</li>
            <li>• Funciona en segundo plano mientras navegás</li>
          </ul>
        </div>

        {/* Sección 5: Contacto */}
        <div className="bg-purple-900/20 border border-purple-700/40 rounded-lg p-4">
          <h4 className="text-white font-semibold text-sm mb-2">¿Encontraste un bug?</h4>
          <p className="text-xs text-gray-400 mb-2">
            Usá el botón de "Buzón de Sugerencias" para reportarlo. ¡Tus sugerencias nos ayudan a mejorar!
          </p>
        </div>
      </div>

      <button onClick={closeHelpModal} className="w-full py-3 bg-[#2a2a2a] hover:bg-[#333] text-white font-semibold rounded-lg transition-all">
        Entendido
      </button>
    </div>
  </div>
)}
    </div>
  )
}

function RequireUser() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireVerified() {
  const { user, profile, emailConfirmed, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!emailConfirmed) return <Navigate to="/verificar-email" replace />
  if (!profile) return <Navigate to="/onboarding" replace />
  
  if (IS_MAINTENANCE_MODE && user.email !== ADMIN_EMAIL) {
    return <MaintenanceScreen />
  }
  
  return <Outlet />
}

// Componente wrapper para usar useNavigate correctamente
function ProfileEditorRoute() {
  const navigate = useNavigate()
  const { user } = useAuth()
  return <ProfileEditor onClose={() => navigate(`/perfil/${user?.id}`)} />
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedBackground />
      <BanRedirect /> 
      <Routes>
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
            <Route path="/editar-perfil/diseno" element={<ProfileEditorRoute />} />
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