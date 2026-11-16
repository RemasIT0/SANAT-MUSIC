// src/components/MensajeroButton.tsx
// La mascotita mensajera: despliega el panel de notificaciones. Si hay novedades salta y muestra cuántas.
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Mascot from './Mascot'
import NotificationsPanel from './NotificationsPanel'
import { useNotifications, type AppNotification } from '../hooks/useNotifications'

export default function MensajeroButton() {
  const navigate = useNavigate()
  const { items, loading, unreadCount, isNew, markAllSeen } = useNotifications()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  // Las que eran nuevas al abrir siguen resaltadas mientras el panel está abierto
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const label = unreadCount > 0 ? `Notificaciones: ${unreadCount} ${unreadCount === 1 ? 'nueva' : 'nuevas'}` : 'Notificaciones'

  const openPanel = () => { setNewIds(new Set(items.filter(isNew).map(n => n.id))); setOpen(true) }
  // Al cerrar, todo lo que se vio queda leído
  const closePanel = () => { setOpen(false); if (unreadCount > 0) markAllSeen() }
  const markAll = () => { markAllSeen(); setNewIds(new Set()) }
  const openItem = (n: AppNotification) => { closePanel(); navigate(n.href) }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? closePanel() : openPanel())}
        className={`relative shrink-0 w-[58px] flex items-end justify-center rounded-xl bg-[#1a1a1a] border transition-colors pt-3 pb-1 ${open ? 'border-purple-500' : 'border-[#2a2a2a] hover:border-purple-500/50'}`}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={label}
      >
        <span className={`pointer-events-none ${unreadCount > 0 ? 'mensajero-salta' : ''}`}>
          <Mascot color="#a855f7" size={34} expression="cartero" />
        </span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[#0f0f0f]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <NotificationsPanel
          anchorRef={buttonRef}
          items={items}
          loading={loading}
          newIds={newIds}
          unreadCount={unreadCount}
          onMarkAll={markAll}
          onOpenItem={openItem}
          onClose={closePanel}
        />
      )}
    </>
  )
}
