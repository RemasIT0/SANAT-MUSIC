// src/components/ProfileEditor.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import type { 
  ProfileLayout, ProfileModule, ModuleType, ModuleConfig
} from '../types/profileLayout'
import { 
  AVAILABLE_MODULES, DEFAULT_MODULE_CONFIG, DEFAULT_LAYOUT 
} from '../types/profileLayout'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HexColorPicker } from 'react-colorful'
import { 
  FaArrowLeft, FaPlus, FaTrash, FaGripVertical,
  FaUndo, FaCheck, FaDesktop, FaMobileAlt, FaImage,
  FaUser, FaGuitar, FaMapMarkerAlt, FaLink, FaChartBar,
  FaMusic, FaStar, FaHeart, FaBolt, FaMicrophone
} from 'react-icons/fa'
import Mascot from './Mascot'
import Toast from './Toast'

const BOX_ICONS = [
  { label: 'Ninguno', value: '' },
  { label: 'Música', value: 'FaMusic' },
  { label: 'Guitarra', value: 'FaGuitar' },
  { label: 'Micrófono', value: 'FaMicrophone' },
  { label: 'Estrella', value: 'FaStar' },
  { label: 'Corazón', value: 'FaHeart' },
  { label: 'Relámpago', value: 'FaBolt' },
  { label: 'Ubicación', value: 'FaMapMarkerAlt' },
  { label: 'Enlace', value: 'FaLink' },
]

const ICON_MAP: Record<string, any> = {
  FaMusic, FaGuitar, FaMicrophone, FaStar, FaHeart, FaBolt, FaMapMarkerAlt, FaLink
}

