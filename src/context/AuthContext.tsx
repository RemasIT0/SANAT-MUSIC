// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { type User } from '@supabase/supabase-js'
import { type Profile } from '../types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  emailConfirmed: boolean
  showSuggestionModal: boolean
  showHelpModal: boolean
  openSuggestionModal: () => void
  closeSuggestionModal: () => void
  openHelpModal: () => void
  closeHelpModal: () => void
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isProfileComplete = (data: any) => {
  if (!data) return false
  const tieneNombre = !!data.username && !!data.display_name
  const tieneDatosOnboarding = 
    !!data.departamento || 
    !!data.localidad || 
    (Array.isArray(data.instruments) && data.instruments.length > 0) ||
    (Array.isArray(data.genres) && data.genres.length > 0)
  return tieneNombre && tieneDatosOnboarding
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [emailConfirmed, setEmailConfirmed] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // 🚫 BAN: si el perfil está baneado, cierra sesión y guarda el motivo
  const applyBannedCheck = async (data: any): Promise<boolean> => {
    if (data?.is_banned) {
      localStorage.setItem('sanat_ban_reason', data.ban_reason || 'Sin motivo especificado')
      await supabase.auth.signOut()
      return true
    }
    return false
  }

  const refreshProfile = async () => {
    if (!user) return
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data && (await applyBannedCheck(data))) return
      setProfile(isProfileComplete(data) ? data : null)
    } catch (e) {
      console.error("Error refrescando perfil:", e)
      setProfile(null)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setEmailConfirmed(false)
  }

  const openSuggestionModal = () => setShowSuggestionModal(true)
  const closeSuggestionModal = () => setShowSuggestionModal(false)
  const openHelpModal = () => setShowHelpModal(true)
  const closeHelpModal = () => setShowHelpModal(false)

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return

        if (session?.user) {
          setEmailConfirmed(!!session.user.email_confirmed_at)
          const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          if (!error && data) {
            const banned = await applyBannedCheck(data)
            setProfile(!banned && isProfileComplete(data) ? data : null)
          } else {
            setProfile(null)
          }
        } else {
          setProfile(null)
          setEmailConfirmed(false)
        }
      } catch (error) {
        console.error("Error verificando sesión:", error)
        setProfile(null)
        setEmailConfirmed(false)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      if (event === 'SIGNED_IN') setLoading(true)

      setUser(session?.user ?? null)
      setEmailConfirmed(!!session?.user?.email_confirmed_at)

      if (session?.user) {
        try {
          const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
          if (!error && data) {
            const banned = await applyBannedCheck(data)
            setProfile(!banned && isProfileComplete(data) ? data : null)
          } else {
            setProfile(null)
          }
        } catch (error) {
          console.error("Error en onAuthStateChange:", error)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      emailConfirmed,
      showSuggestionModal,
      showHelpModal,
      openSuggestionModal,
      closeSuggestionModal,
      openHelpModal,
      closeHelpModal,
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}