// src/components/poster/PostPoster.tsx
// Dibuja el póster de una publicación (lienzo de 400 x 500) achicado al ancho disponible.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { backgroundCss } from '../../types/freeLayout'
import { BODY_ID, POSTER_H, POSTER_W, type PostDesign } from '../../types/postDesign'
import FreeElementView, { elementBoxStyle } from '../free/FreeElementView'
import type { FreeElement } from '../../types/freeLayout'

export function posterBackground(design: PostDesign) {
  return backgroundCss({ ...design.background, image: '', patternSize: 26 })
}

// El texto de la publicación se achica lo necesario para entrar entero en su caja
function FitText({ el, children }: { el: FreeElement; children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    let size = el.style.fontSize
    node.style.fontSize = `${size}px`
    while (node.scrollHeight > node.clientHeight + 1 && size > 9) {
      size -= 1
      node.style.fontSize = `${size}px`
    }
  }, [children, el.w, el.h, el.style.fontSize, el.style.font])
  return <p ref={ref} className="whitespace-pre-wrap break-words leading-snug h-full overflow-hidden">{children}</p>
}

// Contenido de un elemento del póster (el cuerpo muestra el texto de la publicación)
export function PosterElementContent({ el, body }: { el: FreeElement; body: ReactNode }) {
  if (el.id === BODY_ID) return <FitText el={el}>{body}</FitText>
  return <FreeElementView el={el} profile={null} friendsCount={0} interactive={false} />
}

export default function PostPoster({ design, content, className = '' }: { design: PostDesign; content: ReactNode; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setScale(el.clientWidth / POSTER_W)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className={`poster-canvas w-full ${className}`} style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}>
      {scale > 0 && (
        <div className="absolute top-0 left-0" style={{ width: POSTER_W, height: POSTER_H, transform: `scale(${scale})`, transformOrigin: 'top left', ...posterBackground(design) }}>
          {[...design.elements].sort((a, b) => a.z - b.z).map(el => (
            <div key={el.id} style={elementBoxStyle(el)}>
              <PosterElementContent el={el} body={content} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
