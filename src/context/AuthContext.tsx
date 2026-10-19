// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { type User } from '@supabase/supabase-js'
import { type Profile } from '../types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 🛡️ VALIDACIÓN INTELIGENTE: Detecta si el usuario realmente completó el Onboarding
const isProfileComplete = (data: any) => {
  if (!data) return false
  
  // 1. Debe tener nombre de usuario y nombre para mostrar
  const tieneNombre = !!data.username && !!data.display_name
  
  // 2. Debe tener al menos un dato que SOLO se llena en el Onboarding
  // Si el usuario cerró la pestaña antes de guardar, estos serán null o vacíos
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
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (!user) return
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
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
  }

  useEffect(() => {
    let isMounted = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!isMounted) return

        if (session?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!error && isProfileComplete(data)) {
            setProfile(data)
          } else {
            setProfile(null) // 👈 Esto forzará la redirección a /onboarding
          }
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error("Error verificando sesión:", error)
        setProfile(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      if (event === 'SIGNED_IN') {
        setLoading(true)
      }

      setUser(session?.user ?? null)
      
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (!error && isProfileComplete(data)) {
            setProfile(data)
          } else {
            setProfile(null) // 👈 Esto forzará la redirección a /onboarding
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
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}