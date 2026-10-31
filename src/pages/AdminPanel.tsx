// src/pages/AdminPanel.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { 
  FaUsers, FaNewspaper, FaTrash, FaArrowLeft, 
  FaSpinner, FaSearch, FaRegEnvelope, FaFlag, FaBan, FaUnlock, 
  FaExclamationTriangle, FaCheckCircle, FaTv, FaPlus, FaToggleOn, FaToggleOff
} from 'react-icons/fa'
import { LuChartNetwork } from "react-icons/lu";

import Toast from '../components/Toast'
import AnimatedBackground from '../components/AnimatedBackground'
import { markAdminAlertsSeen } from '../hooks/useAdminAlerts'
import AdminBannerControl from '../components/AdminBannerControl'

export default function AdminPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ users: 0, posts: 0, suggestions: 0, reports: 0, banned: 0 })
  
  const [usersList, setUsersList] = useState<any[]>([])
  const [postsList, setPostsList] = useState<any[]>([])
  const [bannedList, setBannedList] = useState<any[]>([])
  const [suggestionsList, setSuggestionsList] = useState<any[]>([])
  const [reportsList, setReportsList] = useState<any[]>([])
  const [adsList, setAdsList] = useState<any[]>([])
  
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts' | 'banned' | 'suggestions' | 'reports' | 'ads'>('stats')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [banningUser, setBanningUser] = useState<any>(null)
  const [banReasonInput, setBanReasonInput] = useState('')
  const [unbanningUser, setUnbanningUser] = useState<any>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  
  // Estados para gestión de anuncios
  const [showAdModal, setShowAdModal] = useState(false)
  const [editingAd, setEditingAd] = useState<any>(null)
  const [adForm, setAdForm] = useState({ title: '', message: '', image_url: '', is_active: true })

  useEffect(() => {
    if (user?.email !== 'remaslove281@gmail.com') {
      navigate('/home', { replace: true })
      return
    }
    fetchData()
    markAdminAlertsSeen()
  }, [user, navigate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      const { count: suggestionCount } = await supabase.from('suggestions').select('*', { count: 'exact', head: true })
      const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true })
      const { count: bannedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true)
      
      setStats({ 
        users: userCount || 0, posts: postCount || 0, 
        suggestions: suggestionCount || 0, reports: reportCount || 0, 
        banned: bannedCount || 0 
      })

      const { data: usersData } = await supabase.from('profiles').select('id, username, display_name, is_banned').order('created_at', { ascending: false })
      setUsersList(usersData?.filter(u => !u.is_banned) || [])

      const { data: postsData } = await supabase.from('posts').select('id, user_id, content, created_at').order('created_at', { ascending: false })
      setPostsList(postsData || [])

      const { data: bannedData } = await supabase.from('profiles').select('id, username, display_name, ban_reason').eq('is_banned', true).order('created_at', { ascending: false })
      setBannedList(bannedData || [])

      const { data: suggestionsData } = await supabase.from('suggestions').select('id, user_id, content, created_at').order('created_at', { ascending: false })
      if (suggestionsData && suggestionsData.length > 0) {
        const sUserIds = [...new Set(suggestionsData.map(s => s.user_id))]
        const { data: sProfiles } = await supabase.from('profiles').select('id, display_name, username').in('id', sUserIds)
        const sProfilesMap: any = {}
        sProfiles?.forEach((p: any) => { sProfilesMap[p.id] = p })
        setSuggestionsList(suggestionsData.map(s => ({ ...s, profiles: sProfilesMap[s.user_id] || { display_name: 'Desconocido', username: 'N/A' } })))
      } else { setSuggestionsList([]) }

      const { data: reportsData } = await supabase.from('reports').select('id, reporter_id, reported_user_id, post_id, reason, created_at').order('created_at', { ascending: false })
      if (reportsData && reportsData.length > 0) {
        const rUserIds = [...new Set(reportsData.flatMap((r: any) => [r.reporter_id, r.reported_user_id].filter(Boolean)))]
        const { data: rProfiles } = await supabase.from('profiles').select('id, display_name, username').in('id', rUserIds)
        const rProfilesMap: any = {}
        rProfiles?.forEach((p: any) => { rProfilesMap[p.id] = p })
        setReportsList(reportsData.map((r: any) => ({
          ...r,
          reporter: rProfilesMap[r.reporter_id] || { display_name: 'Eliminado', username: 'N/A' },
          reported: rProfilesMap[r.reported_user_id] || { display_name: 'Eliminado', username: 'N/A' }
        })))
      } else { setReportsList([]) }

      const { data: adsData } = await supabase.from('ads').select('*').order('created_at', { ascending: false })
      setAdsList(adsData || [])

    } catch (error) {
      console.error('Error en fetchData:', error)
      setToast({ message: 'Error al cargar datos del sistema', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async () => {
    if (!banningUser || !banReasonInput.trim()) return
    try {
      const { error } = await supabase.from('profiles').update({ is_banned: true, ban_reason: banReasonInput }).eq('id', banningUser.id)
      if (error) throw error
      setToast({ message: 'Usuario baneado del sistema', type: 'success' })
      setBanningUser(null)
      setBanReasonInput('')
      fetchData()
    } catch (error: any) {
      setToast({ message: 'Error al banear: ' + error.message, type: 'error' })
    }
  }

  const executeUnban = async () => {
    if (!unbanningUser) return
    try {
      const { error } = await supabase.from('profiles').update({ is_banned: false, ban_reason: null }).eq('id', unbanningUser.id)
      if (error) throw error
      setToast({ message: 'Usuario restablecido correctamente', type: 'success' })
      setUnbanningUser(null)
      fetchData()
    } catch (error: any) {
      setToast({ message: 'Error al restablecer: ' + error.message, type: 'error' })
    }
  }

  const requestDeletePost = (postId: string) => setDeletingPostId(postId)

  const executeDeletePost = async () => {
    if (!deletingPostId) return
    try {
      const { error } = await supabase.from('posts').delete().eq('id', deletingPostId)
      if (error) throw error
      setPostsList(postsList.filter(p => p.id !== deletingPostId))
      setToast({ message: 'Publicación eliminada permanentemente', type: 'success' })
      setDeletingPostId(null)
    } catch (error: any) {
      setToast({ message: 'Error al eliminar: ' + error.message, type: 'error' })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario y todo su contenido permanentemente?')) return
    try {
      await supabase.from('posts').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)
      setUsersList(usersList.filter(u => u.id !== userId))
      setToast({ message: 'Usuario eliminado del sistema', type: 'success' })
    } catch { setToast({ message: 'Error al eliminar usuario', type: 'error' }) }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('¿Archivar y eliminar este reporte?')) return
    try {
      await supabase.from('reports').delete().eq('id', reportId)
      setReportsList(reportsList.filter(r => r.id !== reportId))
      setToast({ message: 'Reporte archivado', type: 'success' })
    } catch { setToast({ message: 'Error al archivar', type: 'error' }) }
  }

  const openAdModal = (ad: any = null) => {
    if (ad) {
      setEditingAd(ad)
      setAdForm({ title: ad.title, message: ad.message || '', image_url: ad.image_url || '', is_active: ad.is_active })
    } else {
      setEditingAd(null)
      setAdForm({ title: '', message: '', image_url: '', is_active: true })
    }
    setShowAdModal(true)
  }

  const handleSaveAd = async () => {
    if (!adForm.title.trim()) {
      setToast({ message: 'El título es obligatorio', type: 'error' })
      return
    }
    try {
      // Construimos el payload omitiendo campos vacíos para evitar errores de "null" en la BD
      const payload: any = {
        title: adForm.title.trim(),
        is_active: adForm.is_active
      }
      
      if (adForm.message?.trim()) payload.message = adForm.message.trim()
      if (adForm.image_url?.trim()) payload.image_url = adForm.image_url.trim()

      if (editingAd) {
        const { error } = await supabase.from('ads').update(payload).eq('id', editingAd.id)
        if (error) throw error
        setToast({ message: 'Anuncio actualizado', type: 'success' })
      } else {
        const { error } = await supabase.from('ads').insert(payload)
        if (error) throw error
        setToast({ message: 'Anuncio creado y transmitido', type: 'success' })
      }
      setShowAdModal(false)
      fetchData()
    } catch (error: any) {
      console.error('Error detallado:', error)
      setToast({ message: 'Error: ' + (error.message || 'Desconocido'), type: 'error' })
    }
  }

  const toggleAdActive = async (ad: any) => {
    try {
      const { error } = await supabase.from('ads').update({ is_active: !ad.is_active }).eq('id', ad.id)
      if (error) throw error
      setToast({ message: ad.is_active ? 'Anuncio desactivado' : 'Anuncio activado', type: 'success' })
      fetchData()
    } catch (error: any) {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    }
  }

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('¿Eliminar este anuncio permanentemente?')) return
    try {
      const { error } = await supabase.from('ads').delete().eq('id', adId)
      if (error) throw error
      setToast({ message: 'Anuncio eliminado', type: 'success' })
      fetchData()
    } catch (error: any) {
      setToast({ message: 'Error: ' + error.message, type: 'error' })
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f0f] gap-4">
      <FaSpinner className="animate-spin text-4xl text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
      <p className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">PANEL ADMIN</p>
    </div>
  )

  return (
    <div className="min-h-screen relative text-gray-200 font-sans pb-24">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors group">
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> <span className="font-mono text-sm">SALIR</span>
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
            <LuChartNetwork className="text-purple-500" size={24} /> PANEL_DE_CONTROL
          </h1>
          <div className="w-20"></div>
        </div>

        <AdminBannerControl onResult={(message, type) => setToast({ message, type })} />

        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-[#2a2a2a] rounded-2xl p-6 min-h-[500px] shadow-2xl">
          
          {activeTab === 'stats' && (
            <div className="space-y-8">
              <div className="relative w-full h-72 md:h-96 bg-[#0a0a0a] rounded-xl border border-purple-500/30 overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.1)]">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Líneas de conexión */}
                  <line x1="400" y1="200" x2="180" y2="90" stroke="url(#lineGrad)" strokeWidth="2" filter="url(#glow)" opacity="0.7" />
                  <line x1="400" y1="200" x2="620" y2="90" stroke="url(#lineGrad)" strokeWidth="2" filter="url(#glow)" opacity="0.7" />
                  <line x1="400" y1="200" x2="180" y2="310" stroke="url(#lineGrad)" strokeWidth="2" filter="url(#glow)" opacity="0.7" />
                  <line x1="400" y1="200" x2="620" y2="310" stroke="url(#lineGrad)" strokeWidth="2" filter="url(#glow)" opacity="0.7" />
                  <line x1="400" y1="200" x2="400" y2="60" stroke="url(#lineGrad)" strokeWidth="2" filter="url(#glow)" opacity="0.7" />
                  <line x1="400" y1="200" x2="400" y2="340" stroke="url(#lineGrad)" strokeWidth="2" filter="url(#glow)" opacity="0.7" />
                  
                  {/* Nodo Central */}
                  <circle cx="400" cy="200" r="40" fill="#1a1a1a" stroke="#a855f7" strokeWidth="3" filter="url(#glow)" />
                  <text x="400" y="195" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold" fontFamily="monospace">CORE</text>
                  <text x="400" y="212" textAnchor="middle" fill="#a855f7" fontSize="10" fontFamily="monospace">{stats.users} NODOS</text>
                  
                  {/* Nodos Externos */}
                  <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('users')}>
                    <circle cx="180" cy="90" r="28" fill="#1a1a1a" stroke="#3b82f6" strokeWidth="2" filter="url(#glow)" />
                    <text x="180" y="95" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold" fontFamily="monospace">USERS</text>
                  </g>
                  
                  <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('posts')}>
                    <circle cx="620" cy="90" r="28" fill="#1a1a1a" stroke="#f59e0b" strokeWidth="2" filter="url(#glow)" />
                    <text x="620" y="95" textAnchor="middle" fill="#f59e0b" fontSize="11" fontWeight="bold" fontFamily="monospace">POSTS</text>
                  </g>
                  
                  <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('banned')}>
                    <circle cx="180" cy="310" r="28" fill="#1a1a1a" stroke="#ef4444" strokeWidth="2" filter="url(#glow)" />
                    <text x="180" y="315" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="monospace">BANS</text>
                  </g>
                  
                  <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('reports')}>
                    <circle cx="620" cy="310" r="28" fill="#1a1a1a" stroke="#10b981" strokeWidth="2" filter="url(#glow)" />
                    <text x="620" y="315" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="monospace">ALERTS</text>
                  </g>

                  <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('ads')}>
                    <circle cx="400" cy="60" r="28" fill="#1a1a1a" stroke="#ec4899" strokeWidth="2" filter="url(#glow)" />
                    <text x="400" y="65" textAnchor="middle" fill="#ec4899" fontSize="11" fontWeight="bold" fontFamily="monospace">TV ADS</text>
                  </g>

                  {/* ✅ NUEVO NODO: BUZÓN DE SUGERENCIAS */}
                  <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('suggestions')}>
                    <circle cx="400" cy="340" r="28" fill="#1a1a1a" stroke="#8b5cf6" strokeWidth="2" filter="url(#glow)" />
                    <text x="400" y="345" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontWeight="bold" fontFamily="monospace">BUZON</text>
                  </g>
                </svg>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NeonCard icon={FaUsers} label="MÚSICOS" value={stats.users} color="blue" shadow="rgba(59,130,246,0.4)" />
                <NeonCard icon={FaNewspaper} label="PUBLICACIONES" value={stats.posts} color="amber" shadow="rgba(245,158,11,0.4)" />
                <NeonCard icon={FaRegEnvelope} label="SUGERENCIAS" value={stats.suggestions} color="purple" shadow="rgba(168,85,247,0.4)" />
                <NeonCard icon={FaFlag} label="REPORTES" value={stats.reports} color="red" shadow="rgba(239,68,68,0.4)" />
              </div>

              <div className="space-y-3 pt-4 border-t border-[#2a2a2a]">
                <div className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-xl border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></div>
                    <span className="text-gray-300 text-sm font-mono font-medium">NODOS ACTIVOS EN LA RED</span>
                  </div>
                  <span className="text-white font-bold text-xl font-mono">{stats.users - stats.banned}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-xl border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div>
                    <span className="text-gray-300 text-sm font-mono font-medium">NODOS BLOQUEADOS</span>
                  </div>
                  <span className="text-white font-bold text-xl font-mono">{stats.banned}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'stats' && (
            <>
              <button 
                onClick={() => setActiveTab('stats')} 
                className="mb-4 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-mono text-sm border border-purple-500/30 hover:border-purple-500/60 px-4 py-2 rounded-lg bg-purple-900/10"
              >
                <FaArrowLeft /> VOLVER_AL_NÚCLEO
              </button>

              {activeTab === 'users' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-2"><FaUsers className="text-blue-400" /> REGISTRO_DE_USUARIOS</h2>
                  <div className="relative mb-4">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" placeholder="Escanear base de datos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 font-mono text-sm" />
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {usersList.filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || u.display_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a] hover:border-blue-500/30 transition-all group">
                        <div><p className="font-bold text-white group-hover:text-blue-400 transition-colors font-mono">{u.display_name}</p><p className="text-xs text-gray-500 font-mono">@{u.username}</p></div>
                        <div className="flex gap-2">
                          <button onClick={() => setBanningUser(u)} className="text-red-500 hover:text-red-400 p-2 flex items-center gap-1 text-xs font-semibold hover:bg-red-900/20 rounded-lg transition-all border border-transparent hover:border-red-900/50 font-mono"><FaBan /> BANEAR</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'posts' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-2"><FaNewspaper className="text-amber-400" /> REGISTRO_DE_POSTS</h2>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {postsList.map(p => (
                      <div key={p.id} className="p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a] hover:border-amber-500/30 transition-all">
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2 font-mono">"{p.content}"</p>
                        <div className="flex items-center justify-between border-t border-[#2a2a2a] pt-2">
                          <span className="text-[10px] text-gray-600 font-mono">ID: {p.user_id.substring(0, 8)}... | {new Date(p.created_at).toLocaleDateString()}</span>
                          <button onClick={() => requestDeletePost(p.id)} className="text-red-500 hover:text-red-400 text-xs flex items-center gap-1 hover:bg-red-900/20 px-3 py-1.5 rounded transition-all border border-transparent hover:border-red-900/50 font-mono"><FaTrash /> PURGAR</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'banned' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-2"><FaBan className="text-red-400" /> NODOS_BLOQUEADOS</h2>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {bannedList.length === 0 ? (
                      <div className="text-center py-12"><FaCheckCircle className="text-green-500 text-4xl mx-auto mb-3 opacity-50 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" /><p className="text-gray-400 font-mono">SISTEMA LIMPIO: NO HAY NODOS BLOQUEADOS.</p></div>
                    ) : bannedList.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-red-950/20 rounded-xl border border-red-900/40 hover:border-red-500/50 transition-all">
                        <div className="flex-1">
                          <p className="font-bold text-red-400 font-mono">{u.display_name}</p>
                          <p className="text-xs text-gray-500 font-mono">@{u.username}</p>
                          <p className="text-xs text-gray-400 mt-2 bg-red-950/40 p-2 rounded border border-red-900/30 font-mono"><span className="text-red-500 font-semibold">[MOTIVO]:</span> {u.ban_reason || 'No especificado'}</p>
                        </div>
                        <button onClick={() => setUnbanningUser(u)} className="text-green-500 hover:text-green-400 p-3 bg-green-900/20 hover:bg-green-900/40 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)] font-mono"><FaUnlock /> RESTAURAR</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'suggestions' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-2"><FaRegEnvelope className="text-purple-400" /> BUZÓN_DE_SUGERENCIAS</h2>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {suggestionsList.length === 0 ? <p className="text-center text-gray-500 py-8 font-mono">BUZÓN VACÍO.</p> : suggestionsList.map((s: any) => (
                      <div key={s.id} className="p-4 bg-[#0f0f0f] rounded-lg border border-purple-600/20 hover:border-purple-500/40 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div><p className="text-purple-400 text-xs font-bold uppercase tracking-wider font-mono">{s.profiles?.display_name || 'ANÓNIMO'} (@{s.profiles?.username || 'N/A'})</p><p className="text-gray-600 text-[10px] font-mono">{new Date(s.created_at).toLocaleString('es-AR')}</p></div>
                          <button onClick={() => handleDeleteReport(s.id)} className="text-gray-600 hover:text-red-400 p-2 hover:bg-red-900/20 rounded transition-all"><FaTrash size={14} /></button>
                        </div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap font-mono border-l-2 border-purple-500/50 pl-3">{s.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4 font-mono flex items-center gap-2"><FaFlag className="text-amber-400" /> ALERTAS_DE_SEGURIDAD</h2>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {reportsList.length === 0 ? <p className="text-center text-gray-500 py-8 font-mono">SIN ALERTAS PENDIENTES.</p> : reportsList.map((r: any) => (
                      <div key={r.id} className="p-4 bg-[#0f0f0f] rounded-lg border border-red-900/30 hover:border-red-500/40 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2"><span className="px-2 py-1 bg-red-900/30 text-red-400 text-[10px] font-bold rounded uppercase font-mono border border-red-500/30">{r.reason}</span><span className="text-gray-600 text-[10px] font-mono">{new Date(r.created_at).toLocaleString('es-AR')}</span></div>
                          <button onClick={() => handleDeleteReport(r.id)} className="text-gray-600 hover:text-green-400 p-2 hover:bg-green-900/20 rounded transition-all" title="Archivar"><FaCheckCircle size={14} /></button>
                        </div>
                        <div className="text-sm space-y-1 font-mono">
                          <p><span className="text-gray-500">[REMITENTE]:</span> <span className="text-white">{r.reporter?.display_name || 'ELIMINADO'}</span></p>
                          <p><span className="text-gray-500">[OBJETIVO]:</span> <span className="text-red-400 font-semibold">{r.reported?.display_name || 'ELIMINADO'}</span></p>
                          {r.post_id && <p className="text-[10px] text-gray-600 mt-2 italic bg-[#1a1a1a] p-2 rounded border border-[#2a2a2a]">ADJUNTO_A_POST_ID: {r.post_id.substring(0,8)}...</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'ads' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2"><FaTv className="text-pink-400" /> GESTIÓN_DE_TRANSMISIONES</h2>
                    <button onClick={() => openAdModal()} className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-mono text-sm font-semibold shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all">
                      <FaPlus /> NUEVO_ANUNCIO
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {adsList.length === 0 ? (
                      <div className="text-center py-12">
                        <FaTv className="text-gray-600 text-4xl mx-auto mb-3" />
                        <p className="text-gray-500 font-mono">SIN TRANSMISIONES ACTIVAS. CREA LA PRIMERA.</p>
                      </div>
                    ) : adsList.map(ad => (
                      <div key={ad.id} className={`p-4 rounded-xl border transition-all ${ad.is_active ? 'bg-pink-950/10 border-pink-500/30' : 'bg-[#0f0f0f] border-[#2a2a2a] opacity-60'}`}>
                        <div className="flex items-start gap-3">
                          {ad.image_url && (
                            <img src={ad.image_url} alt={ad.title} className="w-20 h-20 object-cover rounded-lg border border-[#2a2a2a] flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-white font-mono truncate">{ad.title}</h3>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded font-mono ${ad.is_active ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                                {ad.is_active ? 'EN_AIRE' : 'OFFLINE'}
                              </span>
                            </div>
                            {ad.message && <p className="text-gray-400 text-xs font-mono mb-2 line-clamp-2">{ad.message}</p>}
                            <p className="text-[10px] text-gray-600 font-mono">Creado: {new Date(ad.created_at).toLocaleString('es-AR')}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a2a]">
                          <button onClick={() => toggleAdActive(ad)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${ad.is_active ? 'text-amber-400 hover:bg-amber-900/20 border border-amber-500/30' : 'text-green-400 hover:bg-green-900/20 border border-green-500/30'}`}>
                            {ad.is_active ? <><FaToggleOff size={16} /> DESACTIVAR</> : <><FaToggleOn size={16} /> ACTIVAR</>}
                          </button>
                          <div className="flex gap-2">
                            <button onClick={() => openAdModal(ad)} className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/20 rounded-lg transition-all border border-transparent hover:border-blue-900/50 font-mono text-xs">EDITAR</button>
                            <button onClick={() => handleDeleteAd(ad.id)} className="text-red-500 hover:text-red-400 p-2 hover:bg-red-900/20 rounded-lg transition-all border border-transparent hover:border-red-900/50 font-mono text-xs"><FaTrash /> ELIMINAR</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {banningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setBanningUser(null)} />
          <div className="relative bg-[#1a1a1a] border border-red-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-red-900/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono"><FaBan className="text-red-400" /> PROTOCOLO_DE_BANEO: {banningUser.display_name}</h3>
            <textarea value={banReasonInput} onChange={(e) => setBanReasonInput(e.target.value)} placeholder="Ingrese motivo del baneo..." className="w-full h-24 p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-red-500 mb-4 resize-none placeholder:text-gray-600 font-mono text-sm" />
            <div className="flex gap-3">
              <button onClick={() => setBanningUser(null)} className="flex-1 py-3 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] transition-all font-mono text-sm font-medium">CANCELAR</button>
              <button onClick={handleBanUser} disabled={!banReasonInput.trim()} className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-all font-mono text-sm font-medium shadow-[0_0_15px_rgba(220,38,38,0.4)]">EJECUTAR</button>
            </div>
          </div>
        </div>
      )}

      {unbanningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setUnbanningUser(null)} />
          <div className="relative bg-[#1a1a1a] border border-green-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-green-900/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono"><FaUnlock className="text-green-400" /> RESTAURAR_NODO: {unbanningUser.display_name}</h3>
            <div className="flex gap-3">
              <button onClick={() => setUnbanningUser(null)} className="flex-1 py-3 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] transition-all font-mono text-sm font-medium">CANCELAR</button>
              <button onClick={executeUnban} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-mono text-sm font-medium shadow-[0_0_15px_rgba(34,197,94,0.4)]">CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}

      {deletingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeletingPostId(null)} />
          <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-red-900/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-red-900/20">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-red-900/40 to-red-950/60 rounded-full flex items-center justify-center border border-red-700/50"><FaExclamationTriangle className="text-red-400" size={28} /></div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2 font-mono">¿PURGAR ESTE REGISTRO?</h3>
            <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed font-mono">Acción irreversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingPostId(null)} className="flex-1 py-2.5 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] transition-all font-mono text-sm font-medium border border-[#3a3a3a]">CANCELAR</button>
              <button onClick={executeDeletePost} className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all font-mono text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"><FaTrash size={14} /> PURGAR</button>
            </div>
          </div>
        </div>
      )}

      {showAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAdModal(false)} />
          <div className="relative bg-[#1a1a1a] border border-pink-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-pink-900/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-mono">
              <FaTv className="text-pink-400" /> {editingAd ? 'EDITAR_TRANSMISIÓN' : 'NUEVA_TRANSMISIÓN'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase">Título *</label>
                <input type="text" value={adForm.title} onChange={(e) => setAdForm({...adForm, title: e.target.value})} className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-pink-500 font-mono text-sm" placeholder="Ej: Concierto este sábado" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase">Mensaje</label>
                <textarea value={adForm.message} onChange={(e) => setAdForm({...adForm, message: e.target.value})} className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-pink-500 font-mono text-sm h-20 resize-none" placeholder="Descripción del anuncio..." />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-mono uppercase">URL de imagen</label>
                <input type="text" value={adForm.image_url} onChange={(e) => setAdForm({...adForm, image_url: e.target.value})} className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-pink-500 font-mono text-sm" placeholder="https://..." />
                {adForm.image_url && <img src={adForm.image_url} className="mt-2 w-full h-24 object-cover rounded border border-[#2a2a2a]" />}
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
                <input type="checkbox" checked={adForm.is_active} onChange={(e) => setAdForm({...adForm, is_active: e.target.checked})} className="w-4 h-4 accent-pink-500" />
                <label className="text-sm text-gray-300 font-mono">Transmitir inmediatamente</label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAdModal(false)} className="flex-1 py-3 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] transition-all font-mono text-sm font-medium">CANCELAR</button>
              <button onClick={handleSaveAd} className="flex-1 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-all font-mono text-sm font-medium shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                {editingAd ? 'ACTUALIZAR' : 'TRANSMITIR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NeonCard({ icon: Icon, label, value, color, shadow }: { icon: any, label: string, value: number, color: string, shadow: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400 border-blue-500/30 bg-blue-900/10',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-900/10',
    purple: 'text-purple-400 border-purple-500/30 bg-purple-900/10',
    red: 'text-red-400 border-red-500/30 bg-red-900/10',
  }
  return (
    <div className={`p-4 rounded-xl border bg-[#0f0f0f] flex items-center gap-3 transition-all duration-300 hover:shadow-[0_0_20px_${shadow}] hover:border-${color}-500/50 group cursor-default`}>
      <div className={`p-3 rounded-lg border ${colorMap[color]} group-hover:scale-110 transition-transform duration-300`} style={{ boxShadow: `0 0 10px ${shadow}` }}><Icon size={20} /></div>
      <div><p className="text-gray-500 text-[10px] uppercase tracking-widest font-mono font-semibold">{label}</p><p className="text-2xl font-bold text-white drop-shadow-md font-mono">{value}</p></div>
    </div>
  )
}