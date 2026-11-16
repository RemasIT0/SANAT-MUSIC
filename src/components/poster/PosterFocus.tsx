// src/components/poster/PosterFocus.tsx
// Pósters abiertos, uno por pantalla: se deslizan hacia arriba y abajo como en Instagram.
// El diseño queda limpio y las acciones van en una tira aparte, debajo de cada póster.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { FaChevronDown, FaExternalLinkAlt, FaHeart, FaTimes } from 'react-icons/fa'
import PosterFace, { type PosterPost } from './PosterFace'
import { useDoubleTap } from './useDoubleTap'
import { parsePostDesign } from '../../types/postDesign'

export interface PosterAction {
  key: string
  label: string
  icon: IconType
  onClick: () => void
  className?: string
}

export interface PosterSlide {
  id: string
  post: PosterPost
  author: ReactNode
  chips: ReactNode
  body: ReactNode
  actions: PosterAction[]
  onLike?: () => void
}

interface Props {
  slides: PosterSlide[]
  startId: string
  onClose: () => void
  onReachEnd?: () => void
}

function Slide({ slide, isLast, onClose }: { slide: PosterSlide; isLast: boolean; onClose: () => void }) {
  const [burst, setBurst] = useState(0)
  const tap = useDoubleTap(() => { if (slide.onLike) { slide.onLike(); setBurst(b => b + 1) } })
  // En un póster con diseño los links no se pueden tocar: se listan abajo
  const links = parsePostDesign(slide.post.design) ? [...new Set(slide.post.content.match(/https?:\/\/[^\s]+/g) || [])] : []

  return (
    <section data-slide={slide.id} className="relative min-h-[100dvh] snap-start snap-always flex items-center justify-center p-4" style={{ paddingTop: 'calc(var(--banner-h, 0px) + 3.5rem)' }} onClick={onClose}>
      <div className="w-full max-w-[420px] space-y-3" onClick={e => e.stopPropagation()}>
        <div className="min-w-0 pr-10">{slide.author}</div>

        <div className="relative mx-auto poster-focus-face shadow-[0_20px_40px_-14px_rgba(0,0,0,0.9)]" onClick={tap}>
          <PosterFace post={slide.post} body={slide.body} full />
          {burst > 0 && <span key={burst} className="poster-heart" aria-hidden><FaHeart /></span>}
        </div>

        {links.length > 0 && (
          <div className="space-y-1">
            {links.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-white"><FaExternalLinkAlt size={9} className="shrink-0" /> <span className="truncate">{url}</span></a>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">{slide.chips}</div>

        <div className="flex justify-around gap-1 bg-[#161616] border border-[#2a2a2a] rounded-xl p-1.5">
          {slide.actions.map(({ key, label, icon: Icon, onClick, className }) => (
            <button key={key} type="button" onClick={onClick} className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] hover:bg-white/5 transition-colors ${className || 'text-gray-200'}`}>
              <Icon size={16} /> <span className="truncate max-w-full">{label}</span>
            </button>
          ))}
        </div>

        {!isLast && (
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1" aria-hidden>
            <FaChevronDown className="poster-swipe-hint" size={10} /> Deslizá para ver más
          </p>
        )}
      </div>
    </section>
  )
}

export default function PosterFocus({ slides, startId, onClose, onReachEnd }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const onReachEndRef = useRef(onReachEnd)
  onReachEndRef.current = onReachEnd

  // Abre en el póster tocado; sin scroll de fondo; Esc cierra y las flechas pasan de póster
  useEffect(() => {
    const scroller = scrollerRef.current
    scroller?.querySelector<HTMLElement>(`[data-slide="${CSS.escape(startId)}"]`)?.scrollIntoView({ block: 'start' })
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
      else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && scroller) {
        e.preventDefault()
        scroller.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * scroller.clientHeight, behavior: 'smooth' })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
    // Solo al abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Al llegar al último póster se piden más
  const lastId = slides[slides.length - 1]?.id
  useEffect(() => {
    const scroller = scrollerRef.current
    const last = lastId ? scroller?.querySelector<HTMLElement>(`[data-slide="${CSS.escape(lastId)}"]`) : null
    if (!scroller || !last || !onReachEndRef.current) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) onReachEndRef.current?.() }, { root: scroller, threshold: 0.3 })
    observer.observe(last)
    return () => observer.disconnect()
  }, [lastId])

  return (
    <div className="fixed inset-0 z-[65] bg-black/90" role="dialog" aria-modal="true" aria-label="Publicaciones">
      <div ref={scrollerRef} className="h-full overflow-y-auto overscroll-contain snap-y snap-mandatory">
        {slides.map((slide, i) => <Slide key={slide.id} slide={slide} isLast={i === slides.length - 1} onClose={onClose} />)}
      </div>
      <button ref={closeRef} type="button" onClick={onClose} className="absolute right-3 p-2.5 rounded-full bg-black/60 text-gray-200 hover:text-white z-10" style={{ top: 'calc(var(--banner-h, 0px) + 0.75rem)' }} aria-label="Cerrar"><FaTimes size={18} /></button>
    </div>
  )
}
