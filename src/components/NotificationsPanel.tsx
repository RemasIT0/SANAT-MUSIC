// src/components/NotificationsPanel.tsx
// Panel de notificaciones que despliega la mascotita mensajera.
// Celular: hoja que sube desde abajo (se cierra deslizando hacia abajo). Compu: panel debajo de la mascotita.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import type { IconType } from 'react-icons'
import { FaBullhorn, FaBullseye, FaCalendarAlt, FaCheck, FaHeart, FaTimes, FaUsers } from 'react-icons/fa'
import Avatar from './Avatar'
import Mascot from './Mascot'
import type { AppNotification, NotificationKind } from '../hooks/useNotifications'

const KIND: Record<NotificationKind, { icon: IconType; color: string; label: string }> = {
  like: { icon: FaHeart, color: 'text-red-400', label: 'Me gusta' },
  match: { icon: FaBullseye, color: 'text-amber-300', label: 'Coincidencia' },
  invite: { icon: FaUsers, color: 'text-purple-300', label: 'Banda' },
  admin: { icon: FaBullhorn, color: 'text-sky-300', label: 'SANAT' },
  event: { icon: FaCalendarAlt, color: 'text-green-300', label: 'Evento' },
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'recién'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} ${days === 1 ? 'día' : 'días'}`
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function Item({ n, isNew, index, onOpen }: { n: AppNotification; isNew: boolean; index: number; onOpen: () => void }) {
  const kind = KIND[n.kind]
  return (
    <li className="carta" style={{ '--i': Math.min(index, 10) } as CSSProperties}>
      <button type="button" onClick={onOpen} className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors ${isNew ? 'bg-purple-950/40 border-purple-700/50 hover:border-purple-500' : 'bg-[#141414] border-[#262626] hover:border-[#3a3a3a]'}`}>
        <span className="relative shrink-0">
          {n.actor
            ? <Avatar url={n.actor.avatar_url} name={n.actor.name} color={n.actor.avatar_color} size={38} />
            : <span className="w-[38px] h-[38px] rounded-full bg-[#1f1f1f] border border-[#2a2a2a] flex items-center justify-center"><kind.icon className={kind.color} size={15} /></span>}
          {n.actor && <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0f0f0f] flex items-center justify-center"><kind.icon className={kind.color} size={10} /></span>}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm text-white font-semibold leading-snug">{n.title}</span>
          {n.text && <span className="block text-xs text-gray-300 mt-0.5 line-clamp-2">{n.text}</span>}
          <span className="block text-[11px] text-gray-400 mt-1">{kind.label} · {n.kind === 'event' ? 'próximamente' : timeAgo(n.date)}</span>
        </span>
        {isNew && <span className="w-2.5 h-2.5 rounded-full bg-purple-400 mt-1.5 shrink-0" aria-label="Nueva" />}
      </button>
    </li>
  )
}

interface Props {
  anchorRef: RefObject<HTMLElement | null>
  items: AppNotification[]
  loading: boolean
  newIds: Set<string>
  unreadCount: number
  onMarkAll: () => void
  onOpenItem: (n: AppNotification) => void
  onClose: () => void
}

const isPhone = () => window.matchMedia('(max-width: 639px)').matches