function ModulePreview({ 
  module, 
  profile,
  isEditor = false,
  onEdit, 
  onRemove 
}: { 
  module: ProfileModule
  profile: any
  isEditor?: boolean
  onEdit?: (id: string) => void
  onRemove?: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id })
  const dragStyle = { transform: CSS.Transform.toString(transform), transition }

  const modInfo = AVAILABLE_MODULES.find(m => m.type === module.type)
  const sizeClass = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-3',
    xlarge: 'col-span-1 md:col-span-2 lg:col-span-4',
  }[module.config.size] || 'col-span-1'

  const borderRadiusClass = {
    none: 'rounded-none', sm: 'rounded-sm', md: 'rounded-md',
    lg: 'rounded-lg', xl: 'rounded-xl', full: 'rounded-full',
  }[module.config.borderRadius] || 'rounded-xl'

  const borderStyle = module.config.showBorder 
    ? `${module.config.borderWidth || '2px'} ${module.config.borderStyle || 'solid'} ${module.config.borderColor}`
    : 'none'

  return (
   <div 
  ref={isEditor ? setNodeRef : null} 
  className={`${sizeClass} ${borderRadiusClass} relative group p-4 transition-all ${
    isEditor ? 'hover:ring-2 hover:ring-purple-500/50 cursor-pointer' : ''
  }`}
  onClick={() => isEditor && onEdit?.(module.id)}
  style={{
    ...(isEditor ? dragStyle : {}),
    backgroundColor: module.config.bgColor,
    color: module.config.textColor,
    border: borderStyle,
  }}
>
      {isEditor && (
        <>
          <div {...attributes} {...listeners} className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white p-1 rounded bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <FaGripVertical size={14} />
          </div>
          <button onClick={(e) => { e.stopPropagation(); onRemove?.(module.id) }} className="absolute top-2 right-2 text-red-400 hover:text-red-300 p-1 rounded bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <FaTrash size={12} />
          </button>
        </>
      )}

      <div className="pt-2">
        {/* ✅ TÍTULOS SOLO EN EDITOR */}
        {isEditor && (
          <div className="flex items-center gap-2 mb-3">
            {module.config.selectedIcon && ICON_MAP[module.config.selectedIcon] && (
              React.createElement(ICON_MAP[module.config.selectedIcon], { className: "text-lg flex-shrink-0 opacity-80" })
            )}
            {modInfo?.icon && React.createElement(modInfo.icon, { className: "text-lg flex-shrink-0" })}
            <span className="text-sm font-bold uppercase tracking-wider">{modInfo?.label}</span>
          </div>
        )}
        
        {module.type === 'photo' && profile && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className={`${module.config.shape === 'square' ? 'rounded-xl' : 'rounded-full'} w-24 h-24 bg-gray-700 flex items-center justify-center text-3xl overflow-hidden border-2 border-white/20 flex-shrink-0`}>
              {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <FaUser className="opacity-50" />}
            </div>
            {/* ✅ MASCOTA AL LADO DE LA FOTO */}
            {module.config.showMascotAlongside && (
              <Mascot color={profile.avatar_color || '#a855f7'} size={50} expression={profile.expression || 'normal'} />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xl truncate">{profile.display_name}</p>
              <p className="text-sm opacity-70 truncate">@{profile.username}</p>
            </div>
          </div>
        )}

        {module.type === 'mascot' && profile && (
          <div className="flex justify-center py-4">
            <Mascot color={profile.avatar_color || '#a855f7'} size={50} expression={profile.expression || 'normal'} />
          </div>
        )}
        
        {module.type === 'bio' && profile && <p className="text-base opacity-90 leading-relaxed break-words">{profile.bio || 'Sin biografía'}</p>}
        
        {module.type === 'instruments' && profile && (
          <div className="flex flex-wrap gap-2">
            {profile.instruments?.map((inst: any, i: number) => (
              <span key={i} className="text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/10 flex items-center gap-2 max-w-full">
                <FaGuitar className="flex-shrink-0" /> 
                <span className="truncate">{inst.name}</span> 
                <span className="opacity-60 truncate">({inst.level})</span>
              </span>
            )) || <span className="text-sm opacity-60">Sin instrumentos</span>}
          </div>
        )}
        
        {module.type === 'genres' && profile && (
          <div className="flex flex-wrap gap-2">
            {profile.genres?.map((g: string, i: number) => (
              <span key={i} className="text-sm px-3 py-1.5 rounded-full bg-white/10 border border-white/10 truncate">#{g}</span>
            )) || <span className="text-sm opacity-60">Sin géneros</span>}
          </div>
        )}
        
        {module.type === 'location' && profile && (
          <p className="text-base flex items-center gap-2 flex-wrap">
            <FaMapMarkerAlt className="flex-shrink-0" /> 
            <span className="truncate">{profile.localidad || 'Sin ubicación'}, {profile.departamento || 'Tucumán'}</span>
          </p>
        )}

        {module.type === 'gallery' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-square bg-white/5 rounded-lg flex flex-col items-center justify-center border border-dashed border-white/20">
              <FaImage className="text-3xl opacity-50 mb-2" />
              <span className="text-sm opacity-70">Agregar imagen</span>
            </div>
            <div className="aspect-square bg-white/5 rounded-lg flex flex-col items-center justify-center border border-dashed border-white/20">
              <FaImage className="text-3xl opacity-50 mb-2" />
              <span className="text-sm opacity-70">Agregar imagen</span>
            </div>
          </div>
        )}
        
        {module.type === 'custom' && <p className="text-base whitespace-pre-wrap opacity-90 break-words">{module.config.content || 'Caja personalizada vacía.'}</p>}
        {module.type === 'social-links' && <p className="text-sm opacity-60 flex items-center gap-2"><FaLink /> Agrega tus redes sociales</p>}
        {module.type === 'stats' && <p className="text-sm opacity-60 flex items-center gap-2"><FaChartBar /> Tus estadísticas aparecerán aquí</p>}
      </div>
    </div>
  )
}

