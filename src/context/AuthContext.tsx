import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { type User } from '@supabase/supabase-js'
import { type Profile } from '../types'

// 1. Definimos qué datos tendrá nuestro contexto
interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

// 2. Creamos el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 3. Creamos el Provider (el componente que envolverá nuestra app)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Función para obtener la sesión y el perfil
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          // Si hay usuario, buscamos su perfil en la base de datos
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('Error al obtener perfil:', error)
          } else {
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

    // Escuchar cambios en la autenticación (login, logout, registro)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    // Limpiar la suscripción cuando el componente se desmonte
    return () => subscription.unsubscribe()
  }, [])

  // Función para cerrar sesión
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// 4. Hook personalizado para usar el contexto fácilmente
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}