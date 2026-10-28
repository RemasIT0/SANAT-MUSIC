// src/types/profileLayout.ts
import { 
  FaImage, FaAlignLeft, FaGuitar, FaMusic, 
  FaMapMarkerAlt, FaLink, FaChartBar, FaEdit, 
  FaImages, FaUserAstronaut, FaInstagram, FaYoutube, 
  FaSpotify, FaTiktok, FaTwitter 
} from 'react-icons/fa'

export type ModuleType = 
  | 'photo' | 'mascot' | 'bio' | 'instruments' | 'genres' 
  | 'location' | 'gallery' | 'social-links' | 'stats' | 'custom'

export type LayoutStyle = 'one-column' | 'two-columns' | 'grid'
export type BgType = 'solid' | 'gradient' | 'image' | 'pattern'
export type ModuleSize = 'small' | 'medium' | 'large' | 'xlarge'

export interface SocialLink {
  platform: string
  url: string
}

export interface ModuleConfig {
  bgColor: string
  textColor: string
  borderColor: string
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  size: ModuleSize
  showBorder: boolean
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double'
  borderWidth: '1px' | '2px' | '3px' | '4px'
  shape?: 'rounded' | 'square'
  showMascotAlongside?: boolean
  content?: string
  images?: string[]          // ✅ NUEVO: URLs de la galería
  socialLinks?: SocialLink[] // ✅ NUEVO: Links de redes sociales
  selectedIcon?: string
}

export interface ProfileModule {
  id: string
  type: ModuleType
  order: number
  config: ModuleConfig
}

export interface ProfileLayout {
  layout: LayoutStyle
  modules: ProfileModule[]
  backgroundType: BgType
  backgroundValue: string
}

export const AVAILABLE_MODULES: { type: ModuleType; label: string; icon: any }[] = [
  { type: 'photo', label: 'Foto de perfil', icon: FaImage },
  { type: 'mascot', label: 'Mascota', icon: FaUserAstronaut },
  { type: 'bio', label: 'Biografía', icon: FaAlignLeft },
  { type: 'instruments', label: 'Instrumentos', icon: FaGuitar },
  { type: 'genres', label: 'Géneros', icon: FaMusic },
  { type: 'location', label: 'Ubicación', icon: FaMapMarkerAlt },
  { type: 'gallery', label: 'Galería de imágenes', icon: FaImages },
  { type: 'social-links', label: 'Redes sociales', icon: FaLink },
  { type: 'stats', label: 'Estadísticas', icon: FaChartBar },
  { type: 'custom', label: 'Caja personalizada', icon: FaEdit },
]

export const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  bgColor: '#1a1a1a',
  textColor: '#ffffff',
  borderColor: '#a855f7',
  borderRadius: 'xl',
  size: 'medium',
  showBorder: true,
  borderStyle: 'solid',
  borderWidth: '2px',
  shape: 'rounded',
  showMascotAlongside: false,
  content: '',
  images: [],
  socialLinks: [],
  selectedIcon: '',
}

export const DEFAULT_LAYOUT: ProfileLayout = {
  layout: 'one-column',
  modules: [
    { id: 'mod-photo', type: 'photo', order: 0, config: { ...DEFAULT_MODULE_CONFIG, size: 'large', shape: 'rounded', showMascotAlongside: true } },
    { id: 'mod-bio', type: 'bio', order: 1, config: { ...DEFAULT_MODULE_CONFIG } },
    { id: 'mod-instruments', type: 'instruments', order: 2, config: { ...DEFAULT_MODULE_CONFIG, size: 'small' } },
  ],
  backgroundType: 'solid',
  backgroundValue: '#0f0f0f',
}