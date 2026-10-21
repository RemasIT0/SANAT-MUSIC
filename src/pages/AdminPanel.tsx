// src/pages/AdminPanel.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { 
  FaUsers, FaNewspaper, FaChartPie, FaTrash, FaArrowLeft, 
  FaSpinner, FaSearch, FaRegEnvelope, FaFlag, FaBan, FaUnlock 
} from 'react-icons/fa'
import Toast from '../components/Toast'
import AnimatedBackground from '../components/AnimatedBackground'

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
  
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts' | 'banned' | 'suggestions' | 'reports'>('stats')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [banningUser, setBanningUser] = useState<any>(null)
  const [banReasonInput, setBanReasonInput] = useState('')
  
  // ✅ NUEVO: Estado para el modal de desbaneo
  const [unbanningUser, setUnbanningUser] = useState<any>(null)

  useEffect(() => {
    if (user?.email !== 'remaslove281@gmail.com') {
      navigate('/home', { replace: true })
      return
    }
    fetchData()
  }, [user, navigate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { count: postCount } = await supabase.from('posts').select('*', { count: 'exact', head: true })
      const { count: suggestionCount } = await supabase.from('suggestions').select('*', { count: 'exact', head: true })
      const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true })
      const { count: bannedCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true)
      
      setStats({ users: userCount || 0, posts: postCount || 0, suggestions: suggestionCount || 0, reports: reportCount || 0, banned: bannedCount || 0 })

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

    } catch (error) {
      console.error('Error en fetchData:', error)
      setToast({ message: 'Error al cargar datos', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async () => {
    if (!banningUser || !banReasonInput.trim()) return
    try {
      const { data, error } = await supabase.from('profiles').update({ is_banned: true, ban_reason: banReasonInput }).eq('id', banningUser.id).select()
      if (error) throw error
      setToast({ message: 'Usuario baneado correctamente', type: 'success' })
      setBanningUser(null)
      setBanReasonInput('')
      fetchData()
    } catch (error: any) {
      setToast({ message: 'Error al banear: ' + error.message, type: 'error' })
    }
  }

  // ✅ NUEVA FUNCIÓN: Ejecuta el desbaneo sin alert()
  const executeUnban = async () => {
    if (!unbanningUser) return
    try {
      const { error } = await supabase.from('profiles').update({ is_banned: false, ban_reason: null }).eq('id', unbanningUser.id)
      if (error) throw error
      setToast({ message: 'Usuario desbaneado correctamente', type: 'success' })
      setUnbanningUser(null)
      fetchData()
    } catch (error: any) {
      setToast({ message: 'Error al desbanear: ' + error.message, type: 'error' })
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return
    try {
      await supabase.from('posts').delete().eq('id', postId)
      setPostsList(postsList.filter(p => p.id !== postId))
      setToast({ message: 'Publicación eliminada', type: 'success' })
    } catch { setToast({ message: 'Error al eliminar', type: 'error' }) }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return
    try {
      await supabase.from('posts').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)
      setUsersList(usersList.filter(u => u.id !== userId))
      setToast({ message: 'Usuario eliminado', type: 'success' })
    } catch { setToast({ message: 'Error al eliminar', type: 'error' }) }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('¿Archivar este reporte?')) return
    try {
      await supabase.from('reports').delete().eq('id', reportId)
      setReportsList(reportsList.filter(r => r.id !== reportId))
      setToast({ message: 'Reporte archivado', type: 'success' })
    } catch { setToast({ message: 'Error', type: 'error' }) }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f0f] gap-4">
      <FaSpinner className="animate-spin text-4xl text-purple-600" />
      <p className="text-gray-400">Cargando panel...</p>
    </div>
  )

  const totalUsers = Math.max(stats.users, 1)
  const activePct = ((stats.users - stats.banned) / totalUsers) * 100

  return (
    <div className="min-h-screen relative text-gray-200 font-sans pb-24">
      <AnimatedBackground />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <FaArrowLeft /> Volver
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaChartPie className="text-purple-500" /> Panel Admin
          </h1>
          <div className="w-20"></div>
        </div>

        <div className="flex gap-2 border-b border-[#2a2a2a] pb-2 overflow-x-auto">
          {[
            { id: 'stats', label: 'Estadísticas', icon: FaChartPie },
            { id: 'users', label: `Usuarios (${usersList.length})`, icon: FaUsers },
            { id: 'posts', label: `Posts (${postsList.length})`, icon: FaNewspaper },
            { id: 'banned', label: `Baneados (${bannedList.length})`, icon: FaBan, color: 'text-red-400' },
            { id: 'suggestions', label: `Buzón (${suggestionsList.length})`, icon: FaRegEnvelope },
            { id: 'reports', label: `Reportes (${reportsList.length})`, icon: FaFlag, color: 'text-amber-400' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-purple-700 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'}`}>
              <tab.icon className={tab.color || ''} size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 min-h-[400px]">
          {activeTab === 'stats' && (
            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 py-8">
              <div className="relative w-56 h-56 flex-shrink-0">
                <div className="w-full h-full rounded-full transition-all duration-1000" style={{ background: `conic-gradient(#a855f7 0% ${activePct}%, #ef4444 ${activePct}% 100%)`, boxShadow: '0 0 40px rgba(168, 85, 247, 0.2)' }}>
                  <div className="absolute inset-6 bg-[#1a1a1a] rounded-full flex flex-col items-center justify-center border border-[#2a2a2a] shadow-inner">
                    <span className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{stats.users}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Total</span>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-md space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <NeonCard icon={FaUsers} label="Músicos" value={stats.users} color="purple" shadow="rgba(168,85,247,0.4)" />
                  <NeonCard icon={FaNewspaper} label="Posts" value={stats.posts} color="blue" shadow="rgba(59,130,246,0.4)" />
                  <NeonCard icon={FaRegEnvelope} label="Sugerencias" value={stats.suggestions} color="amber" shadow="rgba(245,158,11,0.4)" />
                  <NeonCard icon={FaFlag} label="Reportes" value={stats.reports} color="red" shadow="rgba(239,68,68,0.4)" />
                </div>
                <div className="space-y-3 pt-4 border-t border-[#2a2a2a]">
                  <div className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-xl border border-purple-500/20">
                    <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></div><span className="text-gray-300 text-sm font-medium">Usuarios Activos</span></div>
                    <span className="text-white font-bold text-lg">{stats.users - stats.banned}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-xl border border-red-500/20">
                    <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div><span className="text-gray-300 text-sm font-medium">Usuarios Baneados</span></div>
                    <span className="text-white font-bold text-lg">{stats.banned}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="relative mb-4">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" placeholder="Buscar usuario..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600" />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {usersList.filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || u.display_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a] hover:border-purple-500/30 transition-all">
                    <div><p className="font-bold text-white">{u.display_name}</p><p className="text-xs text-gray-500">@{u.username}</p></div>
                    <button onClick={() => setBanningUser(u)} className="text-red-500 hover:text-red-400 p-2 flex items-center gap-1 text-sm font-semibold hover:bg-red-900/20 rounded-lg transition-all"><FaBan /> Banear</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {postsList.map(p => (
                <div key={p.id} className="p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
                  <p className="text-gray-300 text-sm mb-2 line-clamp-2">{p.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">User: {p.user_id.substring(0, 8)}...</span>
                    <button onClick={() => handleDeletePost(p.id)} className="text-red-500 hover:text-red-400 text-xs flex items-center gap-1"><FaTrash /> Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'banned' && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {bannedList.length === 0 ? (
                <div className="text-center py-12"><FaUnlock className="text-green-500 text-4xl mx-auto mb-3 opacity-50" /><p className="text-gray-400">¡Genial! No hay usuarios baneados.</p></div>
              ) : bannedList.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-red-900/10 rounded-xl border border-red-900/30">
                  <div className="flex-1">
                    <p className="font-bold text-red-400">{u.display_name}</p>
                    <p className="text-xs text-gray-500">@{u.username}</p>
                    <p className="text-xs text-gray-400 mt-2 bg-red-950/50 p-2 rounded border border-red-900/30"><span className="text-red-500 font-semibold">Motivo:</span> {u.ban_reason || 'Sin motivo especificado'}</p>
                  </div>
                  {/* ✅ BOTÓN QUE ABRE EL MODAL EN LUGAR DEL ALERT */}
                  <button onClick={() => setUnbanningUser(u)} className="text-green-500 hover:text-green-400 p-3 bg-green-900/20 hover:bg-green-900/40 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold border border-green-500/30">
                    <FaUnlock /> Desbanear
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {suggestionsList.length === 0 ? <p className="text-center text-gray-500 py-8">Buzón vacío.</p> : suggestionsList.map((s: any) => (
                <div key={s.id} className="p-4 bg-[#0f0f0f] rounded-lg border border-purple-600/20">
                  <div className="flex justify-between items-start mb-2">
                    <div><p className="text-purple-400 text-xs font-bold uppercase tracking-wider">{s.profiles?.display_name || 'Anónimo'} (@{s.profiles?.username || 'N/A'})</p><p className="text-gray-600 text-[10px]">{new Date(s.created_at).toLocaleString('es-AR')}</p></div>
                    <button onClick={() => handleDeleteReport(s.id)} className="text-gray-600 hover:text-red-400"><FaTrash size={14} /></button>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{s.content}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {reportsList.length === 0 ? <p className="text-center text-gray-500 py-8">¡Genial! No hay reportes pendientes.</p> : reportsList.map((r: any) => (
                <div key={r.id} className="p-4 bg-[#0f0f0f] rounded-lg border border-red-900/30">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2"><span className="px-2 py-1 bg-red-900/30 text-red-400 text-[10px] font-bold rounded uppercase">{r.reason}</span><span className="text-gray-600 text-[10px]">{new Date(r.created_at).toLocaleString('es-AR')}</span></div>
                    <button onClick={() => handleDeleteReport(r.id)} className="text-gray-600 hover:text-green-400" title="Archivar"><FaTrash size={14} /></button>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="text-gray-500">Reportado por:</span> <span className="text-white">{r.reporter?.display_name || 'Eliminado'}</span></p>
                    <p><span className="text-gray-500">Usuario reportado:</span> <span className="text-red-400 font-semibold">{r.reported?.display_name || 'Eliminado'}</span></p>
                    {r.post_id && <p className="text-xs text-gray-600 mt-2 italic">Adjunto a publicación (ID: {r.post_id.substring(0,8)}...)</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE BANEO */}
      {banningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setBanningUser(null)} />
          <div className="relative bg-[#1a1a1a] border border-red-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FaBan className="text-red-400" /> Banear a {banningUser.display_name}</h3>
            <p className="text-gray-400 text-sm mb-4">Este usuario no podrá iniciar sesión hasta que lo desbanees.</p>
            <textarea value={banReasonInput} onChange={(e) => setBanReasonInput(e.target.value)} placeholder="Motivo del baneo (ej: Spam, Acoso)" className="w-full h-24 p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-red-500 mb-4 resize-none placeholder:text-gray-600" />
            <div className="flex gap-3">
              <button onClick={() => setBanningUser(null)} className="flex-1 py-3 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] transition-all font-medium">Cancelar</button>
              <button onClick={handleBanUser} disabled={!banReasonInput.trim()} className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-all font-medium shadow-[0_0_15px_rgba(220,38,38,0.4)]">Confirmar Baneo</button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NUEVO: MODAL DE DESBANEO PROFESIONAL */}
      {unbanningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[scaleIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setUnbanningUser(null)} />
          <div className="relative bg-[#1a1a1a] border border-green-900/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FaUnlock className="text-green-400" /> Desbanear a {unbanningUser.display_name}</h3>
            <p className="text-gray-400 text-sm mb-6">Este usuario podrá volver a iniciar sesión y participar en la comunidad.</p>
            <div className="flex gap-3">
              <button onClick={() => setUnbanningUser(null)} className="flex-1 py-3 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] transition-all font-medium">Cancelar</button>
              <button onClick={executeUnban} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all font-medium shadow-[0_0_15px_rgba(34,197,94,0.4)]">Confirmar Desbaneo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NeonCard({ icon: Icon, label, value, color, shadow }: { icon: any, label: string, value: number, color: string, shadow: string }) {
  return (
    <div className={`bg-[#0f0f0f] p-4 rounded-xl border border-[#2a2a2a] flex items-center gap-3 transition-all hover:shadow-[0_0_20px_${shadow}] hover:border-${color}-500/50 group`}>
      <div className={`p-3 rounded-lg bg-gray-900 text-${color}-400 group-hover:scale-110 transition-transform`} style={{ boxShadow: `0 0 10px ${shadow}` }}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-2xl font-bold text-white drop-shadow-md">{value}</p>
      </div>
    </div>
  )
}