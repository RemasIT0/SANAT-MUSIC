// src/types/freeLayout.ts
// Perfil de diseño libre (estilo MySpace): un lienzo de tamaño fijo de
// computadora donde cada elemento tiene posición, tamaño, rotación y estilo.
// Se guarda en profile_layouts.layout_config como { layout: 'free', free: FreeLayout }.
import type { CSSProperties } from 'react'
import type { IconType } from 'react-icons'
import {
  FaTag, FaUserCircle, FaGhost, FaAlignLeft, FaGuitar, FaMusic, FaMapMarkerAlt, FaUserFriends, FaMicrophoneAlt,
  FaLink, FaFont, FaImage, FaStar, FaShapes, FaDrum, FaHeadphones, FaFire, FaHeart, FaSkull, FaBolt, FaMoon,
  FaCrown, FaRocket, FaCompactDisc, FaRecordVinyl, FaHandRock, FaPizzaSlice, FaCat, FaSun, FaGem, FaRegSmile,
} from 'react-icons/fa'
import { GiPianoKeys, GiBat, GiPumpkinLantern, GiSaxophone, GiViolin, GiTrumpet } from 'react-icons/gi'
import type { SocialLink } from './profileLayout'

export const CANVAS_WIDTH = 1000
export const MIN_CANVAS_HEIGHT = 600
export const MAX_CANVAS_HEIGHT = 1600
export const MAX_ELEMENTS = 40
// Imágenes por perfil, contando la imagen de fondo
export const MAX_IMAGES = 4
export const MAX_SAVED_DESIGNS = 5

export type FreeElementType =
  | 'name' | 'photo' | 'mascot' | 'bio' | 'instruments' | 'genres' | 'location'
  | 'friends' | 'audio' | 'social' | 'text' | 'image' | 'sticker' | 'box'

export type FontKey = 'sans' | 'serif' | 'mono' | 'nirvana' | 'cursive' | 'impact'

export const FONTS: Record<FontKey, { label: string; css: string }> = {
  sans: { label: 'Normal', css: 'Inter, Arial, sans-serif' },
  serif: { label: 'Clásica', css: 'Georgia, "Times New Roman", serif' },
  mono: { label: 'Máquina', css: '"Courier New", monospace' },
  nirvana: { label: 'Nirvana', css: 'Nirvana, sans-serif' },
  cursive: { label: 'Divertida', css: '"Comic Sans MS", "Comic Neue", cursive' },
  impact: { label: 'Impacto', css: 'Impact, "Arial Black", sans-serif' },
}

export interface FreeElementStyle {
  bg: string
  color: string
  borderColor: string
  borderWidth: number
  radius: number
  opacity: number
  fontSize: number
  font: FontKey
  align: 'left' | 'center' | 'right'
  shadow: boolean
}

export interface FreeElement {
  id: string
  type: FreeElementType
  x: number
  y: number
  w: number
  h: number
  rotation: number
  z: number
  style: FreeElementStyle
  content?: string        // texto, emoji del sticker o URL de imagen
  links?: SocialLink[]    // redes sociales
}

export interface FreeBackground {
  type: 'solid' | 'gradient' | 'image'
  color: string
  color2: string
  image: string
}

export interface FreeLayout {
  height: number
  background: FreeBackground
  elements: FreeElement[]
}

export const ELEMENT_CATALOG: { type: FreeElementType; label: string; icon: IconType; w: number; h: number }[] = [
  { type: 'name', label: 'Mi nombre', icon: FaTag, w: 420, h: 110 },
  { type: 'photo', label: 'Foto de perfil', icon: FaUserCircle, w: 220, h: 220 },
  { type: 'mascot', label: 'Mascota', icon: FaGhost, w: 180, h: 200 },
  { type: 'bio', label: 'Biografía', icon: FaAlignLeft, w: 420, h: 180 },
  { type: 'instruments', label: 'Instrumentos', icon: FaGuitar, w: 360, h: 130 },
  { type: 'genres', label: 'Géneros', icon: FaMusic, w: 360, h: 120 },
  { type: 'location', label: 'Ubicación', icon: FaMapMarkerAlt, w: 320, h: 70 },
  { type: 'friends', label: 'Amigos', icon: FaUserFriends, w: 220, h: 70 },
  { type: 'audio', label: 'Mi audio', icon: FaMicrophoneAlt, w: 420, h: 100 },
  { type: 'social', label: 'Redes sociales', icon: FaLink, w: 360, h: 110 },
  { type: 'text', label: 'Texto libre', icon: FaFont, w: 320, h: 140 },
  { type: 'image', label: 'Imagen', icon: FaImage, w: 300, h: 220 },
  { type: 'sticker', label: 'Sticker', icon: FaStar, w: 110, h: 110 },
  { type: 'box', label: 'Caja / forma', icon: FaShapes, w: 260, h: 180 },
]

