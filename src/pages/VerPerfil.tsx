// src/pages/VerPerfil.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { type Profile } from '../types'
import type { ProfileLayout, ProfileModule } from '../types/profileLayout'
import { AVAILABLE_MODULES } from '../types/profileLayout'
import Mascot from '../components/Mascot'
import Avatar from '../components/Avatar'
import PostModal from '../components/PostModal'
import Toast from '../components/Toast'
import AnimatedBackground from '../components/AnimatedBackground'
import { useHiddenUsers } from '../hooks/useHiddenUsers'
import { isUserOnline } from '../hooks/useOnlineStatus' 
import { 
  FaMapMarkerAlt, FaGuitar, FaMusic, FaEnvelope, FaSpinner, 
  FaImage, FaEdit, FaTrash, FaExclamationTriangle, FaBullseye, 
  FaUserShield, FaExternalLinkAlt, FaFlag, FaBan, FaUserPlus, 
  FaUserMinus, FaHeart, FaPalette, FaLink, FaChartBar, FaUndo,
  FaInstagram, FaYoutube, FaSpotify, FaTiktok, FaTwitter
} from 'react-icons/fa'

const GENEROS_FIJOS = [
  { name: 'Rock', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  { name: 'Pop', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50' },
  { name: 'Folklore', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
  { name: 'Cumbia', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  { name: 'Jazz', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  { name: 'Electrónica', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  { name: 'Indie', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' },
  { name: 'Metal', color: 'bg-gray-800/40 text-gray-300 border-gray-600' },       
  { name: 'Grunge', color: 'bg-stone-700/40 text-stone-300 border-stone-500' }    
]

const SOCIAL_ICONS: Record<string, any> = {
  Instagram: FaInstagram, YouTube: FaYoutube, Spotify: FaSpotify, TikTok: FaTiktok, 'Twitter/X': FaTwitter
}

const SOCIAL_COLORS: Record<string, string> = {
  Instagram: '#E1306C', YouTube: '#FF0000', Spotify: '#1DB954', TikTok: '#ffffff', 'Twitter/X': '#1DA1F2'
}

const renderContentWithLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline flex items-center gap-1 inline-flex" onClick={(e) => e.stopPropagation()}>{part} <FaExternalLinkAlt size={10} /></a>;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function VerPerfil() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const hiddenIds = useHiddenUsers()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFriend, setIsFriend] = useState(false)
  const [customLayout, setCustomLayout] = useState<ProfileLayout | null>(null)
  
  // ✅ Estado para estadísticas reales
  const [profileStats, setProfileStats] = useState({ likes: 0, friends: 0, posts: 0 })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isReporting, setIsReporting] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)

  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts')
  const [likedPosts, setLikedPosts] = useState<any[]>([])
  const [loadingLikes, setLoadingLikes] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', id).single()
        if (profileError) throw profileError
        setProfile(profileData)

        const { data: layoutData } = await supabase.from('profile_layouts').select('*').eq('user_id', id).single()
        if (layoutData) {
          setCustomLayout({
            layout: layoutData.layout_config?.layout || 'one-column',
            modules: layoutData.layout_config?.modules || [],
            backgroundType: layoutData.background_type || 'solid',
            backgroundValue: layoutData.background_value || '#0f0f0f',
          })
        } else { setCustomLayout(null) }

        const { data: postsData, error: postsError } = await supabase.from('posts').select('id, user_id, content, intention, genres, created_at, updated_at').eq('user_id', id).order('updated_at', { ascending: false })
        if (postsError) throw postsError
        setPosts(postsData || [])

        // ✅ CALCULAR ESTADÍSTICAS REALES
        let totalLikes = 0
        if (postsData && postsData.length > 0) {
          const postIds = postsData.map(p => p.id)
          const { count } = await supabase.from('post_likes').select('*', { count: 'exact', head: true }).in('post_id', postIds)
          totalLikes = count || 0
        }

        const { count: friendsCount } = await supabase.from('friends').select('*', { count: 'exact', head: true }).or(`user_id.eq.${id},friend_id.eq.${id}`)
        
        setProfileStats({
          likes: totalLikes,
          friends: friendsCount || 0,
          posts: postsData?.length || 0
        })

               if (user && id && user.id !== id) {
          const { data: friendData } = await supabase.from('friends').select('id').eq('user_id', user.id).eq('friend_id', id)
          setIsFriend(!!(friendData && friendData.length > 0)) // ✅ Forzamos a booleano
        }
      } catch (error) { console.error('Error al cargar perfil:', error) } finally { setLoading(false) }
    }
    if (id) fetchData()
  }, [id, user])

  const renderModule = (module: ProfileModule) => {
    const modInfo = AVAILABLE_MODULES.find(m => m.type === module.type)
    const sizeClass = { small: 'col-span-1', medium: 'col-span-1 md:col-span-2', large: 'col-span-1 md:col-span-2 lg:col-span-3', xlarge: 'col-span-1 md:col-span-2 lg:col-span-4', }[module.config.size] || 'col-span-1'
    const borderRadiusClass = { none: 'rounded-none', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', full: 'rounded-full', }[module.config.borderRadius] || 'rounded-xl'
    if (!profile) return null
    const borderStyle = module.config.showBorder ? `${module.config.borderWidth || '2px'} ${module.config.borderStyle || 'solid'} ${module.config.borderColor}` : 'none'

    return (
      <div key={module.id} className={`${sizeClass} ${borderRadiusClass} p-4 transition-all`} style={{ backgroundColor: module.config.bgColor, color: module.config.textColor, border: borderStyle }}>
        <div className="pt-2">
          {module.type === 'photo' && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className={`${module.config.shape === 'square' ? 'rounded-xl' : 'rounded-full'} w-24 h-24 bg-gray-700 flex items-center justify-center text-3xl overflow-hidden border-2 border-white/20 flex-shrink-0`}>
                {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span></span>}
              </div>
              {module.config.showMascotAlongside && <Mascot color={profile.avatar_color || '#a855f7'} size={50} expression={(profile as any).expression || 'normal'} />}
              <div className="flex-1 min-w-0"><p className="font-bold text-xl truncate">{profile.display_name}</p><p className="text-sm opacity-70 truncate">@{profile.username}</p></div>
            </div>
          )}
          {module.type === 'mascot' && <div className="flex justify-center py-4"><Mascot color={profile.avatar_color || '#a855f7'} size={50} expression={(profile as any).expression || 'normal'} /></div>}
          {module.type === 'bio' && <p className="text-base opacity-90 leading-relaxed break-words">{profile.bio || 'Sin biografía'}</p>}
          {module.type === 'instruments' && (
            <div className="flex flex-wrap gap-2">{profile.instruments?.map((inst: any, i: number) => (<span key={i} className="text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/10 flex items-center gap-2 max-w-full"><FaGuitar className="flex-shrink-0" /><span className="truncate">{inst.name}</span><span className="opacity-60 truncate">({inst.level})</span></span>)) || <span className="text-sm opacity-60">Sin instrumentos</span>}</div>
          )}
          {module.type === 'genres' && (
            <div className="flex flex-wrap gap-2">{profile.genres?.map((g: string, i: number) => (<span key={i} className="text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/10 truncate">#{g}</span>)) || <span className="text-sm opacity-60">Sin géneros</span>}</div>
          )}
          {module.type === 'location' && <p className="text-base flex items-center gap-2 flex-wrap"><FaMapMarkerAlt className="flex-shrink-0" /><span className="truncate">{profile.localidad || 'Sin ubicación'}, {profile.departamento || 'Tucumán'}</span></p>}
          
          {/* ✅ RENDERIZADO DE GALERÍA REAL (Seguro contra undefined) */}
          {module.type === 'gallery' && (
            <div className="grid grid-cols-2 gap-2">
              {(module.config.images || []).length > 0 ? (module.config.images || []).map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:scale-105 transition-transform cursor-pointer">
                  <img src={img} alt={`gallery-${i}`} className="w-full h-full object-cover" />
                </div>
              )) : <div className="col-span-2 text-center py-4 text-sm opacity-60">Sin imágenes en la galería</div>}
            </div>
          )}

          {/* ✅ RENDERIZADO DE REDES SOCIALES REALES (Seguro contra undefined) */}
          {module.type === 'social-links' && (
            <div className="flex flex-wrap gap-2">
              {(module.config.socialLinks || []).length > 0 ? (module.config.socialLinks || []).map((link, i) => {
                const Icon = SOCIAL_ICONS[link.platform] || FaLink
                return (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">
                    <Icon style={{ color: SOCIAL_COLORS[link.platform] || 'white' }} /> <span className="text-xs">{link.platform}</span>
                  </a>
                )
              }) : <p className="text-sm opacity-60 flex items-center gap-2"><FaLink /> Sin redes sociales</p>}
            </div>
          )}

          {/* ✅ RENDERIZADO DE ESTADÍSTICAS REALES */}
          {module.type === 'stats' && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5"><p className="text-2xl font-bold text-purple-400">{profileStats.likes}</p><p className="text-[10px] opacity-70 uppercase tracking-wider mt-1">Likes</p></div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5"><p className="text-2xl font-bold text-cyan-400">{profileStats.friends}</p><p className="text-[10px] opacity-70 uppercase tracking-wider mt-1">Amigos</p></div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5"><p className="text-2xl font-bold text-pink-400">{profileStats.posts}</p><p className="text-[10px] opacity-70 uppercase tracking-wider mt-1">Posts</p></div>
            </div>
          )}

          {module.type === 'custom' && <p className="text-base whitespace-pre-wrap opacity-90 break-words">{module.config.content || ''}</p>}
        </div>
      </div>
    )
  }

  const handleDeletePost = async () => {
    if (!deletingPostId) return
    try {
      const { error } = await supabase.from('posts').delete().eq('id', deletingPostId)
      if (error) throw error
      setPosts(posts.filter(p => p.id !== deletingPostId))
      setShowDeleteModal(false)
      setDeletingPostId(null)
      setToast({ message: 'Publicación eliminada correctamente', type: 'success' })
    } catch (error: any) { setToast({ message: 'Error al eliminar: ' + error.message, type: 'error' }) }
  }

  const refreshPosts = async () => {
    if (!id) return
    const { data } = await supabase.from('posts').select('id, user_id, content, intention, genres, created_at, updated_at').eq('user_id', id).order('updated_at', { ascending: false })
    if (data) setPosts(data)
  }

  const fetchLikedPosts = async () => {
    if (!id) return
    setLoadingLikes(true)
    try {
      const { data: likesData, error: likesError } = await supabase.from('post_likes').select('post_id').eq('user_id', id).order('created_at', { ascending: false })
      if (likesError) throw likesError
      if (likesData && likesData.length > 0) {
        const postIds = likesData.map(l => l.post_id)
        const { data: postsData, error: postsError } = await supabase.from('posts').select('id, user_id, content, intention, genres, created_at, updated_at').in('id', postIds).order('updated_at', { ascending: false })
        if (postsError) throw postsError
        if (postsData && postsData.length > 0) {
          const userIds = [...new Set(postsData.map(p => p.user_id))]
          const { data: profilesData } = await supabase.from('profiles').select('id, display_name, username, avatar_color, avatar_url, instruments, localidad, departamento, expression, last_seen').in('id', userIds)
          const combined = postsData.map(post => { const author = profilesData?.find(p => p.id.toString() === post.user_id.toString()); return { ...post, profiles: author || {} } })
          setLikedPosts(combined)
        } else { setLikedPosts([]) }
      } else { setLikedPosts([]) }
    } catch (error) { console.error('Error al cargar likes:', error) } finally { setLoadingLikes(false) }
  }

  useEffect(() => { if (activeTab === 'likes') fetchLikedPosts() }, [activeTab, id])

  const handleToggleFriend = async () => {
    if (!user || !profile) { setToast({ message: 'Error: Debes estar logueado', type: 'error' }); return }
    try {
      if (isFriend) {
        const { error } = await supabase.from('friends').delete().eq('user_id', user.id).eq('friend_id', profile.id)
        if (error) throw error
        setIsFriend(false)
        setToast({ message: 'Amigo eliminado', type: 'info' })
      } else {
        const { error } = await supabase.from('friends').insert({ user_id: user.id, friend_id: profile.id })
        if (error) throw error
        setIsFriend(true)
        setToast({ message: `¡${profile.display_name} es ahora tu amigo!`, type: 'success' })
      }
    } catch (error: any) { setToast({ message: 'Error: ' + error.message, type: 'error' }) }
  }

  const confirmBlockUser = async () => {
    if (!user || !profile) return
    try {
      const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: profile.id })
      if (error) throw error
      setToast({ message: 'Usuario bloqueado correctamente', type: 'success' })
      setShowBlockModal(false)
      navigate('/home')
    } catch (error: any) { setToast({ message: 'Error al bloquear: ' + error.message, type: 'error' }) }
  }

  const handleOpenReport = () => { setReportReason(''); setReportModalOpen(true) }
  const handleSubmitReport = async () => {
    if (!reportReason.trim() || !user || !profile) return
    setIsReporting(true)
    try {
      const { error } = await supabase.from('reports').insert({ reporter_id: user.id, reported_user_id: profile.id, post_id: null, reason: reportReason })
      if (error) throw error
      setToast({ message: 'Reporte enviado. Gracias por ayudar a mantener la comunidad segura.', type: 'success' })
      setReportModalOpen(false)
    } catch (error: any) { setToast({ message: 'Error al enviar reporte: ' + error.message, type: 'error' }) } finally { setIsReporting(false) }
  }

  if (loading) return <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4"><FaSpinner className="animate-spin text-4xl text-purple-600" /><p className="text-gray-400 text-sm animate-pulse">Cargando perfil...</p></div>
  if (!profile) return <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center gap-4 text-gray-400"><p className="text-xl">Perfil no encontrado.</p><button onClick={() => navigate('/home')} className="text-purple-400 hover:text-purple-300 font-medium">Volver al Home</button></div>

  const isMyProfile = user?.id === profile.id
  const isBlocked = hiddenIds.includes(profile.id)
  const themeColor = profile.theme_color || '#a855f7'

  return (
    <div className="min-h-screen relative text-gray-200 font-sans pb-24">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="sticky top-0 z-40 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg truncate pr-4">{profile.display_name}</h1>
        {isMyProfile && user?.email === 'remaslove281@gmail.com' && (<button onClick={() => navigate('/admin')} className="p-2 rounded-full bg-purple-900/30 border border-purple-700/50 text-purple-400 hover:bg-purple-900/50 hover:text-purple-300 transition-all flex-shrink-0" title="Panel de Administrador"><FaUserShield size={18} /></button>)}
      </div>

      <main className="w-full max-w-none px-2 md:px-4 space-y-4">        
        {customLayout ? (
          <div className="w-full rounded-none md:rounded-2xl p-6 transition-colors duration-300 relative" style={{ backgroundColor: customLayout.backgroundValue || '#0f0f0f' }}>
            {!isMyProfile && (<button onClick={handleOpenReport} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20 z-10" title="Reportar usuario"><FaFlag size={18} /></button>)}
            <div className={`grid gap-4 ${customLayout.layout === 'one-column' ? 'grid-cols-1' : customLayout.layout === 'two-columns' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {[...customLayout.modules].sort((a, b) => a.order - b.order).map(module => renderModule(module))}
            </div>
            {isMyProfile && (
              <div className="mt-6 flex flex-wrap gap-3 justify-center border-t border-[#2a2a2a] pt-4">
                <button onClick={() => navigate('/editar-perfil')} className="flex items-center justify-center gap-2 py-3 px-6 bg-[#0f0f0f] border text-white font-semibold rounded-lg transition-all hover:brightness-125" style={{ borderColor: themeColor, color: themeColor }}><FaEdit size={16} style={{ color: themeColor }} /> <span>Editar datos</span></button>
                <button onClick={() => { if (confirm('¿Restablecer tu perfil al diseño por defecto? Se eliminará tu diseño personalizado.')) { supabase.from('profile_layouts').delete().eq('user_id', user.id).then(() => { setCustomLayout(null); setToast({ message: 'Perfil restablecido al diseño por defecto', type: 'success' }) }) } }} className="flex items-center justify-center gap-2 py-3 px-6 bg-red-900/20 border border-red-700/50 text-red-400 font-semibold rounded-lg transition-all hover:bg-red-900/40"><FaUndo size={16} /> <span>Restablecer diseño</span></button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-x-0 md:border-x w-full rounded-none md:rounded-2xl p-6 md:p-8 relative" style={{ borderColor: themeColor }}>
            {!isMyProfile && (<button onClick={handleOpenReport} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-900/20" title="Reportar usuario"><FaFlag size={18} /></button>)}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="bg-[#0f0f0f] p-4 rounded-xl border flex items-end gap-2" style={{ borderColor: themeColor + '40' }}>
                <Avatar url={profile.avatar_url || null} name={profile.display_name} color={profile.avatar_color || '#333'} size={140} isOnline={isUserOnline((profile as any).last_seen)} />
                <Mascot color={profile.avatar_color || '#333'} size={50} expression={(profile as any).expression || 'normal'} />
              </div>
              <div className="flex-1 text-center md:text-left w-full">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{profile.display_name}</h2>
                <p className="text-gray-500 text-sm mb-4">@{profile.username}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6 text-sm">
                  <div className="flex items-center gap-2 bg-[#0f0f0f] px-3 py-2 rounded-lg border" style={{ borderColor: themeColor + '40' }}><FaGuitar style={{ color: themeColor }} /><span className="text-gray-300">{profile.instruments?.[0]?.name || 'Sin instrumento'}</span><span className="text-gray-600">•</span><span className="text-gray-400">{profile.instruments?.[0]?.level || 'N/A'}</span></div>
                  <div className="flex items-center gap-2 bg-[#0f0f0f] px-3 py-2 rounded-lg border" style={{ borderColor: themeColor + '40' }}><FaMapMarkerAlt style={{ color: themeColor }} /><span className="text-gray-300">{profile.localidad}, {profile.departamento}</span></div>
                </div>
                <div className="mb-6"><h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Sobre mí</h3><p className="text-gray-300 leading-relaxed bg-[#0f0f0f] p-4 rounded-lg border break-words" style={{ borderColor: themeColor + '40' }}>{profile.bio || 'Este usuario aún no escribió su biografía.'}</p></div>
                <div className="mb-6"><h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Géneros</h3><div className="flex flex-wrap gap-2 justify-center md:justify-start">{profile.genres?.map((genre, idx) => (<span key={`${genre}-${idx}`} className="px-3 py-1.5 text-sm rounded-full border" style={{ backgroundColor: themeColor + '20', borderColor: themeColor + '60', color: themeColor }}>{genre}</span>))}</div></div>
                {!isMyProfile && isBlocked && (<div className="mb-4 flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-sm rounded-lg"><FaBan /> Este usuario está bloqueado: no pueden enviarse mensajes ni verse en el feed.</div>)}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {!isMyProfile ? (<>
                    <button onClick={() => navigate(`/chat/${profile.id}`)} disabled={isBlocked} className="flex items-center justify-center gap-2 py-3 px-4 text-white font-semibold rounded-lg transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed" style={{ backgroundColor: themeColor }}><FaEnvelope size={16} /> <span>Enviar mensaje</span></button>
                    <button onClick={handleToggleFriend} className={`flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-lg transition-all border ${isFriend ? 'bg-green-900/20 border-green-500/50 text-green-400 hover:bg-green-900/40' : 'bg-[#0f0f0f] border-purple-500/50 text-purple-400 hover:bg-purple-900/20'}`}>{isFriend ? <FaUserMinus size={16} /> : <FaUserPlus size={16} />} <span>{isFriend ? 'Quitar Amigo' : 'Agregar Amigo'}</span></button>
                    <button onClick={() => setShowBlockModal(true)} className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0f0f0f] border border-gray-700 text-gray-400 font-semibold rounded-lg transition-all hover:bg-gray-800 hover:text-white"><FaBan size={16} /> <span>Bloquear</span></button>
                  </>) : (<>
                    <button onClick={() => navigate('/editar-perfil')} className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0f0f0f] border text-white font-semibold rounded-lg transition-all hover:brightness-125 sm:col-span-1" style={{ borderColor: themeColor, color: themeColor }}><FaEdit size={16} style={{ color: themeColor }} /> <span>Editar datos</span></button>
                    <button onClick={() => navigate('/editar-perfil/diseno')} className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg transition-all hover:opacity-90 sm:col-span-1"><FaPalette size={16} /> <span>Diseñar perfil</span></button>
                  </>)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4 border-b border-[#2a2a2a] pb-2">
            <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${activeTab === 'posts' ? 'bg-[#1a1a1a] text-white border border-[#2a2a2a] border-b-transparent' : 'text-gray-500 hover:text-gray-300'}`}><FaMusic style={{ color: activeTab === 'posts' ? themeColor : undefined }} /> Publicaciones</button>
            <button onClick={() => setActiveTab('likes')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${activeTab === 'likes' ? 'bg-[#1a1a1a] text-white border border-[#2a2a2a] border-b-transparent' : 'text-gray-500 hover:text-gray-300'}`}><FaHeart style={{ color: activeTab === 'likes' ? '#ef4444' : undefined }} /> Le gustó</button>
          </div>
          {activeTab === 'posts' ? (
            posts.length === 0 ? (<div className="text-center py-16 bg-[#1a1a1a] border rounded-2xl" style={{ borderColor: themeColor + '40' }}><FaImage className="text-gray-600 text-4xl mx-auto mb-3" /><p className="text-gray-400">Aún no hay publicaciones.</p></div>) : (
              <div className="space-y-4">{posts.map((post) => (
                <div key={post.id} className="bg-[#1a1a1a] border rounded-2xl p-5 transition-colors" style={{ borderColor: themeColor + '40' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex items-end gap-1"><Avatar url={profile.avatar_url || null} name={profile.display_name} color={profile.avatar_color || '#333'} size={45} isOnline={isUserOnline((profile as any).last_seen)} /><Mascot color={profile.avatar_color || '#333'} size={20} expression={(profile as any).expression || 'normal'} /></div>                
                    <div className="flex-1"><h4 className="text-white font-bold text-sm">{profile.display_name}</h4><p className="text-gray-500 text-xs">@{profile.username}</p><div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400"><span className="flex items-center gap-1"><FaGuitar style={{ color: themeColor }} size={10} /> {profile.instruments?.[0]?.name || 'Músico'}</span><span className="text-gray-700">•</span><span className="flex items-center gap-1"><FaMapMarkerAlt style={{ color: themeColor }} size={10} /> {profile.localidad}</span></div></div>
                    <span className="text-gray-600 text-xs">{new Date(post.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words mb-3">{renderContentWithLinks(post.content)}</p>
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#2a2a2a] mb-3">
                    {post.intention && (<span className="px-2.5 py-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 text-[10px] font-bold rounded-full flex items-center gap-1"><FaBullseye size={8} /> {post.intention}</span>)}
                    {post.genres?.map((genre: string, idx: number) => { const genData = GENEROS_FIJOS.find(g => g.name === genre); return <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${genData?.color || 'bg-gray-800 text-gray-400 border-gray-700'}`}>#{genre}</span> })}
                  </div>
                  {isMyProfile ? (<div className="flex items-center gap-3 pt-2"><button onClick={() => { setEditingPost(post); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all"><FaEdit size={12} className="text-purple-400" /> Editar</button><button onClick={() => { setDeletingPostId(post.id); setShowDeleteModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-800/50 hover:bg-red-900/40 rounded-lg text-sm text-red-400 hover:text-red-300 transition-all"><FaTrash size={12} /> Eliminar</button></div>) : (<button onClick={() => navigate(`/chat/${profile.id}?post=${post.id}`)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all"><FaEnvelope size={12} className="text-purple-400" /> Enviar mensaje</button>)}
                </div>
              ))}</div>
            )
          ) : (
            loadingLikes ? (<div className="flex justify-center py-12"><FaSpinner className="animate-spin text-2xl text-purple-600" /></div>) : likedPosts.length === 0 ? (<div className="text-center py-16 bg-[#1a1a1a] border rounded-2xl border-gray-800"><FaHeart className="text-gray-600 text-4xl mx-auto mb-3" /><p className="text-gray-400">Aún no le gustó ninguna publicación.</p></div>) : (
              <div className="space-y-4">{likedPosts.map((post) => {
                const author = post.profiles || {}; const authorName = author.display_name || 'Usuario'; const authorUsername = author.username || ''; const authorAvatar = author.avatar_url || null; const authorColor = author.avatar_color || '#333'; const authorInstrument = author.instruments?.[0]?.name || 'Músico'; const authorLocation = author.localidad || ''
                return (
                  <div key={post.id} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5 hover:border-purple-600/30 transition-colors">
                    <div className="flex items-start gap-3 mb-3 cursor-pointer" onClick={() => navigate(`/perfil/${post.user_id}`)}>
                      <div className="flex items-end gap-1"><Avatar url={authorAvatar} name={authorName} color={authorColor} size={45} isOnline={isUserOnline((author as any).last_seen)} /><Mascot color={authorColor} size={20} expression={(author.expression as any) || 'normal'} /></div>                
                      <div className="flex-1"><h4 className="text-white font-bold text-sm hover:text-purple-400 transition-colors">{authorName}</h4><p className="text-gray-500 text-xs">@{authorUsername}</p><div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400"><span className="flex items-center gap-1"><FaGuitar style={{ color: themeColor }} size={10} /> {authorInstrument}</span><span className="text-gray-700">•</span><span className="flex items-center gap-1"><FaMapMarkerAlt style={{ color: themeColor }} size={10} /> {authorLocation}</span></div></div>
                      <span className="text-gray-600 text-xs">{new Date(post.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words mb-3">{renderContentWithLinks(post.content)}</p>
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#2a2a2a]">
                      {post.intention && (<span className="px-2.5 py-1 bg-purple-900/30 border border-purple-700/40 text-purple-300 text-[10px] font-bold rounded-full flex items-center gap-1"><FaBullseye size={8} /> {post.intention}</span>)}
                      {post.genres?.map((genre: string, idx: number) => { const genData = GENEROS_FIJOS.find(g => g.name === genre); return <span key={idx} className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${genData?.color || 'bg-gray-800 text-gray-400 border-gray-700'}`}>#{genre}</span> })}
                    </div>
                    {!isMyProfile && (<button onClick={() => navigate(`/chat/${post.user_id}?post=${post.id}`)} className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-600/50 rounded-lg text-sm text-gray-300 hover:text-white transition-all"><FaEnvelope size={12} className="text-purple-400" /> Enviar mensaje</button>)}
                  </div>
                )
              })}</div>
            )
          )}
        </div>
      </main>

      <PostModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingPost(null); }} existingPost={editingPost} onPostSaved={() => { refreshPosts(); }} />
      {reportModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]"><div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setReportModalOpen(false)} /><div className="relative bg-[#1a1a1a] border border-red-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center"><FaFlag className="text-red-400" size={20} /></div><h3 className="text-xl font-bold text-white">Reportar Usuario</h3></div><p className="text-gray-400 text-sm mb-4">Tu reporte es anónimo. Selecciona un motivo:</p><select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-red-500 mb-4"><option value="">Selecciona un motivo...</option><option value="Spam o publicidad">Spam o publicidad</option><option value="Comportamiento abusivo o acoso">Comportamiento abusivo o acoso</option><option value="Perfil falso">Perfil falso</option><option value="Contenido inapropiado">Contenido inapropiado</option><option value="Otro motivo">Otro motivo</option></select><div className="flex gap-3"><button onClick={() => setReportModalOpen(false)} className="flex-1 py-3 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] transition-all font-medium">Cancelar</button><button onClick={handleSubmitReport} disabled={isReporting || !reportReason} className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2">{isReporting ? <FaSpinner className="animate-spin" /> : <FaFlag />} {isReporting ? 'Enviando...' : 'Enviar Reporte'}</button></div></div></div>)}
      {showBlockModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]"><div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowBlockModal(false)} /><div className="relative bg-[#1a1a1a] border border-red-900/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl"><div className="flex justify-center mb-4"><div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center border border-red-700/50"><FaBan className="text-red-400" size={32} /></div></div><h3 className="text-xl font-bold text-white text-center mb-2">¿Bloquear a este usuario?</h3><p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">No podrán ver tu perfil, ni tus publicaciones, ni enviarte mensajes. Puedes desbloquearlos más tarde desde tu panel de opciones.</p><div className="flex gap-3"><button onClick={() => setShowBlockModal(false)} className="flex-1 py-3 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] transition-all font-medium border border-[#3a3a3a]">Cancelar</button><button onClick={confirmBlockUser} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"><FaBan size={14} /> Sí, bloquear</button></div></div></div>)}
      {showDeleteModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]"><div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} /><div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-red-900/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-red-900/20"><div className="flex justify-center mb-4"><div className="relative"><div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl"></div><div className="relative w-16 h-16 bg-gradient-to-br from-red-900/40 to-red-950/60 rounded-full flex items-center justify-center border border-red-700/50"><FaExclamationTriangle className="text-red-400" size={28} /></div></div></div><h3 className="text-xl font-bold text-white text-center mb-2">¿Eliminar publicación?</h3><p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">Esta acción no se puede deshacer. Tu publicación desaparecerá del perfil.</p><div className="flex gap-3"><button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] hover:text-white transition-all font-medium border border-[#3a3a3a]">Cancelar</button><button onClick={handleDeletePost} className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"><FaTrash size={14} /> Sí, eliminar</button></div></div></div>)}
    </div>
  )
}