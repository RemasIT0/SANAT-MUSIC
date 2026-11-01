// src/components/free/FreeProfileEditor.tsx
// Editor libre de perfil (estilo MySpace). Se diseña en un lienzo de
// computadora de 1000 px de ancho; en el celular se ve achicado y con zoom.
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import Toast from '../Toast'
import { useDialog } from '../DialogProvider'
import { compressImage, imageExtension } from '../../lib/imageCompress'
import { PROFILE_TEMPLATES, type ProfileTemplate } from '../../types/profileTemplates'
import FreeElementView, { elementBoxStyle } from './FreeElementView'
import {
  CANVAS_WIDTH, MIN_CANVAS_HEIGHT, MAX_CANVAS_HEIGHT, MAX_ELEMENTS, MAX_IMAGES, MAX_SAVED_DESIGNS,
  ELEMENT_CATALOG, STICKERS, FONTS, makeElement, cloneElement, defaultFreeLayout, parseFreeLayout, backgroundCss,
  type FreeLayout, type FreeElement, type FreeElementType, type FreeElementStyle, type FontKey,
} from '../../types/freeLayout'
import {
  FaArrowLeft, FaSave, FaSpinner, FaPlus, FaTrash, FaClone, FaArrowUp, FaArrowDown, FaUndo, FaUpload,
  FaSearchPlus, FaSearchMinus, FaExpand, FaDesktop, FaTimes, FaAlignLeft, FaAlignCenter, FaAlignRight,
} from 'react-icons/fa'


type Tab = 'add' | 'element' | 'background' | 'designs'
const SOCIAL_PLATFORMS = ['Instagram', 'YouTube', 'Spotify', 'TikTok', 'Twitter/X']
const TEXT_TYPES: FreeElementType[] = ['name', 'bio', 'instruments', 'genres', 'location', 'friends', 'social', 'text']
const WARNING_KEY = 'sanat_free_editor_warning_seen'

interface SavedDesign { id: string; name: string; data: FreeLayout; created_at: string }