// Stickers: íconos que toman el "color de letra" del elemento
export const STICKERS: Record<string, { label: string; icon: IconType }> = {
  estrella: { label: 'Estrella', icon: FaStar },
  guitarra: { label: 'Guitarra', icon: FaGuitar },
  microfono: { label: 'Micrófono', icon: FaMicrophoneAlt },
  bateria: { label: 'Batería', icon: FaDrum },
  piano: { label: 'Piano', icon: GiPianoKeys },
  saxo: { label: 'Saxo', icon: GiSaxophone },
  violin: { label: 'Violín', icon: GiViolin },
  trompeta: { label: 'Trompeta', icon: GiTrumpet },
  auriculares: { label: 'Auriculares', icon: FaHeadphones },
  nota: { label: 'Nota', icon: FaMusic },
  disco: { label: 'Disco', icon: FaCompactDisc },
  vinilo: { label: 'Vinilo', icon: FaRecordVinyl },
  rock: { label: 'Cuernos', icon: FaHandRock },
  fuego: { label: 'Fuego', icon: FaFire },
  corazon: { label: 'Corazón', icon: FaHeart },
  calavera: { label: 'Calavera', icon: FaSkull },
  rayo: { label: 'Rayo', icon: FaBolt },
  luna: { label: 'Luna', icon: FaMoon },
  sol: { label: 'Sol', icon: FaSun },
  corona: { label: 'Corona', icon: FaCrown },
  cohete: { label: 'Cohete', icon: FaRocket },
  gema: { label: 'Gema', icon: FaGem },
  fantasma: { label: 'Fantasma', icon: FaGhost },
  murcielago: { label: 'Murciélago', icon: GiBat },
  calabaza: { label: 'Calabaza', icon: GiPumpkinLantern },
  gato: { label: 'Gato', icon: FaCat },
  pizza: { label: 'Pizza', icon: FaPizzaSlice },
  sonrisa: { label: 'Sonrisa', icon: FaRegSmile },
}

export const defaultStyle = (type: FreeElementType): FreeElementStyle => {
  const transparent = type === 'sticker' || type === 'mascot'
  return {
    bg: transparent ? 'transparent' : type === 'box' ? '#a855f7' : '#1a1a1a',
    color: type === 'sticker' ? '#fde047' : '#ffffff',
    borderColor: '#a855f7',
    borderWidth: transparent || type === 'box' ? 0 : 2,
    radius: type === 'photo' ? 999 : 14,
    opacity: 1,
    fontSize: type === 'name' ? 40 : type === 'text' ? 22 : 18,
    font: type === 'name' ? 'nirvana' : 'sans',
    align: type === 'name' ? 'center' : 'left',
    shadow: false,
  }
}

const newId = () => `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function makeElement(type: FreeElementType, elements: FreeElement[], canvasHeight: number): FreeElement {
  const info = ELEMENT_CATALOG.find(e => e.type === type)!
  const z = elements.reduce((max, e) => Math.max(max, e.z), 0) + 1
  // Aparece cerca del centro, un poco corrido para no tapar exactamente al anterior
  const offset = (elements.length % 6) * 24
  return {
    id: newId(),
    type,
    x: Math.round((CANVAS_WIDTH - info.w) / 2) + offset - 60,
    y: Math.min(canvasHeight - info.h, 120 + offset),
    w: info.w,
    h: info.h,
    rotation: 0,
    z,
    style: defaultStyle(type),
    content: type === 'text' ? '¡Escribí lo que quieras acá!' : type === 'sticker' ? 'estrella' : '',
    links: type === 'social' ? [] : undefined,
  }
}

export function cloneElement(el: FreeElement, elements: FreeElement[]): FreeElement {
  const z = elements.reduce((max, e) => Math.max(max, e.z), 0) + 1
  return { ...el, id: newId(), x: el.x + 24, y: el.y + 24, z, style: { ...el.style }, links: el.links ? [...el.links] : undefined }
}

// Diseño inicial a partir de los datos del perfil
export function defaultFreeLayout(hasAudio: boolean): FreeLayout {
  const base = (type: FreeElementType, x: number, y: number, w: number, h: number, z: number, style: Partial<FreeElementStyle> = {}): FreeElement => ({
    id: newId(), type, x, y, w, h, rotation: 0, z, style: { ...defaultStyle(type), ...style }, content: '', links: type === 'social' ? [] : undefined,
  })
  const elements: FreeElement[] = [
    base('photo', 60, 60, 240, 240, 1),
    base('name', 340, 80, 600, 120, 2, { bg: 'transparent', borderWidth: 0, fontSize: 52, align: 'left' }),
    base('location', 340, 210, 360, 64, 3),
    base('mascot', 780, 210, 170, 190, 4),
    base('bio', 60, 340, 540, 220, 5),
    base('instruments', 640, 420, 300, 140, 6),
    base('genres', 60, 600, 540, 120, 7),
    base('friends', 640, 600, 300, 70, 8),
  ]
  if (hasAudio) elements.push(base('audio', 60, 760, 540, 100, 9))
  return {
    height: 1000,
    background: { type: 'gradient', color: '#2e1065', color2: '#0f0f0f', image: '' },
    elements,
  }
}

export const backgroundCss = (bg: FreeBackground): CSSProperties => {
  if (bg.type === 'image' && bg.image) {
    return { backgroundColor: bg.color, backgroundImage: `url("${bg.image}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  if (bg.type === 'gradient') return { background: `linear-gradient(160deg, ${bg.color}, ${bg.color2})` }
  return { backgroundColor: bg.color }
}

// Valida lo que viene de la base (por si está incompleto o viejo)
export function parseFreeLayout(raw: any): FreeLayout | null {
  if (!raw || !Array.isArray(raw.elements)) return null
  return {
    height: Math.min(MAX_CANVAS_HEIGHT, Math.max(MIN_CANVAS_HEIGHT, Number(raw.height) || 1000)),
    background: { type: 'solid', color: '#0f0f0f', color2: '#0f0f0f', image: '', ...(raw.background || {}) },
    elements: raw.elements.map((el: any) => ({ ...el, style: { ...defaultStyle(el.type), ...(el.style || {}) } })),
  }
}
