import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Home from './pages/Inicio'
import Profile from './pages/Perfiles'
import Onboarding from './pages/Onboarding'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Conectando..." />
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    )
  }

  const isProfileComplete = profile?.username && profile?.instruments?.length > 0

  if (!isProfileComplete) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<Onboarding />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App