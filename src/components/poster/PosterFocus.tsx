// src/components/poster/PosterFocus.tsx
// Un póster abierto: el diseño queda limpio y las acciones van en una tira aparte, debajo.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { FaExternalLinkAlt, FaHeart, FaTimes } from 'react-icons/fa'
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

interface Props {
  post: PosterPost
  author: ReactNode
  chips: ReactNode
  body: ReactNode
  actions: PosterAction[]
  onClose: () => void
  onLike?: () => void
}

export default function PosterFocus({ post, author, chips, body, actions, onClose, onLike }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [burst, setBurst] = useState(0)
  const tap = useDoubleTap(() => { if (onLike) { onLike(); setBurst(b => b + 1) } })
  // En un póster con diseño los links no se pueden tocar: se listan abajo
  const links = parsePostDesign(post.design) ? [...new Set(post.content.match(/https?:\/\/[^\s]+/g) || [])] : []

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[65] bg-black/90 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Publicación" onClick={onClose}>
      <div className="min-h-full flex items-center justify-center p-4" style={{ paddingTop: 'calc(var(--banner-h, 0px) + 1rem)' }}>
        <div className="w-full max-w-[420px] space-y-3 animate-[scaleIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">{author}</div>
            <button ref={closeRef} type="button" onClick={onClose} className="p-2 text-gray-300 hover:text-white" aria-label="Cerrar"><FaTimes size={18} /></button>
          </div>

          <div className="relative mx-auto poster-focus-face shadow-[0_20px_40px_-14px_rgba(0,0,0,0.9)]" onClick={tap}>
            <PosterFace post={post} body={body} full />
            {burst > 0 && <span key={burst} className="poster-heart" aria-hidden><FaHeart /></span>}
          </div>

          {links.length > 0 && (
            <div className="space-y-1">
              {links.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-white"><FaExternalLinkAlt size={9} className="shrink-0" /> <span className="truncate">{url}</span></a>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">{chips}</div>

          <div className="flex justify-around gap-1 bg-[#161616] border border-[#2a2a2a] rounded-xl p-1.5">
            {actions.map(({ key, label, icon: Icon, onClick, className }) => (
              <button key={key} type="button" onClick={onClick} className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-2 rounded-lg text-[11px] hover:bg-white/5 transition-colors ${className || 'text-gray-200'}`}>
                <Icon size={16} /> <span className="truncate max-w-full">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