export default function ProfileEditor({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [layout, setLayout] = useState<ProfileLayout>(DEFAULT_LAYOUT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    const loadLayout = async () => {
      if (!user) return
      const { data } = await supabase.from('profile_layouts').select('*').eq('user_id', user.id).single()
      if (data) {
        setLayout({
          layout: data.layout_config?.layout || 'one-column',
          modules: data.layout_config?.modules || DEFAULT_LAYOUT.modules,
          backgroundType: data.background_type || 'solid',
          backgroundValue: data.background_value || '#0f0f0f',
        })
      }
      setLoading(false)
    }
    loadLayout()
  }, [user])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setLayout(prev => {
        const oldIndex = prev.modules.findIndex(m => m.id === active.id)
        const newIndex = prev.modules.findIndex(m => m.id === over.id)
        const newModules = arrayMove(prev.modules, oldIndex, newIndex).map((m, i) => ({ ...m, order: i }))
        return { ...prev, modules: newModules }
      })
    }
  }

  const addModule = (type: ModuleType) => {
    if (type === 'photo' && layout.modules.some(m => m.type === 'photo')) {
      setToast({ message: 'Solo puedes tener un módulo de Foto de Perfil', type: 'error' })
      return
    }
    const newModule: ProfileModule = {
      id: `mod-${Date.now()}`,
      type,
      order: layout.modules.length,
      config: { ...DEFAULT_MODULE_CONFIG },
    }
    setLayout(prev => ({ ...prev, modules: [...prev.modules, newModule] }))
  }

  const removeModule = (id: string) => {
    setLayout(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== id).map((m, i) => ({ ...m, order: i }))
    }))
    setEditingModule(null)
  }

  const updateModuleConfig = (id: string, config: Partial<ModuleConfig>) => {
    setLayout(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === id ? { ...m, config: { ...m.config, ...config } } : m)
    }))
  }

  const openPreview = () => setShowPreview(true)

  const confirmSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase.from('profile_layouts').upsert({
        user_id: user.id,
        layout_config: { layout: layout.layout, modules: layout.modules },
        background_type: layout.backgroundType,
        background_value: layout.backgroundValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      
      if (error) throw error
      setToast({ message: '¡Diseño guardado exitosamente!', type: 'success' })
      setShowPreview(false)
      setTimeout(onClose, 1000)
    } catch (error: any) {
      setToast({ message: 'Error al guardar: ' + error.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('¿Restablecer al diseño por defecto? Perderás tus cambios.')) {
      setLayout(DEFAULT_LAYOUT)
      setEditingModule(null)
    }
  }

  const currentModule = layout.modules.find(m => m.id === editingModule)

  if (loading) return <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center text-white">Cargando editor...</div>

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="fixed inset-0 bg-black/95 z-[100] overflow-y-auto">
        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-3 flex items-center justify-between z-[110]">
          <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white">
            <FaArrowLeft /> Volver
          </button>
          <h2 className="text-white font-bold text-lg hidden sm:block">Diseñar mi perfil</h2>
          <h2 className="text-white font-bold text-sm sm:hidden">Diseñar perfil</h2>
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-3 py-2 bg-[#2a2a2a] text-gray-300 rounded-lg hover:bg-[#333] text-sm flex items-center gap-1">
              <FaUndo size={12} /> <span className="hidden sm:inline">Restablecer</span>
            </button>
            <button onClick={openPreview} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 text-sm flex items-center gap-2">
              <FaCheck size={12} /> Vista Previa
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 pb-20">
          {/* Panel izquierdo */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <h3 className="text-white font-bold mb-3 text-sm">Agregar módulo</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {AVAILABLE_MODULES.map(mod => (
                  <button key={mod.type} onClick={() => addModule(mod.type)} className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-gray-300 hover:border-purple-500 hover:text-white transition-all flex items-center gap-2">
                    {mod.icon && React.createElement(mod.icon, { className: "text-sm" })}
                    <span>{mod.label}</span>
                    <FaPlus size={10} className="ml-auto" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <h3 className="text-white font-bold mb-3 text-sm">Distribución</h3>
              <div className="space-y-2">
                {(['one-column', 'two-columns', 'grid'] as const).map(l => (
                  <button key={l} onClick={() => setLayout(prev => ({ ...prev, layout: l }))} className={`w-full px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${layout.layout === l ? 'bg-purple-600 text-white' : 'bg-[#0f0f0f] border border-[#2a2a2a] text-gray-300 hover:border-purple-500'}`}>
                    {l === 'one-column' ? <FaMobileAlt /> : <FaDesktop />}
                    {l === 'one-column' ? 'Una columna' : l === 'two-columns' ? 'Dos columnas' : 'Cuadrícula'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
              <h3 className="text-white font-bold mb-3 text-sm">Fondo del perfil</h3>
              <select value={layout.backgroundType} onChange={(e) => setLayout(prev => ({ ...prev, backgroundType: e.target.value as any }))} className="w-full p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white mb-2">
                <option value="solid">Color sólido</option>
                <option value="gradient">Degradado</option>
              </select>
              {/* @ts-ignore */}
              <HexColorPicker color={layout.backgroundValue || '#0f0f0f'} onChange={(color) => setLayout(prev => ({ ...prev, backgroundValue: color }))} />
            </div>
          </div>

          {/* Panel central */}
          <div className="lg:col-span-2">
            <div className="rounded-xl p-6 min-h-[600px] transition-colors duration-300" style={{ backgroundColor: layout.backgroundValue || '#0f0f0f' }}>
              <p className="text-gray-500 text-xs mb-4 text-center">Vista previa en tiempo real. Arrastra para reordenar.</p>
              
              {/* @ts-ignore */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {/* @ts-ignore */}
                <SortableContext items={layout.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                  <div className={`grid gap-3 ${
                    layout.layout === 'one-column' ? 'grid-cols-1' :
                    layout.layout === 'two-columns' ? 'grid-cols-1 md:grid-cols-2' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                  }`}>
                    {layout.modules.map(module => (
                      <ModulePreview key={module.id} module={module} profile={profile} isEditor={true} onEdit={setEditingModule} onRemove={removeModule} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          {/* Panel derecho: Configuración */}
          <div className="lg:col-span-1">
            {currentModule ? (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-4 sticky top-20 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm">Editar módulo</h3>
                  <button onClick={() => setEditingModule(null)} className="text-gray-500 hover:text-white">✕</button>
                </div>

                {/* Tamaño */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Tamaño</label>
                  <select value={currentModule.config.size} onChange={(e) => updateModuleConfig(currentModule.id, { size: e.target.value as any })} className="w-full p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white">
                    <option value="small">Pequeño</option>
                    <option value="medium">Mediano</option>
                    <option value="large">Grande</option>
                    <option value="xlarge">Extra Grande</option>
                  </select>
                </div>

                {/* Forma (Solo para foto) */}
                {currentModule.type === 'photo' && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Forma de la foto</label>
                    <div className="flex gap-2">
                      <button onClick={() => updateModuleConfig(currentModule.id, { shape: 'rounded' })} className={`flex-1 py-2 rounded-lg text-sm border ${currentModule.config.shape === 'rounded' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-300'}`}>Redonda</button>
                      <button onClick={() => updateModuleConfig(currentModule.id, { shape: 'square' })} className={`flex-1 py-2 rounded-lg text-sm border ${currentModule.config.shape === 'square' ? 'bg-purple-600 border-purple-600 text-white' : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-300'}`}>Cuadrada</button>
                    </div>
                  </div>
                )}

                {/* ✅ NUEVO: Mascota al lado de la foto */}
                {currentModule.type === 'photo' && (
                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      checked={currentModule.config.showMascotAlongside || false} 
                      onChange={(e) => updateModuleConfig(currentModule.id, { showMascotAlongside: e.target.checked })} 
                      className="w-4 h-4 accent-purple-600" 
                    />
                    <label className="text-sm text-gray-300">Mostrar mascota al lado de la foto</label>
                  </div>
                )}

                {/* Icono de acompañamiento */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Icono de la caja</label>
                  <select value={currentModule.config.selectedIcon || ''} onChange={(e) => updateModuleConfig(currentModule.id, { selectedIcon: e.target.value })} className="w-full p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white">
                    {BOX_ICONS.map(icon => (
                      <option key={icon.value} value={icon.value}>{icon.label}</option>
                    ))}
                  </select>
                </div>

                {/* Bordes */}
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" checked={currentModule.config.showBorder} onChange={(e) => updateModuleConfig(currentModule.id, { showBorder: e.target.checked })} className="w-4 h-4 accent-purple-600" />
                  <label className="text-sm text-gray-300">Mostrar borde</label>
                </div>

                {currentModule.config.showBorder && (
                  <>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Grosor del borde</label>
                      <select value={currentModule.config.borderWidth} onChange={(e) => updateModuleConfig(currentModule.id, { borderWidth: e.target.value as any })} className="w-full p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white">
                        <option value="1px">1px (Fino)</option>
                        <option value="2px">2px (Normal)</option>
                        <option value="3px">3px (Grueso)</option>
                        <option value="4px">4px (Muy grueso)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Estilo del borde</label>
                      <select value={currentModule.config.borderStyle} onChange={(e) => updateModuleConfig(currentModule.id, { borderStyle: e.target.value as any })} className="w-full p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white">
                        <option value="solid">Sólido</option>
                        <option value="dashed">Discontinuo (---)</option>
                        <option value="dotted">Punteado (...)</option>
                        <option value="double">Doble (=)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Color del borde</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={currentModule.config.borderColor} onChange={(e) => updateModuleConfig(currentModule.id, { borderColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                        <input type="text" value={currentModule.config.borderColor} onChange={(e) => updateModuleConfig(currentModule.id, { borderColor: e.target.value })} className="flex-1 p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-xs text-white font-mono" />
                      </div>
                    </div>
                  </>
                )}

                {/* Colores base */}
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Color de fondo</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={currentModule.config.bgColor} onChange={(e) => updateModuleConfig(currentModule.id, { bgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <input type="text" value={currentModule.config.bgColor} onChange={(e) => updateModuleConfig(currentModule.id, { bgColor: e.target.value })} className="flex-1 p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-xs text-white font-mono" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Color de texto</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={currentModule.config.textColor} onChange={(e) => updateModuleConfig(currentModule.id, { textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <input type="text" value={currentModule.config.textColor} onChange={(e) => updateModuleConfig(currentModule.id, { textColor: e.target.value })} className="flex-1 p-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-xs text-white font-mono" />
                  </div>
                </div>

                {/* Contenido de texto */}
                {(currentModule.type === 'custom' || currentModule.type === 'bio') && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Contenido de texto</label>
                    <textarea 
                      value={currentModule.config.content || ''} 
                      onChange={(e) => updateModuleConfig(currentModule.id, { content: e.target.value })} 
                      className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white h-32 resize-none focus:border-purple-500 focus:outline-none" 
                      placeholder="Escribe aquí el contenido..." 
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center text-gray-500 text-sm sticky top-20">
                <p>Haz clic en un módulo del panel central para editar sus colores, bordes y contenido.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Vista Previa */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/90 z-[120] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><FaCheck className="text-purple-400" /> Vista Previa del Perfil</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-semibold mb-2"><FaDesktop /> Vista Escritorio</div>
                  <div className="bg-white rounded-lg overflow-hidden shadow-2xl border-4 border-gray-700">
                    <div className="h-6 bg-gray-700 flex items-center px-2 gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <div className="p-4" style={{ backgroundColor: layout.backgroundValue || '#0f0f0f', minHeight: '400px' }}>
                      <div className={`grid gap-3 ${layout.layout === 'one-column' ? 'grid-cols-1' : layout.layout === 'two-columns' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                        {layout.modules.map(module => <ModulePreview key={module.id} module={module} profile={profile} isEditor={false} />)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 flex flex-col items-center">
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-semibold mb-2"><FaMobileAlt /> Vista Celular</div>
                  <div className="bg-black rounded-[2.5rem] p-2 shadow-2xl border-4 border-gray-600 w-[320px]">
                    <div className="bg-gray-800 rounded-[2rem] overflow-hidden relative">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl z-10"></div>
                      <div className="pt-8 pb-4 px-3" style={{ backgroundColor: layout.backgroundValue || '#0f0f0f', minHeight: '500px' }}>
                        <div className="grid grid-cols-1 gap-3">
                          {layout.modules.map(module => <ModulePreview key={module.id} module={module} profile={profile} isEditor={false} />)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a] flex justify-end gap-3">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 text-gray-300 hover:text-white font-medium">Cancelar</button>
              <button onClick={confirmSave} disabled={saving} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center gap-2 disabled:opacity-50">
                {saving ? <FaUndo className="animate-spin" /> : <FaCheck />}
                {saving ? 'Guardando...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}