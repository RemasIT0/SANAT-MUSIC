// src/components/poster/PosterTile.tsx
// Póster compacto del mural. Un toque lo abre; dos toques dan me gusta.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { FaHeart } from 'react-icons/fa'
import Avatar from '../Avatar'
import PosterFace, { type PosterPost } from './PosterFace'
import { useDoubleTap } from './useDoubleTap'

interface Props {
  post: PosterPost & { display_name: string; avatar_url: string | null; avatar_color: string; likes_count?: number; is_liked_by_me?: boolean }
  tilt: number
  isOnline?: boolean
  onOpen: () => void
  onLike: () => void
}

export default function PosterTile({ post, tilt, isOnline, onOpen, onLike }: Props) {
  const [burst, setBurst] = useState(0)
  const hideRef = useRef<number | null>(null)
  useEffect(() => () => { if (hideRef.current !== null) window.clearTimeout(hideRef.current) }, [])
  const like = () => {
    onLike()
    setBurst(b => b + 1)
    if (hideRef.current !== null) window.clearTimeout(hideRef.current)
    hideRef.current = window.setTimeout(() => setBurst(0), 800)
  }
  const tap = useDoubleTap(like, onOpen)
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Publicación de ${post.display_name}. Abrir para ver opciones`}
      className="poster-card poster-tile"
      style={{ '--poster-tilt': `${tilt}deg` } as CSSProperties}
      onClick={tap}
      onKeyDown={onKey}
    >
      <PosterFace post={post} />
      <div className="flex items-center gap-2 px-2 py-1.5 border-t border-[#262626]">
        <Avatar url={post.avatar_url} name={post.display_name} color={post.avatar_color || '#333'} size={22} isOnline={isOnline} />
        <span className="flex-1 min-w-0 truncate text-xs font-semibold text-white">{post.display_name}</span>
        <span className={`flex items-center gap-1 text-[11px] font-bold ${post.is_liked_by_me ? 'text-red-400' : 'text-gray-400'}`}><FaHeart size={10} /> {post.likes_count || 0}</span>
      </div>
      {burst > 0 && <span key={burst} className="poster-heart" aria-hidden><FaHeart /></span>}
    </div>
  )
}
