// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { unsubscribePush } from '../lib/pwa'
import { setMonitoringUser } from '../lib/monitoring'
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
  // 'error' = no se pudo leer el perfil (conexión). NO significa que no exista.
  profileStatus: ProfileStatus
}

type ProfileStatus = 'ok' | 'missing' | 'error'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const isProfileComplete = (data: any) => {
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
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('ok')

  // Los avisos de error se asocian solo al id de la cuenta (nunca al mail)
  useEffect(() => { setMonitoringUser(user?.id ?? null) }, [user?.id])
  // Perfil ya cargado: si una lectura falla, se conserva en vez de mandar al onboarding
  const profileRef = useRef<Profile | null>(null)

  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const applyBannedCheck = async (data: any): Promise<boolean> => {
    if (data?.is_banned) {
      localStorage.setItem('sanat_ban_reason', data.ban_reason || 'Sin motivo especificado')
      await supabase.auth.signOut()
      return true
    }
    return false
  }

  // Lee el perfil distinguiendo "no existe" de "falló la conexión" (reintenta 3 veces).
  // Antes, cualquier falla momentánea (por ejemplo al volver a una pestaña dormida)
  // se tomaba como "no tiene perfil" y mandaba al onboarding, que pisaba los datos.
  const loadProfile = async (userId: string) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        if (!error) {
          if (data && (await applyBannedCheck(data))) { profileRef.current = null; setProfile(null); setProfileStatus('missing'); return }
          const complete = isProfileComplete(data) ? (data as Profile) : null
          profileRef.current = complete
          setProfile(complete)
          setProfileStatus(complete ? 'ok' : 'missing')
          return
        }
        console.warn('No se pudo leer el perfil (intento ' + (attempt + 1) + '):', error.message)
      } catch (e) {
        console.warn('No se pudo leer el perfil (intento ' + (attempt + 1) + '):', e)
      }
      await new Promise(r => setTimeout(r, 1200 * (attempt + 1)))
    }
    // Falló de verdad: si ya teníamos el perfil, lo conservamos
    if (profileRef.current) { setProfile(profileRef.current); setProfileStatus('ok') }
    else setProfileStatus('error')
  }

  const refreshProfile = async () => {
    if (!user) return
    await loadProfile(user.id)
  }

  const signOut = async () => {
    await unsubscribePush()
    await supabase.auth.signOut()
    setUser(null)
    profileRef.current = null
    setProfile(null)
    setEmailConfirmed(false)
  }

  const openSuggestionModal = () => setShowSuggestionModal(true)
  const closeSuggestionModal = () => setShowSuggestionModal(false)
  const openHelpModal = () => setShowHelpModal(true)
  const closeHelpModal = () => setShowHelpModal(false)

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`ban-check-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.new.is_banned === true) {
            localStorage.setItem('sanat_ban_reason', payload.new.ban_reason || 'Sin motivo especificado')
            await supabase.auth.signOut()
            // Forzar redirección y recarga para limpiar cualquier estado en memoria
            window.location.href = '/login'
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return

        if (session?.user) {
          setEmailConfirmed(!!session.user.email_confirmed_at)
          await loadProfile(session.user.id)
        } else {
          profileRef.current = null
          setProfile(null)
          setEmailConfirmed(false)
        }
      } catch (error) {
        console.error("Error verificando sesión:", error)
        if (!profileRef.current) setProfileStatus('error')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
      setEmailConfirmed(!!session?.user?.email_confirmed_at)

      if (!session?.user) {
        profileRef.current = null
        setProfile(null)
        setProfileStatus('ok')
        if (isMounted) setLoading(false)
        return
      }

      // Renovación de la sesión (pasa sola, por ejemplo al volver a una pestaña dormida):
      // la persona es la misma, no hace falta volver a leer el perfil
      const sameUser = profileRef.current?.id === session.user.id
      if (sameUser && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
        if (isMounted) setLoading(false)
        return
      }

      if (event === 'SIGNED_IN') setLoading(true)
      await loadProfile(session.user.id)
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
      profileStatus,
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