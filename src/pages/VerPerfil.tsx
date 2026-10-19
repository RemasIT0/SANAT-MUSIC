// src/pages/VerPerfil.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { type Profile } from '../types'
import Mascot from '../components/Mascot'
import Avatar from '../components/Avatar'
import { FaMapMarkerAlt, FaGuitar, FaMusic, FaEnvelope, FaSpinner, FaImage, FaEdit } from 'react-icons/fa'
import AnimatedBackground from '../components/AnimatedBackground'

export default function VerPerfil() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', id)
          .order('created_at', { ascending: false })

        if (postsError) throw postsError
        setPosts(postsData || [])
      } catch (error) {
        console.error('Error al cargar perfil:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4">
        <FaSpinner className="animate-spin text-4xl text-purple-600" />
        <p className="text-gray-400 text-sm animate-pulse">Cargando perfil...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4 text-gray-400">
        <p className="text-xl">Perfil no encontrado.</p>
        <button onClick={() => navigate('/home')} className="text-purple-400 hover:text-purple-300 font-medium">
          Volver al Home
        </button>
      </div>
    )
  }

  const isMyProfile = user?.id === profile.id
  
  // ✅ Color dinámico del tema (con fallback a morado por si acaso)
  const themeColor = profile.theme_color || '#a855f7'
  return (
    <div className="min-h-screen relative text-gray-200 font-sans pb-24">
      <AnimatedBackground />
      
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Mensaje de bienvenida */}
        <div className="text-center py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {isMyProfile ? `Bienvenido, ${profile.display_name}` : `Perfil de ${profile.display_name}`}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isMyProfile ? 'Este es tu espacio en la comunidad' : 'Conectando músicos'}
          </p>
        </div>

        {/* Tarjeta de Perfil con borde del color del tema */}
        <div 
          className="bg-[#1a1a1a] border rounded-2xl p-6 md:p-8"
          style={{ borderColor: themeColor }} // ✅ BORDE PRINCIPAL DINÁMICO
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            
            {/* Avatar y Mascota */}
            <div 
              className="bg-[#0f0f0f] p-4 rounded-xl border flex items-end gap-2"
              style={{ borderColor: themeColor + '40' }} // Borde semi-transparente
            >
              <Avatar 
                url={profile.avatar_url || null} 
                name={profile.display_name} 
                color={profile.avatar_color || '#333'} 
                size={140} 
              />
              <Mascot 
                color={profile.avatar_color || '#333'} 
                size={50} 
                expression={profile.expression as any || 'normal'} // ✅ Expresión correcta
              />
            </div>

            <div className="flex-1 text-center md:text-left w-full">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {profile.display_name}
              </h2>
              <p className="text-gray-500 text-sm mb-4">@{profile.username}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6 text-sm">
                <div 
                  className="flex items-center gap-2 bg-[#0f0f0f] px-3 py-2 rounded-lg border"
                  style={{ borderColor: themeColor + '40' }}
                >
                  <FaGuitar style={{ color: themeColor }} />
                  <span className="text-gray-300">{profile.instruments?.[0]?.name || 'Sin instrumento'}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-400">{profile.instruments?.[0]?.level || 'N/A'}</span>
                </div>
                <div 
                  className="flex items-center gap-2 bg-[#0f0f0f] px-3 py-2 rounded-lg border"
                  style={{ borderColor: themeColor + '40' }}
                >
                  <FaMapMarkerAlt style={{ color: themeColor }} />
                  <span className="text-gray-300">{profile.localidad}, {profile.departamento}</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Sobre mí</h3>
                <p 
                  className="text-gray-300 leading-relaxed bg-[#0f0f0f] p-4 rounded-lg border"
                  style={{ borderColor: themeColor + '40' }}
                >
                  {profile.bio || 'Este usuario aún no escribió su biografía.'}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Géneros</h3>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {profile.genres?.map((genre, idx) => (
                    <span 
                      key={`${genre}-${idx}`} 
                      className="px-3 py-1.5 text-sm rounded-full border"
                      style={{ 
                        backgroundColor: themeColor + '20',
                        borderColor: themeColor + '60',
                        color: themeColor 
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {!isMyProfile && (
                  <button 
                     onClick={() => navigate(`/chat/${profile.id}`)}
    className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-semibold rounded-lg transition-all hover:opacity-90"
    style={{ backgroundColor: themeColor }}
  >
    <FaEnvelope /> Enviar mensaje
  </button>
                )}
                {isMyProfile && (
                  <button 
                    onClick={() => navigate('/editar-perfil')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0f0f0f] border text-white font-semibold rounded-lg transition-all hover:brightness-125"
                    style={{ 
                      borderColor: themeColor,
                      color: themeColor
                    }}
                  >
                    <FaEdit style={{ color: themeColor }} /> Editar mi perfil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Publicaciones con borde del tema */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaMusic style={{ color: themeColor }} /> Publicaciones
            </h3>
          </div>

          {posts.length === 0 ? (
            <div 
              className="text-center py-16 bg-[#1a1a1a] border rounded-2xl"
              style={{ borderColor: themeColor + '40' }}
            >
              <FaImage className="text-gray-600 text-4xl mx-auto mb-3" />
              <p className="text-gray-400">Aún no hay publicaciones.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, idx) => (
                <div 
                  key={post.id || `post-${idx}`} 
                  className="bg-[#1a1a1a] border rounded-xl p-5"
                  style={{ borderColor: themeColor + '40' }}
                >
                  <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                  <p className="text-gray-600 text-xs mt-3">
                    {new Date(post.created_at).toLocaleDateString('es-AR', { 
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' 
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}