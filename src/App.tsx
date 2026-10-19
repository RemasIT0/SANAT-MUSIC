// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Home from './pages/Inicio'
import VerPerfil from './pages/VerPerfil'
import EditarPerfil from './pages/EditarPerfil'
import BottomNav from './components/BottomNav'
import AnimatedBackground from './components/AnimatedBackground' 
import ChatRoom from './pages/ChatRoom'

function LoadingScreen() {
  return (
    <div className="min-h-screen  flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      <p className="text-gray-400 text-sm animate-pulse">Cargando SANAT...</p>
    </div>
  )
}

function LayoutWithNav() {
  return (
    <div className="min-h-screen ">
      {/* El Outlet renderiza la página actual (Home, Perfil, etc.) */}
      {/* pb-32 reserva el espacio para que el BottomNav no tape nada */}
      <div className="pb-32">
        <Outlet />
      </div>
      
      {/* El BottomNav flota encima, pero el contenido ya tiene espacio reservado */}
      <BottomNav />
    </div>
  )
}

function RequireUser() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  
  return <Outlet />
}

function RequireAuth() {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/onboarding" replace />
  
  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
          <AnimatedBackground />

      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas que solo requieren usuario logueado */}
        <Route element={<RequireUser />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>
        
        {/* ✅ Rutas que requieren usuario + perfil, con BottomNav automático */}
        <Route element={<RequireAuth />}>
          <Route element={<LayoutWithNav />}>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/perfil/:id" element={<VerPerfil />} />
            <Route path="/editar-perfil" element={<EditarPerfil />} />
          </Route>
          <Route path="/chat/:userId" element={<ChatRoom />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App