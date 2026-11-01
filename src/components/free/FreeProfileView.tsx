// src/components/free/FreeProfileView.tsx
// Vista pública del perfil libre: se ve igual que en computadora (lienzo de
// 1000 px) achicado para entrar en la pantalla, con zoom para leer de cerca.
import { useState, useEffect, useRef } from 'react'
import type { Profile } from '../../types'
import { CANVAS_WIDTH, backgroundCss, type FreeLayout } from '../../types/freeLayout'
import FreeElementView, { elementBoxStyle } from './FreeElementView'
import { FaSearchPlus, FaSearchMinus, FaExpand, FaDesktop } from 'react-icons/fa'

export default function FreeProfileView({ layout, profile, friendsCount }: { layout: FreeLayout; profile: Profile; friendsCount: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(1)
  const [zoom, setZoom] = useState(1) // multiplicador sobre el ajuste a pantalla

  useEffect(() => {
    const measure = () => {
      if (wrapRef.current) setFitScale(Math.min(1, wrapRef.current.clientWidth / CANVAS_WIDTH))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const scale = Math.min(1, fitScale * zoom)
  const isSmall = fitScale < 0.95
  const maxZoom = 1 / fitScale

  return (
    <div className="space-y-2">
      {isSmall && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-gray-300">
          <FaDesktop className="text-purple-400 flex-shrink-0" />
          <p className="flex-1">Perfil con vista de computadora. Usá el zoom (o pellizcá la pantalla) para leer.</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setZoom(z => Math.max(1, z / 1.4))} disabled={zoom <= 1} className="p-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] disabled:opacity-40" aria-label="Alejar"><FaSearchMinus size={12} /></button>
            <button onClick={() => setZoom(z => Math.min(maxZoom, z * 1.4))} disabled={scale >= 1} className="p-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] disabled:opacity-40" aria-label="Acercar"><FaSearchPlus size={12} /></button>
            <button onClick={() => setZoom(1)} disabled={zoom === 1} className="p-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] disabled:opacity-40" aria-label="Ajustar a la pantalla"><FaExpand size={12} /></button>
          </div>
        </div>
      )}

      <div ref={wrapRef} className="w-full overflow-x-auto overflow-y-hidden rounded-none md:rounded-2xl">
        <div style={{ width: CANVAS_WIDTH * scale, height: layout.height * scale, margin: scale < fitScale + 0.001 ? '0 auto' : undefined }}>
          <div className="relative overflow-hidden" style={{ width: CANVAS_WIDTH, height: layout.height, transform: `scale(${scale})`, transformOrigin: 'top left', ...backgroundCss(layout.background) }}>
            {layout.elements.map(el => (
              <div key={el.id} style={elementBoxStyle(el)}>
                <FreeElementView el={el} profile={profile} friendsCount={friendsCount} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
