// src/components/free/FreeProfileView.tsx
// Vista pública del perfil libre (lienzo de 1000 px):
// - Celular (pantalla más angosta que el lienzo): se achica al ancho y se puede acercar con zoom.
// - Compu: se achica lo necesario para que el diseño entre ENTERO en la pantalla
//   (ancho y alto), y con el zoom se puede agrandar hasta ocupar el ancho.
import { useState, useEffect, useRef } from 'react'
import type { Profile } from '../../types'
import { CANVAS_WIDTH, backgroundCss, type FreeLayout } from '../../types/freeLayout'
import FreeElementView, { elementBoxStyle, elementFxClass } from './FreeElementView'
import { FaSearchPlus, FaSearchMinus, FaExpand } from 'react-icons/fa'

const MAX_UPSCALE = 1.5
// Alto que ocupan el encabezado del perfil, la barra de abajo y los botones de zoom
const RESERVED_HEIGHT = 250

export default function FreeProfileView({ layout, profile, friendsCount }: { layout: FreeLayout; profile: Profile; friendsCount: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)    // escala inicial: el diseño entero a la vista
  const [full, setFull] = useState(1)  // escala máxima permitida con zoom
  const [zoom, setZoom] = useState(1)  // multiplicador sobre la escala inicial

  // Se recalcula cuando cambia el ancho del contenedor o el alto de la ventana
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const width = el.clientWidth
      if (width <= 0) return
      const widthScale = width / CANVAS_WIDTH
      if (widthScale < 1) {
        // Celular: igual que siempre (entra a lo ancho, zoom hasta el tamaño real)
        setFit(widthScale)
        setFull(1)
      } else {
        // Compu: que entre entero, sin pasarse del alto disponible
        const heightScale = Math.max(300, window.innerHeight - RESERVED_HEIGHT) / layout.height
        const maxScale = Math.min(MAX_UPSCALE, widthScale)
        setFit(Math.min(maxScale, heightScale))
        setFull(maxScale)
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [layout.height])

  const scale = Math.min(full, fit * zoom)
  const isSmall = fit < full * 0.95
  const maxZoom = full / fit

  return (
    <div className="space-y-2">
      {isSmall && (
        // Solo los botones de zoom, sin texto
        <div className="flex justify-end">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300">
            <button onClick={() => setZoom(z => Math.max(1, z / 1.4))} disabled={zoom <= 1} className="p-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] disabled:opacity-40" aria-label="Alejar"><FaSearchMinus size={12} /></button>
            <button onClick={() => setZoom(z => Math.min(maxZoom, z * 1.4))} disabled={scale >= full} className="p-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] disabled:opacity-40" aria-label="Acercar"><FaSearchPlus size={12} /></button>
            <button onClick={() => setZoom(1)} disabled={zoom === 1} className="p-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] disabled:opacity-40" aria-label="Ajustar a la pantalla"><FaExpand size={12} /></button>
          </div>
        </div>
      )}

      <div ref={wrapRef} className="w-full overflow-x-auto overflow-y-hidden rounded-none md:rounded-2xl">
        <div style={{ width: CANVAS_WIDTH * scale, height: layout.height * scale, margin: CANVAS_WIDTH * scale <= (wrapRef.current?.clientWidth || 0) + 1 ? '0 auto' : undefined }}>
          <div className="relative overflow-hidden" style={{ width: CANVAS_WIDTH, height: layout.height, transform: `scale(${scale})`, transformOrigin: 'top left', ...backgroundCss(layout.background) }}>
            {layout.elements.map(el => (
              <div key={el.id} style={elementBoxStyle(el)} className={elementFxClass(el)}>
                <FreeElementView el={el} profile={profile} friendsCount={friendsCount} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