export default function NotificationsPanel({ anchorRef, items, loading, newIds, unreadCount, onMarkAll, onOpenItem, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [phone, setPhone] = useState(isPhone)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const [dragY, setDragY] = useState(0)
  const dragStart = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // En compu el panel cuelga de la mascotita; se recalcula si cambia el tamaño de la ventana
  useLayoutEffect(() => {
    const place = () => {
      setPhone(isPhone())
      const box = anchorRef.current?.getBoundingClientRect()
      if (box) setPos({ top: box.bottom + window.scrollY + 10, right: Math.max(12, document.documentElement.clientWidth - box.right) })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [anchorRef])

  // Esc cierra; tocar afuera cierra (en compu); el foco entra al panel y vuelve a la mascotita al cerrar
  useEffect(() => {
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    const anchor = anchorRef.current
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
      anchor?.focus?.()
    }
  }, [anchorRef])

  // En el celular, sin scroll de fondo mientras la hoja está abierta
  useEffect(() => {
    if (!phone) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow }
  }, [phone])

  // Deslizar la hoja hacia abajo para cerrarla
  const onTouchStart = (e: TouchEvent) => { dragStart.current = e.touches[0].clientY }
  const onTouchMove = (e: TouchEvent) => { if (dragStart.current !== null) setDragY(Math.max(0, e.touches[0].clientY - dragStart.current)) }
  const onTouchEnd = () => { if (dragY > 90) onClose(); setDragY(0); dragStart.current = null }

  const upcoming = items.filter(n => n.kind === 'event')
  const news = items.filter(n => n.kind !== 'event')
  const pending = newIds.size
  const message = loading
    ? 'Buscando tus cartas...'
    : pending > 0
      ? `¡Te traje ${pending} ${pending === 1 ? 'novedad' : 'novedades'}!`
      : items.length ? 'Estás al día. Te aviso cuando llegue algo.' : 'Todavía no hay nada. Cuando pase algo, te lo traigo.'

  const content = (
    <>
      {phone && (
        <div className="pt-2.5 pb-1 flex justify-center touch-none" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} aria-hidden>
          <span className="w-10 h-1.5 rounded-full bg-[#3f3f46]" />
        </div>
      )}
      <div className="flex items-end gap-2 px-4 pt-3" onTouchStart={phone ? onTouchStart : undefined} onTouchMove={phone ? onTouchMove : undefined} onTouchEnd={phone ? onTouchEnd : undefined}>
        <span className={`shrink-0 ${pending > 0 ? 'mensajero-salta' : ''}`}><Mascot color="#a855f7" size={54} expression="cartero" /></span>
        <p className="flex-1 mb-7 px-3 py-2 rounded-2xl rounded-bl-sm bg-[#f4efe6] text-[#1c1917] font-marker text-[15px] leading-snug" aria-live="polite">{message}</p>
        <button type="button" onClick={onClose} className="self-start p-2 -mr-2 text-gray-400 hover:text-white" aria-label="Cerrar notificaciones"><FaTimes size={15} /></button>
      </div>
      <div className="flex justify-end px-4 pb-2 border-b border-[#262626]">
        <button type="button" onClick={onMarkAll} disabled={unreadCount === 0} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-200 hover:text-white hover:bg-white/5 disabled:opacity-40">
          <FaCheck size={10} /> Marcar todo leído
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-5">
        {loading ? (
          <ul className="space-y-2" aria-busy="true">{[0, 1, 2].map(i => <li key={i} className="h-[68px] rounded-xl bg-[#141414] border border-[#262626] animate-pulse" />)}</ul>
        ) : (<>
          {upcoming.length > 0 && (
            <section>
              <h2 className="nota nota--sm nota--violet text-xs font-bold uppercase tracking-wider mb-3 ml-1">Se viene</h2>
              <ul className="space-y-2">{upcoming.map((n, i) => <Item key={n.id} n={n} index={i} isNew={false} onOpen={() => onOpenItem(n)} />)}</ul>
            </section>
          )}
          {news.length > 0 && (
            <section>
              <h2 className="nota nota--sm text-xs font-bold uppercase tracking-wider mb-3 ml-1">Novedades</h2>
              <ul className="space-y-2">{news.map((n, i) => <Item key={n.id} n={n} index={i} isNew={newIds.has(n.id)} onOpen={() => onOpenItem(n)} />)}</ul>
            </section>
          )}
          {items.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6 px-2">Acá vas a ver los me gusta a tu publicación, coincidencias con otros músicos, invitaciones a bandas, avisos de SANAT y los shows a los que dijiste "voy".</p>
          )}
        </>)}
      </div>
    </>
  )

  if (phone) {
    return createPortal(
      <div className="fixed inset-0 z-[66]" role="presentation">
        <div className="absolute inset-0 bg-black/60 animate-[fadeIn_0.2s_ease-out]" onClick={onClose} />
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Notificaciones"
          className="notif-hoja absolute inset-x-0 bottom-0 max-h-[78dvh] flex flex-col bg-[#101010] border-t border-[#2a2a2a] rounded-t-2xl outline-none shadow-[0_-12px_30px_rgba(0,0,0,0.6)]"
          style={{ transform: dragY ? `translateY(${dragY}px)` : undefined, transition: dragY ? 'none' : undefined }}
        >
          {content}
        </div>
      </div>,
      document.body,
    )
  }

  return createPortal(
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-label="Notificaciones"
      className="notif-pop absolute z-[60] w-[380px] max-h-[min(70vh,620px)] flex flex-col bg-[#101010] border border-[#2a2a2a] rounded-2xl outline-none shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)]"
      style={pos ? { top: pos.top, right: pos.right } : { visibility: 'hidden' }}
    >
      {content}
    </div>,
    document.body,
  )
}
