import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
  FaHome, FaEnvelope, FaSignOutAlt, FaBars,
  FaRegEnvelope, FaQuestionCircle, FaUserShield, FaRobot, FaBell, FaBellSlash, FaMobileAlt, FaTimes, FaAndroid, FaApple, FaCheckCircle, FaHandHoldingHeart, FaFileContract, FaBookmark, FaHeadphones
} from 'react-icons/fa'
import Mascot from './Mascot'
import AsistenteBot from './AsistenteBot'
import DonationModal from './DonationModal'
import { useAppSettings } from '../hooks/useAppSettings'
import { useAdminAlerts } from '../hooks/useAdminAlerts'
import { isInstalled, canPromptInstall, promptInstall, onInstallChange, notificationPermission, requestNotifications } from '../lib/pwa'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, user, signOut, openSuggestionModal, openHelpModal } = useAuth()

  const [unreadCount, setUnreadCount] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [showBot, setShowBot] = useState(false)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [showDonation, setShowDonation] = useState(false)
  const { settings: appSettings } = useAppSettings()
  const [installable, setInstallable] = useState(canPromptInstall())
  const [notifPermission, setNotifPermission] = useState(notificationPermission())

  useEffect(() => onInstallChange(() => setInstallable(canPromptInstall())), [])

  const handleInstall = async () => {
    setShowMenu(false)
    if (installable) await promptInstall()
    else setShowInstallHelp(true)
  }

  const handleNotifications = async () => {
    setShowMenu(false)
    if (notifPermission === 'default') setNotifPermission(await requestNotifications())
    else setShowInstallHelp(true)
  }
  const adminAlerts = useAdminAlerts()

  const currentPath = location.pathname
  const isHome = currentPath === '/' || currentPath === '/home'
  const isMessages = currentPath === '/bandeja' || currentPath.includes('/chat')
  const isProfile = currentPath.includes('/perfil') || currentPath.includes('/editar')

  useEffect(() => {
    if (!user) return

    // 1. Consulta inicial
    const fetchUnread = async () => {
      const [messages, notices] = await Promise.all([
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
        supabase.from('system_notices').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      ])
      setUnreadCount((messages.count || 0) + (notices.error ? 0 : notices.count || 0))
    }

    fetchUnread()

    // 2. Escuchar en TIEMPO REAL nuevos mensajes (INSERT) y mensajes leídos (UPDATE)
    const channel = supabase
      .channel(`unread-badge-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'system_notices', filter: `user_id=eq.${user.id}` },
        () => fetchUnread()
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => fetchUnread() // Recalcula al llegar un mensaje nuevo
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
        () => fetchUnread() // Recalcula cuando el chat marca los mensajes como leídos
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {showMenu && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowMenu(false)}>
          <div
            className="absolute bottom-20 right-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden animate-[slideUp_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {adminAlerts.isAdmin && (
              <button onClick={() => { setShowMenu(false); navigate('/admin'); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]">
                <FaUserShield className="text-purple-400" />
                <span className="text-sm text-gray-300">Panel admin</span>
                {adminAlerts.total > 0 && (
                  <span className="ml-auto pl-3 text-[11px] font-semibold text-red-300">
                    {adminAlerts.reports > 0 && `${adminAlerts.reports} reporte${adminAlerts.reports !== 1 ? 's' : ''}`}
                    {adminAlerts.reports > 0 && adminAlerts.suggestions > 0 && ' · '}
                    {adminAlerts.suggestions > 0 && `${adminAlerts.suggestions} sugerencia${adminAlerts.suggestions !== 1 ? 's' : ''}`}
                  </span>
                )}
              </button>
            )}
            <button onClick={() => { setShowMenu(false); navigate('/demos'); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]">
              <FaHeadphones className="text-cyan-300" />
              <span className="text-sm text-gray-300">Escuchar demos</span>
            </button>
            <button onClick={() => { setShowMenu(false); navigate('/guardados'); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]">
              <FaBookmark className="text-purple-300" />
              <span className="text-sm text-gray-300">Guardados</span>
            </button>
            {!isInstalled() && (
              <button onClick={handleInstall} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]">
                <FaMobileAlt className="text-green-400" />
                <span className="text-sm text-gray-300">Instalar app</span>
              </button>
            )}
            {/* Siempre visible: si el navegador no las permite, se explica cómo hacerlo */}
            <button onClick={handleNotifications} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]">
              {notifPermission === 'denied' || notifPermission === 'unsupported' ? <FaBellSlash className="text-gray-400" /> : <FaBell className={notifPermission === 'granted' ? 'text-green-400' : 'text-yellow-400'} />}
              <span className="text-sm text-gray-300">
                {notifPermission === 'granted' ? 'Notificaciones activadas' : notifPermission === 'denied' ? 'Notificaciones bloqueadas' : notifPermission === 'unsupported' ? 'Notificaciones (ver cómo activarlas)' : 'Activar notificaciones'}
              </span>
            </button>
            <button onClick={() => { setShowMenu(false); openSuggestionModal(); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]">
              <FaRegEnvelope className="text-blue-400" />
              <span className="text-sm text-gray-300">Sugerencias</span>
            </button>
            <button onClick={() => { setShowMenu(false); openHelpModal(); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]">
              <FaQuestionCircle className="text-amber-400" />
              <span className="text-sm text-gray-300">Ayuda</span>
            </button>
            {appSettings?.donation_enabled && (
              <button onClick={() => { setShowMenu(false); setShowDonation(true); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]">
                <FaHandHoldingHeart className="text-pink-400" />
                <span className="text-sm text-gray-300">Apoyar a SANAT</span>
              </button>
            )}
            <button onClick={() => { setShowMenu(false); navigate('/legal'); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]">
              <FaFileContract className="text-gray-400" />
              <span className="text-sm text-gray-300">Términos y privacidad</span>
            </button>
            <button onClick={() => { setShowMenu(false); handleLogout(); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-900/20 transition-colors">
              <FaSignOutAlt className="text-red-400" />
              <span className="text-sm text-red-400">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      <AsistenteBot open={showBot} onClose={() => setShowBot(false)} />
      {showDonation && appSettings && <DonationModal settings={appSettings} onClose={() => setShowDonation(false)} />}

      {showInstallHelp && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInstallHelp(false)} />
          <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-[scaleIn_0.2s_ease-out]">
            <button onClick={() => setShowInstallHelp(false)} className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white" aria-label="Cerrar"><FaTimes /></button>
            <h3 className="text-white text-lg mb-3 flex items-center gap-2"><FaMobileAlt className="text-green-400" /> SANAT como app</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div>
                <p className="font-semibold text-white flex items-center gap-2"><FaAndroid className="text-green-400" /> Android (Chrome)</p>
                <p>Tocá el menú <b>⋮</b> arriba a la derecha → <b>Instalar app</b> o <b>Agregar a la pantalla principal</b>.</p>
              </div>
              <div>
                <p className="font-semibold text-white flex items-center gap-2"><FaApple className="text-gray-200" /> iPhone (Safari)</p>
                <p>Tocá <b>Compartir</b> (el cuadrado con la flecha) → <b>Agregar a inicio</b>. En iPhone las notificaciones solo funcionan con la app instalada así.</p>
              </div>
              {notifPermission === 'denied' && (
                <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-700/40">
                  <p className="font-semibold text-amber-200 flex items-center gap-2"><FaBellSlash /> Notificaciones bloqueadas</p>
                  <p className="mt-1">Mientras estén bloqueadas <b>no te van a llegar avisos de mensajes nuevos ni de likes</b>.</p>
                  <p className="mt-1">Para activarlas: tocá el <b>candado</b> al lado de la dirección → <b>Permisos</b> → <b>Notificaciones</b> → <b>Permitir</b>, y recargá la página. Si instalaste la app: mantené apretado el ícono → <b>Información de la app</b> → <b>Notificaciones</b> → activar.</p>
                </div>
              )}
              {notifPermission === 'unsupported' && (
                <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-700/40">
                  <p className="font-semibold text-amber-200 flex items-center gap-2"><FaBellSlash /> Este navegador no deja pedir notificaciones</p>
                  <p className="mt-1"><b>Brave:</b> tocá el menú <b>⋮</b> → <b>Configuración</b> → <b>Configuración de sitios</b> → <b>Notificaciones</b> y activalas. También revisá que el <b>escudo de Brave</b> (al lado de la dirección) no las esté bloqueando para esta página. Después recargá y volvé a tocar este botón.</p>
                  <p className="mt-1">Si sigue sin aparecer, abrí SANAT en <b>Chrome</b> o instalala como app: ahí las notificaciones funcionan seguro.</p>
                </div>
              )}
              {notifPermission === 'granted' && (
                <p className="text-green-300 flex items-center gap-2"><FaCheckCircle /> Las notificaciones ya están activadas: te van a llegar los mensajes y likes nuevos.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-lg border-t border-purple-600/20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="absolute bottom-2 left-[15%] text-purple-500/20 text-xl animate-floatNote">♪</span>
          <span className="absolute bottom-4 left-[40%] text-pink-500/20 text-lg animate-floatNote" style={{ animationDelay: '1s' }}>♫</span>
          <span className="absolute bottom-1 right-[35%] text-cyan-500/20 text-2xl animate-floatNote" style={{ animationDelay: '2s' }}>♩</span>
          <span className="absolute bottom-3 right-[15%] text-purple-400/20 text-xl animate-floatNote" style={{ animationDelay: '1.5s' }}>♪</span>
        </div>

        <div className="relative max-w-6xl mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            <button onClick={() => navigate('/home')} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${isHome ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
              {isHome && <div className="absolute -bottom-1 w-8 h-1 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>}
              <FaHome size={24} className={`transition-transform ${isHome ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-semibold">Home</span>
            </button>

            <button data-tour="nav-mensajes" onClick={() => navigate('/bandeja')} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${isMessages ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
              {isMessages && <div className="absolute -bottom-1 w-8 h-1 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>}
              <div className="relative">
                <FaEnvelope size={24} className={`transition-transform ${isMessages ? 'scale-110' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0f0f0f] shadow-sm animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">Mensajes</span>
            </button>

            <button data-tour="nav-perfil" onClick={() => navigate(`/perfil/${profile?.id}`)} className="relative group -mt-6">
              <div className="absolute -top-3 -left-2 text-purple-400 text-sm opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 transition-all duration-500">♪</div>
              <div className="absolute -top-4 right-0 text-pink-400 text-lg opacity-0 group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-500 delay-100">♫</div>
              <div className="absolute inset-0 bg-purple-600/30 rounded-full blur-xl group-hover:bg-purple-600/50 transition-all duration-500"></div>
              <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-full p-1.5 border-2 border-purple-500/50 group-hover:border-purple-400 transition-all duration-300 group-hover:scale-110 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Mascot color={profile?.avatar_color || '#a855f7'} size={56} expression={profile?.expression || 'normal'} />
              </div>
              {adminAlerts.total > 0 && (
                <span className="absolute top-0 right-0 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0f0f0f]" title="Reportes y sugerencias nuevos">
                  {adminAlerts.total > 9 ? '9+' : adminAlerts.total}
                </span>
              )}
              <span className={`text-[10px] font-semibold mt-1 transition-colors ${isProfile ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'}`}>Mi Perfil</span>
            </button>

            <button data-tour="nav-asistente" onClick={() => { setShowMenu(false); setShowBot(!showBot) }} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${showBot ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`} aria-label="Asistente de ayuda">
              {showBot && <div className="absolute -bottom-1 w-8 h-1 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>}
              <FaRobot size={24} className={`transition-transform ${showBot ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-semibold">Asistente</span>
            </button>

            <button onClick={() => { setShowBot(false); setShowMenu(!showMenu) }} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${showMenu ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}>
              {showMenu && <div className="absolute -bottom-1 w-8 h-1 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>}
              <div className="relative">
                <FaBars size={24} className={`transition-transform ${showMenu ? 'scale-110' : ''}`} />
                {adminAlerts.total > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f0f0f]" />}
              </div>
              <span className="text-[10px] font-semibold">Opciones</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}