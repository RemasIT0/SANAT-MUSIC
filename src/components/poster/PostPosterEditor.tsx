// src/components/poster/PostPosterEditor.tsx
// Editor del póster de una publicación: mover, agrandar y girar textos, stickers y formas,
// y elegir colores, fuentes y fondo. Pocas opciones a propósito, para no saturar.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { FaTimes, FaFont, FaStar, FaShapes, FaTrash, FaClone, FaArrowUp, FaArrowDown, FaAlignLeft, FaAlignCenter, FaAlignRight, FaUndo } from 'react-icons/fa'
import { FONTS, PATTERNS, STICKERS, type FreeElement, type FreeElementStyle, type PatternKey } from '../../types/freeLayout'
import {
  BODY_ID, MAX_POSTER_ELEMENTS, POSTER_FONTS, POSTER_H, POSTER_SWATCHES, POSTER_W,
  defaultPostDesign, makePosterElement, type PostDesign, type PosterElementType,
} from '../../types/postDesign'
import { elementBoxStyle } from '../free/FreeElementView'
import { PosterElementContent, posterBackground } from './PostPoster'

interface Props {
  initial: PostDesign | null
  content: string
  onSave: (design: PostDesign) => void
  onCancel: () => void
  onRemove?: () => void
}

type Drag = { id: string; mode: 'move' | 'resize'; startX: number; startY: number; orig: FreeElement }