export default function FreeProfileEditor({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth()
  const { confirm } = useDialog()
  const [layout, setLayout] = useState<FreeLayout | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('add')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [friendsCount, setFriendsCount] = useState(0)
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const [designName, setDesignName] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [fitScale, setFitScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [showWarning, setShowWarning] = useState(false)
  const [newLink, setNewLink] = useState({ platform: 'Instagram', url: '' })

  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ id: string; mode: 'move' | 'resize'; startX: number; startY: number; orig: { x: number; y: number; w: number; h: number } } | null>(null)

  const scale = Math.min(1, fitScale * zoom)
  const scaleRef = useRef(scale)
  scaleRef.current = scale

  // ---------- Carga inicial ----------
  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [{ data: layoutRow }, { count }, { data: savedDesigns }] = await Promise.all([
        supabase.from('profile_layouts').select('layout_config').eq('user_id', user.id).maybeSingle(),
        supabase.from('friends').select('*', { count: 'exact', head: true }).or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
        supabase.from('profile_designs').select('id, name, data, created_at').order('created_at', { ascending: false }),
      ])
      const existing = layoutRow?.layout_config?.layout === 'free' ? parseFreeLayout(layoutRow.layout_config.free) : null
      setLayout(existing || defaultFreeLayout(!!profile?.audio_url))
      setFriendsCount(count || 0)
      setDesigns((savedDesigns as SavedDesign[]) || [])
    }
    load()
    try { if (!sessionStorage.getItem(WARNING_KEY) && window.innerWidth < 1024) setShowWarning(true) } catch {}
  }, [user])

  // ---------- Escala del lienzo ----------
  useEffect(() => {
    const measure = () => {
      if (canvasWrapRef.current) setFitScale(Math.min(1, (canvasWrapRef.current.clientWidth - 16) / CANVAS_WIDTH))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [layout !== null])

  // ---------- Edición ----------
  const change = useCallback((fn: (prev: FreeLayout) => FreeLayout) => {
    setLayout(prev => (prev ? fn(prev) : prev))
    setDirty(true)
  }, [])

  const updateEl = (id: string, patch: Partial<FreeElement>) =>
    change(prev => ({ ...prev, elements: prev.elements.map(el => (el.id === id ? { ...el, ...patch } : el)) }))

  const updateStyle = (id: string, patch: Partial<FreeElementStyle>) =>
    change(prev => ({ ...prev, elements: prev.elements.map(el => (el.id === id ? { ...el, style: { ...el.style, ...patch } } : el)) }))

  const selected = layout?.elements.find(el => el.id === selectedId) || null
  // Imágenes usadas: las del lienzo + la de fondo (si hay)
  const imagesUsed = (layout?.elements.filter(e => e.type === 'image').length || 0) + (layout?.background.type === 'image' && layout.background.image ? 1 : 0)

  const addElement = (type: FreeElementType) => {
    if (!layout) return
    if (layout.elements.length >= MAX_ELEMENTS) { setToast({ message: `Máximo ${MAX_ELEMENTS} elementos por perfil`, type: 'info' }); return }
    if (type === 'image' && imagesUsed >= MAX_IMAGES) { setToast({ message: `Máximo ${MAX_IMAGES} imágenes por perfil, contando el fondo. Borrá una para agregar otra.`, type: 'info' }); return }
    const el = makeElement(type, layout.elements, layout.height)
    change(prev => ({ ...prev, elements: [...prev.elements, el] }))
    setSelectedId(el.id)
    setTab('element')
  }

  const removeSelected = () => {
    if (!selected) return
    change(prev => ({ ...prev, elements: prev.elements.filter(el => el.id !== selected.id) }))
    setSelectedId(null)
    setTab('add')
  }

  const duplicateSelected = () => {
    if (!selected || !layout || layout.elements.length >= MAX_ELEMENTS) return
    const copy = cloneElement(selected, layout.elements)
    change(prev => ({ ...prev, elements: [...prev.elements, copy] }))
    setSelectedId(copy.id)
  }

  const moveLayer = (direction: 'front' | 'back') => {
    if (!selected || !layout) return
    const zs = layout.elements.map(e => e.z)
    updateEl(selected.id, { z: direction === 'front' ? Math.max(...zs) + 1 : Math.min(...zs) - 1 })
  }

  // ---------- Arrastrar y cambiar tamaño ----------
  const startDrag = (e: React.PointerEvent, el: FreeElement, mode: 'move' | 'resize') => {
    e.stopPropagation()
    e.preventDefault()
    setSelectedId(el.id)
    if (tab === 'add') setTab('element')
    dragRef.current = { id: el.id, mode, startX: e.clientX, startY: e.clientY, orig: { x: el.x, y: el.y, w: el.w, h: el.h } }
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const dx = (e.clientX - drag.startX) / scaleRef.current
      const dy = (e.clientY - drag.startY) / scaleRef.current
      setLayout(prev => {
        if (!prev) return prev
        return {
          ...prev,
          elements: prev.elements.map(el => {
            if (el.id !== drag.id) return el
            if (drag.mode === 'move') {
              return {
                ...el,
                x: Math.round(Math.min(CANVAS_WIDTH - el.w, Math.max(0, drag.orig.x + dx))),
                y: Math.round(Math.min(prev.height - el.h, Math.max(0, drag.orig.y + dy))),
              }
            }
            return {
              ...el,
              w: Math.round(Math.min(CANVAS_WIDTH - el.x, Math.max(40, drag.orig.w + dx))),
              h: Math.round(Math.min(prev.height - el.y, Math.max(30, drag.orig.h + dy))),
            }
          }),
        }
      })
      setDirty(true)
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  // Teclado (compu): Supr borra, flechas mueven
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected || !layout) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const step = e.shiftKey ? 10 : 1
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); updateEl(selected.id, { x: Math.max(0, selected.x - step) }) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); updateEl(selected.id, { x: Math.min(CANVAS_WIDTH - selected.w, selected.x + step) }) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); updateEl(selected.id, { y: Math.max(0, selected.y - step) }) }
      else if (e.key === 'ArrowDown') { e.preventDefault(); updateEl(selected.id, { y: Math.min(layout.height - selected.h, selected.y + step) }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ---------- Imágenes ----------
  const uploadImage = async (file: File, preset: 'gallery' | 'background' = 'gallery'): Promise<string | null> => {
    if (!user) return null
    setUploading(true)
    try {
      const toUpload = await compressImage(file, preset)
      const path = `gallery/${user.id}-${Date.now()}.${imageExtension(toUpload)}`
      const { error } = await supabase.storage.from('avatars').upload(path, toUpload, { contentType: toUpload.type })
      if (error) throw error
      return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    } catch (error: any) {
      setToast({ message: 'Error al subir la imagen: ' + error.message, type: 'error' })
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleElementImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !selected) return
    const url = await uploadImage(file)
    if (url) updateEl(selected.id, { content: url })
  }

  const handleBackgroundImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !layout) return
    // Reemplazar el fondo no suma; poner uno nuevo sí cuenta como imagen
    if (!layout.background.image && imagesUsed >= MAX_IMAGES) {
      setToast({ message: `Ya usaste las ${MAX_IMAGES} imágenes (contando el fondo). Borrá una imagen para poner fondo.`, type: 'info' })
      return
    }
    const url = await uploadImage(file, 'background')
    if (url) change(prev => ({ ...prev, background: { ...prev.background, type: 'image', image: url } }))
  }

  // ---------- Guardar / diseños ----------
  const save = async () => {
    if (!user || !layout) return
    setSaving(true)
    const { error } = await supabase.from('profile_layouts').upsert({
      user_id: user.id,
      layout_config: { layout: 'free', free: layout },
      background_type: layout.background.type === 'gradient' ? 'gradient' : 'solid',
      background_value: layout.background.color,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    if (error) { setToast({ message: 'Error al guardar: ' + error.message, type: 'error' }); return }
    setDirty(false)
    setToast({ message: '¡Perfil publicado!', type: 'success' })
    setTimeout(onClose, 900)
  }

  const saveDesign = async () => {
    if (!user || !layout) return
    const name = designName.trim() || `Diseño ${designs.length + 1}`
    if (designs.length >= MAX_SAVED_DESIGNS) { setToast({ message: `Podés guardar hasta ${MAX_SAVED_DESIGNS} diseños. Borrá uno para guardar otro.`, type: 'info' }); return }
    const { data, error } = await supabase.from('profile_designs').insert({ user_id: user.id, name, data: layout }).select('id, name, data, created_at').single()
    if (error) { setToast({ message: 'No se pudo guardar el diseño: ' + error.message, type: 'error' }); return }
    setDesigns(prev => [data as SavedDesign, ...prev])
    setDesignName('')
    setToast({ message: `Diseño "${name}" guardado`, type: 'success' })
  }

  const applyDesign = (design: SavedDesign) => {
    const parsed = parseFreeLayout(design.data)
    if (!parsed) { setToast({ message: 'Ese diseño está dañado', type: 'error' }); return }
    setLayout(parsed)
    setSelectedId(null)
    setDirty(true)
    setToast({ message: `Cargaste "${design.name}". Tocá Publicar para usarlo en tu perfil.`, type: 'info' })
  }

  const applyTemplate = async (template: ProfileTemplate) => {
    if (!(await confirm({ title: `¿Usar la plantilla ${template.name}?`, message: 'Reemplaza el diseño que estás editando. No se publica hasta que toques "Publicar", y tus diseños guardados no se tocan.', confirmLabel: 'Usar plantilla' }))) return
    setLayout(template.build(!!profile?.audio_url))
    setSelectedId(null)
    setDirty(true)
    setToast({ message: `Plantilla ${template.name} aplicada. Editala a tu gusto y tocá Publicar.`, type: 'success' })
  }

  const deleteDesign = async (design: SavedDesign) => {
    const { error } = await supabase.from('profile_designs').delete().eq('id', design.id)
    if (error) { setToast({ message: 'No se pudo borrar: ' + error.message, type: 'error' }); return }
    setDesigns(prev => prev.filter(d => d.id !== design.id))
    setToast({ message: 'Diseño borrado', type: 'success' })
  }

  const handleClose = async () => {
    if (dirty && !(await confirm({ title: '¿Salir sin publicar?', message: 'Tenés cambios que todavía no publicaste. Si salís, se pierden.', confirmLabel: 'Salir igual', danger: true }))) return
    onClose()
  }

  const restartFromDefault = async () => {
    if (!(await confirm({ title: '¿Empezar de nuevo?', message: 'Se carga el diseño base y se pierden los cambios sin publicar. Tus diseños guardados no se tocan.', confirmLabel: 'Empezar de nuevo', danger: true }))) return
    setLayout(defaultFreeLayout(!!profile?.audio_url))
    setSelectedId(null)
    setDirty(true)
  }

  if (!layout) {
    return <div className="fixed inset-0 z-[100] bg-[#0b0b0b] flex items-center justify-center text-gray-300 gap-3"><FaSpinner className="animate-spin text-purple-500" /> Cargando editor...</div>
  }

  const minHeight = Math.max(MIN_CANVAS_HEIGHT, ...layout.elements.map(el => el.y + el.h))
  const label = 'block text-[11px] text-gray-400 mb-1'
  const input = 'w-full p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-purple-500'
  const smallBtn = 'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors'

  const colorField = (title: string, value: string, onChange: (v: string) => void, allowTransparent = false) => (
    <div>
      <span className={label}>{title}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value === 'transparent' ? '#000000' : value} onChange={e => onChange(e.target.value)} className="w-9 h-9 rounded cursor-pointer bg-transparent border-0" aria-label={title} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`${input} font-mono text-xs`} />
        {allowTransparent && (
          <button onClick={() => onChange('transparent')} className={`${smallBtn} flex-shrink-0 ${value === 'transparent' ? 'bg-purple-700 text-white' : 'bg-[#2a2a2a] text-gray-200'}`} title="Sin fondo">Sin</button>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b0b0b] flex flex-col text-gray-200">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Barra superior */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#2a2a2a] bg-[#141414] pt-[calc(env(safe-area-inset-top)+10px)]">
        <button onClick={handleClose} className="flex items-center gap-2 px-2 py-2 text-gray-300 hover:text-white text-sm"><FaArrowLeft /> <span className="hidden sm:inline">Volver</span></button>
        <h2 className="flex-1 text-white text-sm sm:text-lg truncate">Diseñar perfil</h2>
        <div className="hidden sm:flex items-center gap-1 mr-1">
          <button onClick={() => setZoom(z => Math.max(0.5, z / 1.25))} className="p-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a]" aria-label="Alejar"><FaSearchMinus size={12} /></button>
          <button onClick={() => setZoom(z => Math.min(1 / fitScale, z * 1.25))} className="p-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a]" aria-label="Acercar"><FaSearchPlus size={12} /></button>
          <button onClick={() => setZoom(1)} className="p-2 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a]" aria-label="Ajustar"><FaExpand size={12} /></button>
        </div>
        <button onClick={restartFromDefault} className={`${smallBtn} bg-[#2a2a2a] text-gray-200 hover:bg-[#333]`} title="Empezar de nuevo"><FaUndo size={11} /> <span className="hidden sm:inline">Empezar de nuevo</span></button>
        <button onClick={save} disabled={saving} className={`${smallBtn} bg-purple-700 hover:bg-purple-600 text-white disabled:opacity-50`}>{saving ? <FaSpinner className="animate-spin" /> : <FaSave size={12} />} Publicar</button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Lienzo */}
        <div ref={canvasWrapRef} className="flex-1 overflow-auto p-2 min-h-0" onPointerDown={() => setSelectedId(null)}>
          <div className="sm:hidden flex items-center justify-end gap-1 mb-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z / 1.25))} className="p-2 rounded-lg bg-[#141414] border border-[#2a2a2a]" aria-label="Alejar"><FaSearchMinus size={12} /></button>
            <button onClick={() => setZoom(z => Math.min(1 / fitScale, z * 1.25))} className="p-2 rounded-lg bg-[#141414] border border-[#2a2a2a]" aria-label="Acercar"><FaSearchPlus size={12} /></button>
            <button onClick={() => setZoom(1)} className="p-2 rounded-lg bg-[#141414] border border-[#2a2a2a]" aria-label="Ajustar"><FaExpand size={12} /></button>
          </div>
          <div style={{ width: CANVAS_WIDTH * scale, height: layout.height * scale, margin: '0 auto' }}>
            <div className="relative overflow-hidden shadow-2xl" style={{ width: CANVAS_WIDTH, height: layout.height, transform: `scale(${scale})`, transformOrigin: 'top left', ...backgroundCss(layout.background) }}>
              {layout.elements.map(el => {
                const isSelected = el.id === selectedId
                return (
                  <div
                    key={el.id}
                    style={{ ...elementBoxStyle(el), touchAction: 'none', cursor: 'move', outline: isSelected ? `${2 / scale}px dashed #c084fc` : undefined, outlineOffset: 2 / scale }}
                    onPointerDown={(e) => startDrag(e, el, 'move')}
                  >
                    <FreeElementView el={el} profile={profile} friendsCount={friendsCount} interactive={false} />
                    {isSelected && (
                      <div
                        onPointerDown={(e) => startDrag(e, el, 'resize')}
                        className="absolute bottom-0 right-0 bg-purple-500 border-2 border-white rounded-sm"
                        style={{ width: 22 / scale, height: 22 / scale, cursor: 'nwse-resize', touchAction: 'none' }}
                        aria-label="Cambiar tamaño"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <p className="text-center text-[11px] text-gray-500 mt-2">Tocá un elemento para editarlo · arrastralo para moverlo · usá la esquina violeta para cambiar el tamaño</p>
        </div>

        {/* Panel */}
        <div className="lg:w-80 h-[44vh] lg:h-auto border-t lg:border-t-0 lg:border-l border-[#2a2a2a] bg-[#141414] flex flex-col min-h-0">
          <div className="grid grid-cols-4 border-b border-[#2a2a2a] text-[11px] font-semibold flex-shrink-0">
            {([['add', 'Agregar'], ['element', 'Elemento'], ['background', 'Fondo'], ['designs', 'Diseños']] as [Tab, string][]).map(([id, text]) => (
              <button key={id} onClick={() => setTab(id)} className={`py-2.5 transition-colors ${tab === id ? 'text-white border-b-2 border-purple-500 bg-purple-900/20' : 'text-gray-400 hover:text-white'}`}>{text}</button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Agregar */}
            {tab === 'add' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {ELEMENT_CATALOG.map(item => (
                    <button key={item.type} onClick={() => addElement(item.type)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a] hover:border-purple-500 text-xs text-gray-200 text-left">
                      <item.icon className="text-purple-300 flex-shrink-0" size={14} /> {item.label}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-gray-400 space-y-0.5">
                  <p>{layout.elements.length}/{MAX_ELEMENTS} elementos</p>
                  <p className={imagesUsed >= MAX_IMAGES ? 'text-amber-300' : ''}>Imágenes: {imagesUsed} de {MAX_IMAGES} (incluye la imagen de fondo)</p>
                </div>
              </>
            )}

            {/* Elemento seleccionado */}
            {tab === 'element' && (!selected ? (
              <p className="text-sm text-gray-400 text-center py-6">Tocá un elemento del lienzo para editarlo.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white font-semibold flex items-center gap-2">{(() => { const info = ELEMENT_CATALOG.find(i => i.type === selected.type); return info ? <><info.icon className="text-purple-300" size={14} /> {info.label}</> : null })()}</p>
                  <button onClick={() => setSelectedId(null)} className="p-1.5 text-gray-400 hover:text-white" aria-label="Deseleccionar"><FaTimes size={12} /></button>
                </div>

                {/* Contenido */}
                {selected.type === 'text' && (
                  <div><span className={label}>Texto</span><textarea value={selected.content || ''} onChange={e => updateEl(selected.id, { content: e.target.value })} rows={4} maxLength={1000} className={`${input} resize-none`} /></div>
                )}
                {selected.type === 'sticker' && (
                  <div>
                    <span className={label}>Sticker</span>
                    <div className="grid grid-cols-7 gap-1">
                      {Object.entries(STICKERS).map(([key, sticker]) => (
                        <button key={key} onClick={() => updateEl(selected.id, { content: key })} title={sticker.label} aria-label={sticker.label} className={`p-2 rounded flex items-center justify-center ${selected.content === key ? 'bg-purple-700 text-white' : 'text-gray-200 hover:bg-white/10'}`}>
                          <sticker.icon size={18} />
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">El color del sticker es el "Color de letra".</p>
                  </div>
                )}
                {selected.type === 'image' && (
                  <div>
                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleElementImage} className="hidden" />
                    <button onClick={() => imageInputRef.current?.click()} disabled={uploading} className={`${smallBtn} w-full bg-purple-700 hover:bg-purple-600 text-white disabled:opacity-50`}>{uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />} {selected.content ? 'Cambiar imagen' : 'Subir imagen'}</button>
                  </div>
                )}
                {selected.type === 'social' && (
                  <div className="space-y-2">
                    <span className={label}>Redes sociales</span>
                    {(selected.links || []).map((link, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-2">
                        <span className="font-semibold">{link.platform}</span>
                        <span className="flex-1 truncate text-gray-400">{link.url}</span>
                        <button onClick={() => updateEl(selected.id, { links: (selected.links || []).filter((_, j) => j !== i) })} className="text-red-400" aria-label="Quitar"><FaTimes size={11} /></button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <select value={newLink.platform} onChange={e => setNewLink({ ...newLink, platform: e.target.value })} className={`${input} w-28 flex-shrink-0`}>
                        {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} placeholder="https://..." className={input} />
                    </div>
                    <button
                      onClick={() => {
                        const url = newLink.url.trim()
                        if (!/^https?:\/\//i.test(url)) { setToast({ message: 'El link tiene que empezar con https://', type: 'error' }); return }
                        updateEl(selected.id, { links: [...(selected.links || []), { platform: newLink.platform, url }] })
                        setNewLink({ ...newLink, url: '' })
                      }}
                      className={`${smallBtn} w-full bg-[#2a2a2a] text-white hover:bg-[#333]`}
                    ><FaPlus size={10} /> Agregar red</button>
                  </div>
                )}

                {/* Texto */}
                {TEXT_TYPES.includes(selected.type) && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className={label}>Letra</span>
                        <select value={selected.style.font} onChange={e => updateStyle(selected.id, { font: e.target.value as FontKey })} className={input}>
                          {(Object.keys(FONTS) as FontKey[]).map(f => <option key={f} value={f}>{FONTS[f].label}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className={label}>Alineación</span>
                        <div className="flex gap-1">
                          {([['left', FaAlignLeft], ['center', FaAlignCenter], ['right', FaAlignRight]] as const).map(([a, Icon]) => (
                            <button key={a} onClick={() => updateStyle(selected.id, { align: a })} className={`flex-1 p-2 rounded-lg ${selected.style.align === a ? 'bg-purple-700 text-white' : 'bg-[#0f0f0f] border border-[#2a2a2a]'}`} aria-label={`Alinear ${a}`}><Icon size={12} className="mx-auto" /></button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div><span className={label}>Tamaño de letra: {selected.style.fontSize}px</span><input type="range" min={10} max={96} value={selected.style.fontSize} onChange={e => updateStyle(selected.id, { fontSize: Number(e.target.value) })} className="w-full accent-purple-500" /></div>
                    {colorField('Color de letra', selected.style.color, v => updateStyle(selected.id, { color: v }))}
                  </>
                )}

                {selected.type === 'sticker' && colorField('Color de letra', selected.style.color, v => updateStyle(selected.id, { color: v }))}

                {/* Caja */}
                {colorField('Fondo', selected.style.bg, v => updateStyle(selected.id, { bg: v }), true)}
                {colorField('Color de borde', selected.style.borderColor, v => updateStyle(selected.id, { borderColor: v }))}
                <div className="grid grid-cols-2 gap-2">
                  <div><span className={label}>Borde: {selected.style.borderWidth}px</span><input type="range" min={0} max={12} value={selected.style.borderWidth} onChange={e => updateStyle(selected.id, { borderWidth: Number(e.target.value) })} className="w-full accent-purple-500" /></div>
                  <div><span className={label}>Redondeo</span><input type="range" min={0} max={300} value={Math.min(300, selected.style.radius)} onChange={e => updateStyle(selected.id, { radius: Number(e.target.value) })} className="w-full accent-purple-500" /></div>
                  <div><span className={label}>Transparencia</span><input type="range" min={0.1} max={1} step={0.05} value={selected.style.opacity} onChange={e => updateStyle(selected.id, { opacity: Number(e.target.value) })} className="w-full accent-purple-500" /></div>
                  <div><span className={label}>Rotación: {selected.rotation}°</span><input type="range" min={-180} max={180} value={selected.rotation} onChange={e => updateEl(selected.id, { rotation: Number(e.target.value) })} className="w-full accent-purple-500" /></div>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-200"><input type="checkbox" checked={selected.style.shadow} onChange={e => updateStyle(selected.id, { shadow: e.target.checked })} className="accent-purple-500 w-4 h-4" /> Sombra marcada</label>

                {/* Acciones */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button onClick={() => moveLayer('front')} className={`${smallBtn} bg-[#2a2a2a] text-gray-100 hover:bg-[#333]`}><FaArrowUp size={10} /> Al frente</button>
                  <button onClick={() => moveLayer('back')} className={`${smallBtn} bg-[#2a2a2a] text-gray-100 hover:bg-[#333]`}><FaArrowDown size={10} /> Atrás</button>
                  <button onClick={duplicateSelected} className={`${smallBtn} bg-[#2a2a2a] text-gray-100 hover:bg-[#333]`}><FaClone size={10} /> Duplicar</button>
                  <button onClick={removeSelected} className={`${smallBtn} bg-red-900/30 border border-red-800/50 text-red-300 hover:bg-red-900/50`}><FaTrash size={10} /> Borrar</button>
                </div>
              </>
            ))}

            {/* Fondo */}
            {tab === 'background' && (
              <>
                <div>
                  <span className={label}>Tipo de fondo</span>
                  <div className="grid grid-cols-3 gap-1">
                    {([['solid', 'Color'], ['gradient', 'Degradado'], ['image', 'Imagen']] as const).map(([t, text]) => (
                      <button key={t} onClick={() => change(prev => ({ ...prev, background: { ...prev.background, type: t } }))} className={`py-2 rounded-lg text-xs ${layout.background.type === t ? 'bg-purple-700 text-white' : 'bg-[#0f0f0f] border border-[#2a2a2a]'}`}>{text}</button>
                    ))}
                  </div>
                </div>
                {colorField(layout.background.type === 'gradient' ? 'Color de arriba' : 'Color', layout.background.color, v => change(prev => ({ ...prev, background: { ...prev.background, color: v } })))}
                {layout.background.type === 'gradient' && colorField('Color de abajo', layout.background.color2, v => change(prev => ({ ...prev, background: { ...prev.background, color2: v } })))}
                {layout.background.type === 'image' && (
                  <div>
                    <p className={`text-[11px] mb-2 ${imagesUsed >= MAX_IMAGES && !layout.background.image ? 'text-amber-300' : 'text-gray-400'}`}>La imagen de fondo cuenta dentro de las {MAX_IMAGES} imágenes del perfil ({imagesUsed}/{MAX_IMAGES} usadas).</p>
                    <input ref={bgInputRef} type="file" accept="image/*" onChange={handleBackgroundImage} className="hidden" />
                    <button onClick={() => bgInputRef.current?.click()} disabled={uploading} className={`${smallBtn} w-full bg-purple-700 hover:bg-purple-600 text-white disabled:opacity-50`}>{uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />} {layout.background.image ? 'Cambiar imagen de fondo' : 'Subir imagen de fondo'}</button>
                  </div>
                )}
                <div>
                  <span className={label}>Largo del perfil: {layout.height}px (máximo {MAX_CANVAS_HEIGHT})</span>
                  <input type="range" min={minHeight} max={MAX_CANVAS_HEIGHT} step={10} value={layout.height} onChange={e => change(prev => ({ ...prev, height: Number(e.target.value) }))} className="w-full accent-purple-500" />
                  <p className="text-[11px] text-gray-500 mt-1">No se puede achicar más que el elemento que está más abajo.</p>
                </div>
              </>
            )}

            {/* Mis diseños */}
            {tab === 'designs' && (
              <>
                <p className="text-xs font-semibold text-white">Plantillas</p>
                <div className="grid grid-cols-2 gap-2">
                  {PROFILE_TEMPLATES.map(template => (
                    <button key={template.key} onClick={() => applyTemplate(template)} className="text-left rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-purple-500 bg-[#0f0f0f]">
                      <div className="h-14" style={{ background: template.preview }} />
                      <div className="p-2">
                        <p className="text-xs text-white font-semibold">{template.name}</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{template.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold text-white pt-2 border-t border-[#2a2a2a]">Mis diseños guardados</p>
                <p className="text-xs text-gray-400">Guardá versiones de tu diseño para cambiar entre ellas cuando quieras. Son privadas: nadie más las ve ni las puede copiar.</p>
                <div className="flex gap-2">
                  <input value={designName} onChange={e => setDesignName(e.target.value)} maxLength={40} placeholder="Nombre (ej: Halloween)" className={input} />
                  <button onClick={saveDesign} disabled={designs.length >= MAX_SAVED_DESIGNS} className={`${smallBtn} bg-purple-700 hover:bg-purple-600 text-white flex-shrink-0 disabled:opacity-50`}><FaSave size={11} /> Guardar</button>
                </div>
                <p className="text-[11px] text-gray-500">{designs.length}/{MAX_SAVED_DESIGNS} diseños guardados</p>
                <div className="space-y-2">
                  {designs.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Todavía no guardaste diseños.</p>}
                  {designs.map(design => (
                    <div key={design.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0f0f0f] border border-[#2a2a2a]">
                      <div className="w-8 h-10 rounded border border-[#3a3a3a] flex-shrink-0" style={backgroundCss(parseFreeLayout(design.data)?.background || layout.background)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{design.name}</p>
                        <p className="text-[11px] text-gray-500">{new Date(design.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <button onClick={() => applyDesign(design)} className={`${smallBtn} bg-[#2a2a2a] text-white hover:bg-[#333]`}>Usar</button>
                      <button onClick={() => deleteDesign(design)} className="p-2 text-red-400 hover:text-red-300" aria-label={`Borrar ${design.name}`}><FaTrash size={11} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Aviso: se diseña en vista de computadora */}
      {showWarning && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 max-w-sm w-full">
            <FaDesktop className="text-purple-400 mb-3" size={28} />
            <h3 className="text-white text-lg mb-2">Diseño en vista de computadora</h3>
            <p className="text-sm text-gray-300 mb-4">Tu perfil se diseña como una página de computadora, igual que en MySpace, y así lo van a ver todos. En el celular se ve más chico: usá los botones de zoom para acercarte. Para diseñar más cómodo, te recomendamos una compu.</p>
            <button onClick={() => { setShowWarning(false); try { sessionStorage.setItem(WARNING_KEY, '1') } catch {} }} className="w-full py-2.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-semibold text-sm">Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}
