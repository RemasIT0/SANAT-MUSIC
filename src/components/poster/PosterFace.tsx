// src/components/poster/PosterFace.tsx
// La cara de una publicación: siempre un póster del mismo formato (4:5).
// Con diseño muestra lo que armó la persona; sin diseño, un póster oscuro con letras blancas.
import { useMemo, type ReactNode } from 'react'
import '@fontsource/anton/latin-400.css'
import PostPoster from './PostPoster'
import { parsePostDesign } from '../../types/postDesign'

export interface PosterPost {
  content: string
  intention?: string
  looking_for?: string[]
  design?: unknown
}

const HEADLINES: Record<string, string> = {
  'Busco banda': 'Busco banda',
  'Busco músicos para mi proyecto': 'Busco músicos',
  'Ofrezco mis servicios (session musician)': 'Ofrezco servicios',
  'Solo quiero conocer gente': 'Quiero conocer gente',
}

// "body" permite mostrar el texto con links; "full" deja leerlo entero con scroll
export default function PosterFace({ post, body, full = false }: { post: PosterPost; body?: ReactNode; full?: boolean }) {
  const design = useMemo(() => parsePostDesign(post.design), [post.design])
  if (design) return <PostPoster design={design} content={post.content} />

  const headline = post.intention ? HEADLINES[post.intention] || post.intention : null
  return (
    <div className="poster-default">
      <div className="poster-default__in">
        {headline && <p className="poster-default__head">{headline}</p>}
        {(post.looking_for?.length || 0) > 0 && <p className="poster-default__busca">Busca: {post.looking_for!.join(', ')}</p>}
        <div className={`poster-default__body ${full ? 'poster-default__body--full' : ''}`}>{body ?? post.content}</div>
      </div>
    </div>
  )
}