export default function PostPosterEditor({ initial, content, onSave, onCancel, onRemove }: Props) {
  const [design, setDesign] = useState<PostDesign>(() => initial ? structuredClone(initial) : defaultPostDesign())
  const [selectedId, setSelectedId] = useState<string | null>(BODY_ID)
  const [scale, setScale] = useState(0.8)
  const stageRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const scaleRef = useRef(scale)
  scaleRef.current = scale

  const selected = design.elements.find(e => e.id === selectedId) || null
  const isBody = selected?.id === BODY_ID

  // El póster entra entero en el espacio disponible
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => setScale(Math.min(1.2, (el.clientWidth - 24) / POSTER_W, (el.clientHeight - 24) / POSTER_H))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Sin scroll de fondo mientras el editor está abierto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const updateEl = (id: string, patch: Partial<FreeElement>) =>
    setDesign(d => ({ ...d, elements: d.elements.map(e => e.id === id ? { ...e, ...patch } : e) }))
  const updateStyle = (id: string, patch: Partial<FreeElementStyle>) =>
    setDesign(d => ({ ...d, elements: d.elements.map(e => e.id === id ? { ...e, style: { ...e.style, ...patch } } : e) }))
  const setBg = (patch: Partial<PostDesign['background']>) => setDesign(d => ({ ...d, background: { ...d.background, ...patch } }))

  const add = (type: PosterElementType) => {
    if (design.elements.length >= MAX_POSTER_ELEMENTS) return
    const el = makePosterElement(type, design.elements)
    setDesign(d => ({ ...d, elements: [...d.elements, el] }))
    setSelectedId(el.id)
  }
  const remove = () => {
    if (!selected || isBody) return
    setDesign(d => ({ ...d, elements: d.elements.filter(e => e.id !== selected.id) }))
    setSelectedId(null)
  }
  const duplicate = () => {
    if (!selected || isBody || design.elements.length >= MAX_POSTER_ELEMENTS) return
    const z = design.elements.reduce((m, e) => Math.max(m, e.z), 0) + 1
    const copy = { ...selected, id: `p-${Date.now().toString(36)}`, x: Math.min(POSTER_W - selected.w, selected.x + 16), y: Math.min(POSTER_H - selected.h, selected.y + 16), z, style: { ...selected.style } }
    setDesign(d => ({ ...d, elements: [...d.elements, copy] }))
    setSelectedId(copy.id)
  }
  const layer = (dir: 'front' | 'back') => {
    if (!selected) return
    const zs = design.elements.map(e => e.z)
    updateEl(selected.id, { z: dir === 'front' ? Math.max(...zs) + 1 : Math.max(0, Math.min(...zs) - 1) })
  }

  // ---------- Mover y agrandar con el dedo o el mouse ----------
  const startDrag = (e: React.PointerEvent, el: FreeElement, mode: Drag['mode']) => {
    e.stopPropagation()
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    setSelectedId(el.id)
    dragRef.current = { id: el.id, mode, startX: e.clientX, startY: e.clientY, orig: { ...el } }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = (e.clientX - drag.startX) / scaleRef.current
    const dy = (e.clientY - drag.startY) / scaleRef.current
    const o = drag.orig
    if (drag.mode === 'move') {
      updateEl(drag.id, {
        x: Math.round(Math.min(POSTER_W - o.w, Math.max(0, o.x + dx))),
        y: Math.round(Math.min(POSTER_H - o.h, Math.max(0, o.y + dy))),
      })
    } else {
      updateEl(drag.id, {
        w: Math.round(Math.min(POSTER_W - o.x, Math.max(30, o.w + dx))),
        h: Math.round(Math.min(POSTER_H - o.y, Math.max(24, o.h + dy))),
      })
    }
  }
  const endDrag = () => { dragRef.current = null }

  const swatches = (value: string, onPick: (c: string) => void, allowTransparent = false) => (
    <div className="flex flex-wrap items-center gap-1.5">
      {allowTransparent && (
        <button type="button" onClick={() => onPick('transparent')} aria-label="Sin color" aria-pressed={value === 'transparent'}
          className={`w-7 h-7 rounded-full border-2 bg-[repeating-conic-gradient(#3f3f46_0_25%,#18181b_0_50%)] bg-[length:10px_10px] ${value === 'transparent' ? 'border-white' : 'border-[#3f3f46]'}`} />
      )}
      {POSTER_SWATCHES.map(c => (
        <button key={c} type="button" onClick={() => onPick(c)} aria-label={`Color ${c}`} aria-pressed={value === c}
          className={`w-7 h-7 rounded-full border-2 transition-transform ${value === c ? 'border-white scale-110' : 'border-[#3f3f46]'}`} style={{ backgroundColor: c }} />
      ))}
      <label className="relative w-7 h-7 rounded-full border-2 border-dashed border-[#52525b] overflow-hidden cursor-pointer" title="Otro color">
        <input type="color" value={value.startsWith('#') && value.length === 7 ? value : '#ffffff'} onChange={e => onPick(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Elegir otro color" />
        <span className="absolute inset-0 bg-[conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)] opacity-80" aria-hidden />
      </label>
    </div>
  )

  const section = 'space-y-2.5 pb-4 border-b border-[#262626]'
  const label = 'text-[11px] font-bold uppercase tracking-wider text-gray-400'
  const chip = (active: boolean) => `px-3 py-1.5 rounded-lg text-xs border transition-colors ${active ? 'bg-purple-700 border-purple-500 text-white' : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-300 hover:border-purple-500'}`

  return (
    <div className="fixed inset-0 !m-0 z-[70] bg-[#0b0b0b] flex flex-col" role="dialog" aria-modal="true" aria-label="Personalizar publicación">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3 px-4 h-14 border-b border-[#262626] shrink-0" style={{ marginTop: 'var(--banner-h, 0px)' }}>
        <button type="button" onClick={onCancel} className="p-2 text-gray-400 hover:text-white" aria-label="Cerrar sin guardar"><FaTimes size={18} /></button>
        <p className="text-white font-semibold">Personalizar publicación</p>
        <button type="button" onClick={() => onSave(design)} className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold">Listo</button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* Lienzo */}
        <div ref={stageRef} className="relative h-[52vh] md:h-auto md:flex-1 flex items-center justify-center bg-[#141414] overflow-hidden" onPointerDown={() => setSelectedId(null)}>
          <div style={{ width: POSTER_W * scale, height: POSTER_H * scale }} className="relative shrink-0">
            <div
              className="absolute top-0 left-0 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.9)]"
              style={{ width: POSTER_W, height: POSTER_H, transform: `scale(${scale})`, transformOrigin: 'top left', overflow: 'hidden', touchAction: 'none', ...posterBackground(design) }}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {[...design.elements].sort((a, b) => a.z - b.z).map(el => {
                const active = el.id === selectedId
                return (
                  <div
                    key={el.id}
                    style={{ ...elementBoxStyle(el), cursor: 'move', outline: active ? `${2 / scale}px dashed #c084fc` : undefined, outlineOffset: 2 } as CSSProperties}
                    onPointerDown={e => startDrag(e, el, 'move')}
                  >
                    <PosterElementContent el={el} body={content || 'Acá va el texto de tu publicación'} />
                    {active && (
                      <span
                        onPointerDown={e => startDrag(e, el, 'resize')}
                        className="absolute bottom-0 right-0 bg-purple-500 border-2 border-white rounded-full cursor-nwse-resize"
                        style={{ width: 22 / scale, height: 22 / scale, transform: 'translate(40%, 40%)' }}
                        aria-hidden
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <p className="hidden md:block absolute bottom-2 inset-x-0 text-center text-[11px] text-gray-500 pointer-events-none">Arrastrá para mover · el punto violeta cambia el tamaño</p>
        </div>

        {/* Opciones */}
        <div className="flex-1 md:flex-none md:w-80 overflow-y-auto border-t md:border-t-0 md:border-l border-[#262626] p-4 space-y-4">
          <div className={section}>
            <p className={label}>Agregar <span className="font-normal normal-case tracking-normal">({design.elements.length}/{MAX_POSTER_ELEMENTS})</span></p>
            <div className="grid grid-cols-3 gap-2">
              {([['text', 'Texto', FaFont], ['sticker', 'Sticker', FaStar], ['box', 'Forma', FaShapes]] as const).map(([type, text, Icon]) => (
                <button key={type} type="button" onClick={() => add(type)} disabled={design.elements.length >= MAX_POSTER_ELEMENTS}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-200 text-xs hover:border-purple-500 disabled:opacity-40">
                  <Icon className="text-purple-400" /> {text}
                </button>
              ))}
            </div>
          </div>

          {selected ? (
            <div className={section}>
              <p className={label}>{isBody ? 'Texto de la publicación' : selected.type === 'text' ? 'Texto' : selected.type === 'sticker' ? 'Sticker' : 'Forma'}</p>
              {isBody && <p className="text-xs text-gray-400">Es lo que escribiste en la publicación. Movelo, cambiale el tamaño y el estilo.</p>}

              {selected.type === 'text' && !isBody && (
                <input value={selected.content || ''} maxLength={40} onChange={e => updateEl(selected.id, { content: e.target.value })}
                  className="w-full p-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500" aria-label="Texto" />
              )}

              {selected.type === 'text' && (<>
                <div className="flex flex-wrap gap-1.5">
                  {POSTER_FONTS.map(f => (
                    <button key={f} type="button" onClick={() => updateStyle(selected.id, { font: f })} className={chip(selected.style.font === f)} style={{ fontFamily: FONTS[f].css }}>{FONTS[f].label}</button>
                  ))}
                </div>
                <label className="block text-xs text-gray-400">Tamaño de letra
                  <input type="range" min={12} max={56} value={selected.style.fontSize} onChange={e => updateStyle(selected.id, { fontSize: Number(e.target.value) })} className="w-full accent-purple-500" />
                </label>
                <div className="flex gap-1.5">
                  {([['left', FaAlignLeft], ['center', FaAlignCenter], ['right', FaAlignRight]] as const).map(([a, Icon]) => (
                    <button key={a} type="button" onClick={() => updateStyle(selected.id, { align: a })} className={chip(selected.style.align === a)} aria-label={`Alinear ${a}`}><Icon /></button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Color de letra</p>
                {swatches(selected.style.color, c => updateStyle(selected.id, { color: c }))}
                <p className="text-xs text-gray-400">Fondo del texto</p>
                {swatches(selected.style.bg, c => updateStyle(selected.id, { bg: c }), true)}
              </>)}

              {selected.type === 'sticker' && (<>
                <div className="grid grid-cols-7 gap-1 max-h-40 overflow-y-auto pr-1">
                  {Object.entries(STICKERS).map(([key, s]) => (
                    <button key={key} type="button" onClick={() => updateEl(selected.id, { content: key })} title={s.label} aria-label={s.label}
                      className={`aspect-square flex items-center justify-center rounded-lg border ${selected.content === key ? 'border-purple-500 bg-purple-900/40' : 'border-[#2a2a2a] bg-[#0f0f0f]'}`}>
                      <s.icon className="text-gray-200" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Color</p>
                {swatches(selected.style.color, c => updateStyle(selected.id, { color: c }))}
              </>)}

              {selected.type === 'box' && (<>
                <p className="text-xs text-gray-400">Color</p>
                {swatches(selected.style.bg, c => updateStyle(selected.id, { bg: c }))}
                <label className="block text-xs text-gray-400">Esquinas redondeadas
                  <input type="range" min={0} max={200} value={selected.style.radius} onChange={e => updateStyle(selected.id, { radius: Number(e.target.value) })} className="w-full accent-purple-500" />
                </label>
              </>)}

              <label className="block text-xs text-gray-400">Girar
                <input type="range" min={-45} max={45} value={selected.rotation} onChange={e => updateEl(selected.id, { rotation: Number(e.target.value) })} className="w-full accent-purple-500" />
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => layer('front')} className={chip(false)}><FaArrowUp className="inline mr-1" size={10} />Adelante</button>
                <button type="button" onClick={() => layer('back')} className={chip(false)}><FaArrowDown className="inline mr-1" size={10} />Atrás</button>
                {!isBody && <button type="button" onClick={duplicate} className={chip(false)}><FaClone className="inline mr-1" size={10} />Duplicar</button>}
                {!isBody && <button type="button" onClick={remove} className="px-3 py-1.5 rounded-lg text-xs border border-red-900/60 text-red-300 hover:bg-red-950/40"><FaTrash className="inline mr-1" size={10} />Borrar</button>}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 pb-4 border-b border-[#262626]">Tocá un elemento del póster para cambiarlo.</p>
          )}

          <div className={section}>
            <p className={label}>Fondo del póster</p>
            {swatches(design.background.color, c => setBg({ color: c }))}
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setBg({ type: 'solid' })} className={chip(design.background.type === 'solid')}>Liso</button>
              <button type="button" onClick={() => setBg({ type: 'gradient' })} className={chip(design.background.type === 'gradient')}>Degradado</button>
            </div>
            {design.background.type === 'gradient' && (<>
              <p className="text-xs text-gray-400">Segundo color</p>
              {swatches(design.background.color2, c => setBg({ color2: c }))}
            </>)}
            <p className="text-xs text-gray-400">Dibujo</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PATTERNS) as PatternKey[]).map(p => (
                <button key={p} type="button" onClick={() => setBg({ pattern: p })} className={chip(design.background.pattern === p)}>{PATTERNS[p]}</button>
              ))}
            </div>
            {design.background.pattern !== 'none' && (<>
              <p className="text-xs text-gray-400">Color del dibujo</p>
              {swatches(design.background.patternColor, c => setBg({ patternColor: c }))}
            </>)}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setDesign(defaultPostDesign()); setSelectedId(BODY_ID) }} className={chip(false)}><FaUndo className="inline mr-1" size={10} />Empezar de nuevo</button>
            {onRemove && <button type="button" onClick={onRemove} className="px-3 py-1.5 rounded-lg text-xs border border-[#3f3f46] text-gray-300 hover:text-white">Quitar diseño (póster oscuro)</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
