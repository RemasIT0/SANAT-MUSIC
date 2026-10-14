import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { type User } from '@supabase/supabase-js'
import { type Profile } from '../types'

// 1. Definimos qué datos tendrá nuestro contexto (Agregamos refreshProfile)
interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void> // 👈 AGREGADO
}

// 2. Creamos el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 3. Creamos el Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // --- FUNCIONES ---

  // Función para refrescar el perfil manualmente
  const refreshProfile = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error al refrescar perfil:', error)
    }
  }

  // Función para cerrar sesión
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  // --- EFECTOS ---
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!error && data) {
            setProfile(data)
          }
        }
      } catch (error) {
        console.error('Error inesperado:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data || null)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // --- VALOR DEL CONTEXTO (Debe ir DESPUÉS de declarar las funciones) ---
  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile, // 👈 AHORA SÍ FUNCIONA
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 4. Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}