// src/App.tsx
import { useState, useEffect, lazy, Suspense, type ComponentType } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabaseClient'
import { useOnlineStatus } from './hooks/useOnlineStatus' // ✅ NUEVO IMPORT


import Notificaciones from './pages/Notificaciones'
import AvisosAdmin, { ADMIN_THREAD_ID } from './pages/AvisosAdmin'
import BottomNav from './components/BottomNav'
import AnimatedBackground from './components/AnimatedBackground'
import RetroRadio from './components/RetroRadio'
import Toast from './components/Toast'
import MaintenanceScreen from './components/MaintenanceScreen'
import AdminSecretGate from './components/AdminSecretGate'
import TestBanner from './components/TestBanner'
import DeviceNotifications from './components/DeviceNotifications'


import { FaTimes, FaRegEnvelope, FaQuestionCircle, FaEnvelopeOpenText, FaEnvelope, FaPaperPlane, FaSpinner, } from 'react-icons/fa'
import { FaRadio } from "react-icons/fa6";
import { FaUser } from "react-icons/fa";
import { FaMusic } from "react-icons/fa";


// Cada pantalla se descarga recién cuando se entra (la primera carga es mucho más liviana).
// Si justo se publicó una versión nueva y el archivo viejo ya no existe, se recarga la página una vez.
function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await load()
      sessionStorage.removeItem('sanat_chunk_reload')
      return mod
    } catch (error) {
      if (!sessionStorage.getItem('sanat_chunk_reload')) {
        sessionStorage.setItem('sanat_chunk_reload', '1')
        window.location.reload()
        return new Promise<{ default: T }>(() => {})
      }
      throw error
    }
  })
}

const Login = lazyPage(() => import('./pages/Login'))
const Onboarding = lazyPage(() => import('./pages/Onboarding'))
const VerificarEmail = lazyPage(() => import('./pages/VerificarEmail'))
const Home = lazyPage(() => import('./pages/Inicio'))
const VerPerfil = lazyPage(() => import('./pages/VerPerfil'))
const EditarPerfil = lazyPage(() => import('./pages/EditarPerfil'))
const ChatRoom = lazyPage(() => import('./pages/ChatRoom'))
const Bandeja = lazyPage(() => import('./pages/Bandeja'))
const Guardados = lazyPage(() => import('./pages/Guardados'))
const Demos = lazyPage(() => import('./pages/Demos'))
const Bandas = lazyPage(() => import('./pages/Bandas'))
const Banda = lazyPage(() => import('./pages/Banda'))
const Agenda = lazyPage(() => import('./pages/Agenda'))
const AdminPanel = lazyPage(() => import('./pages/AdminPanel'))
const RestablecerContrasena = lazyPage(() => import('./pages/RestablecerContrasena'))
const Baneado = lazyPage(() => import('./pages/Baneado'))
const Legal = lazyPage(() => import('./pages/Legal'))
const FreeProfileEditor = lazyPage(() => import('./components/free/FreeProfileEditor'))

const IS_MAINTENANCE_MODE = false
const ADMIN_EMAIL = 'remaslove281@gmail.com'

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-purple-600" />
    </div>
  )
}

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
      <div className="pb-32"><Suspense fallback={<PageLoader />}><Outlet /></Suspense></div>
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
            <button onClick={handleSendSuggestion} disabled={isSendingSuggestion || !suggestionText.trim()} className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:bg-[#2a2a2a] disabled:text-gray-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
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

function ProfileRetryScreen({ onRetry }: { onRetry: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0f0f0f] text-center px-6">
      <p className="text-white font-semibold">No pudimos cargar tu perfil</p>
      <p className="text-sm text-gray-400 max-w-xs">Parece un problema de conexión. Tus datos están bien guardados.</p>
      <button onClick={async () => { setBusy(true); await onRetry(); setBusy(false) }} disabled={busy} className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold disabled:opacity-50">
        {busy ? 'Reintentando...' : 'Reintentar'}
      </button>
    </div>
  )
}

function RequireVerified() {
  const { user, profile, emailConfirmed, loading, profileStatus, refreshProfile } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!emailConfirmed) return <Navigate to="/verificar-email" replace />
  // Si no se pudo leer el perfil por conexión, NO es una cuenta nueva: reintentar
  if (!profile && profileStatus === 'error') return <ProfileRetryScreen onRetry={refreshProfile} />
  if (!profile) return <Navigate to="/onboarding" replace />

  if (IS_MAINTENANCE_MODE && user.email !== ADMIN_EMAIL) {
    return <MaintenanceScreen />
  }

  // La cuenta admin necesita responder la pregunta secreta antes de entrar
  if (user.email === ADMIN_EMAIL) {
    return <AdminSecretGate><DeviceNotifications /><Outlet /></AdminSecretGate>
  }

  return <><DeviceNotifications /><Outlet /></>
}

// Componente wrapper para usar useNavigate correctamente
function ProfileEditorRoute() {
  const navigate = useNavigate()
  const { user } = useAuth()
  return <FreeProfileEditor onClose={() => navigate(`/perfil/${user?.id}`)} />
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedBackground />
      <TestBanner />
      <BanRedirect />
      <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/restablecer-contrasena" element={<RestablecerContrasena />} />
        <Route path="/baneado" element={<Baneado />} />
        <Route path="/legal" element={<Legal />} />

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
            <Route path="/guardados" element={<Guardados />} />
            <Route path="/demos" element={<Demos />} />
            <Route path="/bandas" element={<Bandas />} />
            <Route path="/banda/:id" element={<Banda />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
          <Route path={`/chat/${ADMIN_THREAD_ID}`} element={<AvisosAdmin />} />
          <Route path="/chat/:userId" element={<ChatRoom />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App