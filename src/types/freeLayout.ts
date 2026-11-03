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
  FaLightbulb, FaStream, FaChartBar, FaSpider, FaFeatherAlt, FaLeaf, FaSnowflake, FaCloud, FaSkullCrossbones,
  FaDragon, FaCrow, FaEye, FaGamepad, FaCamera, FaPeace, FaYinYang, FaInfinity, FaAnchor, FaMagic, FaPaw,
  FaRadiation, FaBiohazard, FaHatWizard, FaMask, FaTheaterMasks, FaBomb, FaDiceD20, FaGuitar as FaGuitarAlt,
} from 'react-icons/fa'
import { GiPianoKeys, GiBat, GiPumpkinLantern, GiSaxophone, GiViolin, GiTrumpet } from 'react-icons/gi'
import type { SocialLink } from './profileLayout'
// Más stickers (con prefijo S_ para no mezclarlos con los íconos de arriba)
import {
  FaRobot as S_FaRobot, FaUserAstronaut as S_FaUserAstronaut, FaSatellite as S_FaSatellite, FaMeteor as S_FaMeteor, FaGlobeAmericas as S_FaGlobeAmericas, FaBug as S_FaBug, FaFish as S_FaFish, FaFrog as S_FaFrog, FaDove as S_FaDove, FaHorse as S_FaHorse, FaCandyCane as S_FaCandyCane, FaIceCream as S_FaIceCream, FaCookie as S_FaCookie, FaHamburger as S_FaHamburger, FaCocktail as S_FaCocktail, FaTrophy as S_FaTrophy, FaMedal as S_FaMedal, FaChessKnight as S_FaChessKnight, FaChessQueen as S_FaChessQueen, FaKey as S_FaKey, FaBell as S_FaBell, FaGift as S_FaGift, FaBirthdayCake as S_FaBirthdayCake, FaUmbrella as S_FaUmbrella, FaRainbow as S_FaRainbow, FaMountain as S_FaMountain, FaTree as S_FaTree, FaSeedling as S_FaSeedling, FaMotorcycle as S_FaMotorcycle, FaSpaceShuttle as S_FaSpaceShuttle, FaRing as S_FaRing, FaHatCowboy as S_FaHatCowboy, FaVolumeUp as S_FaVolumeUp, FaBroadcastTower as S_FaBroadcastTower, FaHandPeace as S_FaHandPeace, FaHandSpock as S_FaHandSpock, FaThumbsUp as S_FaThumbsUp, FaGrinStars as S_FaGrinStars, FaGrinTongue as S_FaGrinTongue, FaDizzy as S_FaDizzy, FaSadCry as S_FaSadCry, FaAngry as S_FaAngry, FaLaughSquint as S_FaLaughSquint, FaKissWinkHeart as S_FaKissWinkHeart, FaHeartbeat as S_FaHeartbeat, FaFireAlt as S_FaFireAlt, FaBurn as S_FaBurn, FaSkating as S_FaSkating, FaPlane as S_FaPlane, FaCompass as S_FaCompass, FaHourglassHalf as S_FaHourglassHalf, FaFlask as S_FaFlask, FaAtom as S_FaAtom, FaFeather as S_FaFeather, FaPalette as S_FaPalette, FaPaintBrush as S_FaPaintBrush,
} from 'react-icons/fa'
import {
  GiTombstone as S_GiTombstone, GiSpiderWeb as S_GiSpiderWeb, GiCrystalBall as S_GiCrystalBall, GiCoffin as S_GiCoffin, GiDrumKit as S_GiDrumKit, GiMusicalNotes as S_GiMusicalNotes, GiGuitarHead as S_GiGuitarHead, GiUnicorn as S_GiUnicorn, GiAlienStare as S_GiAlienStare, GiVampireDracula as S_GiVampireDracula, GiWitchFlight as S_GiWitchFlight, GiCandleFlame as S_GiCandleFlame, GiSwordsEmblem as S_GiSwordsEmblem, GiSpellBook as S_GiSpellBook, GiHeartWings as S_GiHeartWings, GiFlowerEmblem as S_GiFlowerEmblem, GiButterfly as S_GiButterfly, GiPumpkin as S_GiPumpkin, GiOwl as S_GiOwl, GiSnake as S_GiSnake,
} from 'react-icons/gi'

export const CANVAS_WIDTH = 1000
export const MIN_CANVAS_HEIGHT = 600
export const MAX_CANVAS_HEIGHT = 1600
export const MAX_ELEMENTS = 40
// Imágenes por perfil, contando la imagen de fondo
export const MAX_IMAGES = 8
export const MAX_SAVED_DESIGNS = 5

export type FreeElementType =
  | 'name' | 'photo' | 'mascot' | 'bio' | 'instruments' | 'genres' | 'location'
  | 'friends' | 'audio' | 'social' | 'text' | 'image' | 'sticker' | 'box'
  | 'lights' | 'marquee' | 'equalizer'

// Animaciones que se pueden poner en cualquier elemento
export type AnimationKey = 'none' | 'flotar' | 'latido' | 'balanceo' | 'girar' | 'parpadeo' | 'temblor' | 'arcoiris' | 'destello'

export const ANIMATIONS: Record<AnimationKey, string> = {
  none: 'Sin animación',
  flotar: 'Flotar',
  latido: 'Latido',
  balanceo: 'Balanceo',
  girar: 'Girar',
  parpadeo: 'Parpadeo',
  temblor: 'Temblor',
  arcoiris: 'Arcoíris',
  destello: 'Destello',
}

export type FontKey = 'sans' | 'serif' | 'mono' | 'nirvana' | 'cursive' | 'impact' | 'pixel' | 'marker'

export const FONTS: Record<FontKey, { label: string; css: string }> = {
  sans: { label: 'Normal', css: 'Inter, Arial, sans-serif' },
  serif: { label: 'Clásica', css: 'Georgia, "Times New Roman", serif' },
  mono: { label: 'Máquina', css: '"Courier New", monospace' },
  nirvana: { label: 'Nirvana', css: 'Nirvana, sans-serif' },
  cursive: { label: 'Divertida', css: '"Comic Sans MS", "Comic Neue", cursive' },
  impact: { label: 'Impacto', css: 'Impact, "Arial Black", sans-serif' },
  pixel: { label: 'Pixelada', css: '"Press Start 2P", "Courier New", monospace' },
  marker: { label: 'Marcador', css: '"Permanent Marker", "Comic Sans MS", cursive' },
}

// Patrones para rellenar cajas y el fondo (se dibujan con CSS, no pesan nada)
export type PatternKey = 'none' | 'damero' | 'rayas' | 'lunares' | 'cuadricula' | 'diagonal'

export const PATTERNS: Record<PatternKey, string> = {
  none: 'Liso',
  damero: 'Damero',
  rayas: 'Rayas',
  lunares: 'Lunares',
  cuadricula: 'Cuadrícula',
  diagonal: 'Diagonal',
}

// Capas de fondo de cada patrón, listas para background-image / background-size
export function patternLayers(pattern: PatternKey | undefined, color: string, size: number): { images: string[]; sizes: string[] } {
  const s = Math.max(6, Math.min(80, size || 24))
  switch (pattern) {
    case 'damero':
      return { images: [`conic-gradient(${color} 25%, transparent 0 50%, ${color} 0 75%, transparent 0)`], sizes: [`${s}px ${s}px`] }
    case 'rayas':
      return { images: [`repeating-linear-gradient(90deg, ${color} 0 ${s / 2}px, transparent ${s / 2}px ${s}px)`], sizes: ['auto'] }
    case 'lunares':
      return { images: [`radial-gradient(${color} 22%, transparent 24%)`], sizes: [`${s}px ${s}px`] }
    case 'cuadricula':
      return {
        images: [`linear-gradient(${color} 2px, transparent 2px)`, `linear-gradient(90deg, ${color} 2px, transparent 2px)`],
        sizes: [`${s}px ${s}px`, `${s}px ${s}px`],
      }
    case 'diagonal':
      return { images: [`repeating-linear-gradient(45deg, ${color} 0 ${s / 3}px, transparent ${s / 3}px ${s}px)`], sizes: ['auto'] }
    default:
      return { images: [], sizes: [] }
  }
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
  animation: AnimationKey
  glow: boolean        // luz neón alrededor
  glowColor: string
  pattern: PatternKey  // relleno con dibujo (damero, rayas...)
  patternColor: string
  patternSize: number
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
  pattern?: PatternKey   // dibujo repetido encima del color o degradado
  patternColor?: string
  patternSize?: number
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
  { type: 'lights', label: 'Guirnalda de luces', icon: FaLightbulb, w: 520, h: 90 },
  { type: 'marquee', label: 'Cartel LED', icon: FaStream, w: 520, h: 80 },
  { type: 'equalizer', label: 'Ecualizador', icon: FaChartBar, w: 260, h: 120 },
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
  guitarra2: { label: 'Guitarra eléctrica', icon: FaGuitarAlt },
  foco: { label: 'Foco', icon: FaLightbulb },
  arana: { label: 'Araña', icon: FaSpider },
  pluma: { label: 'Pluma', icon: FaFeatherAlt },
  hoja: { label: 'Hoja', icon: FaLeaf },
  copo: { label: 'Copo de nieve', icon: FaSnowflake },
  nube: { label: 'Nube', icon: FaCloud },
  pirata: { label: 'Calavera pirata', icon: FaSkullCrossbones },
  dragon: { label: 'Dragón', icon: FaDragon },
  cuervo: { label: 'Cuervo', icon: FaCrow },
  ojo: { label: 'Ojo', icon: FaEye },
  joystick: { label: 'Joystick', icon: FaGamepad },
  camara: { label: 'Cámara', icon: FaCamera },
  paz: { label: 'Paz', icon: FaPeace },
  yinyang: { label: 'Yin yang', icon: FaYinYang },
  infinito: { label: 'Infinito', icon: FaInfinity },
  ancla: { label: 'Ancla', icon: FaAnchor },
  magia: { label: 'Varita', icon: FaMagic },
  huella: { label: 'Huella', icon: FaPaw },
  radiacion: { label: 'Radiación', icon: FaRadiation },
  biohazard: { label: 'Peligro', icon: FaBiohazard },
  mago: { label: 'Sombrero de mago', icon: FaHatWizard },
  mascara: { label: 'Máscara', icon: FaMask },
  teatro: { label: 'Teatro', icon: FaTheaterMasks },
  bomba: { label: 'Bomba', icon: FaBomb },
  dado: { label: 'Dado', icon: FaDiceD20 },
  robot: { label: 'Robot', icon: S_FaRobot },
  astronauta: { label: 'Astronauta', icon: S_FaUserAstronaut },
  satelite: { label: 'Satélite', icon: S_FaSatellite },
  meteoro: { label: 'Meteoro', icon: S_FaMeteor },
  mundo: { label: 'Mundo', icon: S_FaGlobeAmericas },
  bicho: { label: 'Bicho', icon: S_FaBug },
  pez: { label: 'Pez', icon: S_FaFish },
  rana: { label: 'Rana', icon: S_FaFrog },
  paloma: { label: 'Paloma', icon: S_FaDove },
  caballo: { label: 'Caballo', icon: S_FaHorse },
  baston: { label: 'Bastón dulce', icon: S_FaCandyCane },
  helado: { label: 'Helado', icon: S_FaIceCream },
  galleta: { label: 'Galleta', icon: S_FaCookie },
  hamburguesa: { label: 'Hamburguesa', icon: S_FaHamburger },
  trago: { label: 'Trago', icon: S_FaCocktail },
  trofeo: { label: 'Trofeo', icon: S_FaTrophy },
  medalla: { label: 'Medalla', icon: S_FaMedal },
  caballito: { label: 'Caballo de ajedrez', icon: S_FaChessKnight },
  reina: { label: 'Reina', icon: S_FaChessQueen },
  llave: { label: 'Llave', icon: S_FaKey },
  campana: { label: 'Campana', icon: S_FaBell },
  regalo: { label: 'Regalo', icon: S_FaGift },
  torta: { label: 'Torta', icon: S_FaBirthdayCake },
  paraguas: { label: 'Paraguas', icon: S_FaUmbrella },
  arcoiris: { label: 'Arcoíris', icon: S_FaRainbow },
  montana: { label: 'Montaña', icon: S_FaMountain },
  arbol: { label: 'Árbol', icon: S_FaTree },
  brote: { label: 'Brote', icon: S_FaSeedling },
  moto: { label: 'Moto', icon: S_FaMotorcycle },
  nave: { label: 'Nave', icon: S_FaSpaceShuttle },
  anillo: { label: 'Anillo', icon: S_FaRing },
  vaquero: { label: 'Sombrero vaquero', icon: S_FaHatCowboy },
  volumen: { label: 'Volumen', icon: S_FaVolumeUp },
  antena: { label: 'Antena', icon: S_FaBroadcastTower },
  victoria: { label: 'Mano paz', icon: S_FaHandPeace },
  vulcano: { label: 'Saludo espacial', icon: S_FaHandSpock },
  pulgar: { label: 'Pulgar arriba', icon: S_FaThumbsUp },
  caritaestrellas: { label: 'Cara estrellada', icon: S_FaGrinStars },
  lengua: { label: 'Lengua afuera', icon: S_FaGrinTongue },
  mareado: { label: 'Mareado', icon: S_FaDizzy },
  llorando: { label: 'Llorando', icon: S_FaSadCry },
  enojado: { label: 'Enojado', icon: S_FaAngry },
  risa: { label: 'Risa', icon: S_FaLaughSquint },
  beso: { label: 'Beso', icon: S_FaKissWinkHeart },
  latido: { label: 'Latido', icon: S_FaHeartbeat },
  llama: { label: 'Llama', icon: S_FaFireAlt },
  fogata: { label: 'Fogata', icon: S_FaBurn },
  patin: { label: 'Patín', icon: S_FaSkating },
  avion: { label: 'Avión', icon: S_FaPlane },
  brujula: { label: 'Brújula', icon: S_FaCompass },
  reloj: { label: 'Reloj de arena', icon: S_FaHourglassHalf },
  pocion: { label: 'Poción', icon: S_FaFlask },
  atomo: { label: 'Átomo', icon: S_FaAtom },
  plumita: { label: 'Plumita', icon: S_FaFeather },
  paleta: { label: 'Paleta', icon: S_FaPalette },
  pincel: { label: 'Pincel', icon: S_FaPaintBrush },
  lapida: { label: 'Lápida', icon: S_GiTombstone },
  telarana: { label: 'Telaraña', icon: S_GiSpiderWeb },
  bola: { label: 'Bola de cristal', icon: S_GiCrystalBall },
  ataud: { label: 'Ataúd', icon: S_GiCoffin },
  bateria2: { label: 'Batería completa', icon: S_GiDrumKit },
  notas: { label: 'Notas', icon: S_GiMusicalNotes },
  clavijero: { label: 'Clavijero', icon: S_GiGuitarHead },
  unicornio: { label: 'Unicornio', icon: S_GiUnicorn },
  alien: { label: 'Alien', icon: S_GiAlienStare },
  vampiro: { label: 'Vampiro', icon: S_GiVampireDracula },
  bruja: { label: 'Bruja', icon: S_GiWitchFlight },
  vela: { label: 'Vela', icon: S_GiCandleFlame },
  espadas: { label: 'Espadas', icon: S_GiSwordsEmblem },
  libro: { label: 'Libro de hechizos', icon: S_GiSpellBook },
  corazonalas: { label: 'Corazón alado', icon: S_GiHeartWings },
  flor: { label: 'Flor', icon: S_GiFlowerEmblem },
  mariposa: { label: 'Mariposa', icon: S_GiButterfly },
  zapallo: { label: 'Zapallo', icon: S_GiPumpkin },
  buho: { label: 'Búho', icon: S_GiOwl },
  serpiente: { label: 'Serpiente', icon: S_GiSnake },
}

export const defaultStyle = (type: FreeElementType): FreeElementStyle => {
  const transparent = type === 'sticker' || type === 'mascot' || type === 'lights' || type === 'equalizer'
  return {
    bg: transparent ? 'transparent' : type === 'box' ? '#a855f7' : type === 'marquee' ? '#050505' : '#1a1a1a',
    color: type === 'sticker' ? '#fde047' : type === 'marquee' ? '#39ff88' : type === 'equalizer' ? '#c084fc' : '#ffffff',
    borderColor: '#a855f7',
    borderWidth: transparent || type === 'box' ? 0 : 2,
    radius: type === 'photo' ? 999 : 14,
    opacity: 1,
    fontSize: type === 'name' ? 40 : type === 'text' ? 22 : type === 'marquee' ? 34 : 18,
    font: type === 'name' ? 'nirvana' : type === 'marquee' ? 'mono' : 'sans',
    align: type === 'name' ? 'center' : 'left',
    shadow: false,
    animation: 'none',
    glow: false,
    glowColor: type === 'marquee' ? '#39ff88' : '#a855f7',
    pattern: 'none',
    patternColor: '#ffffff',
    patternSize: 24,
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
    content: type === 'text' ? '¡Escribí lo que quieras acá!' : type === 'sticker' ? 'estrella' : type === 'marquee' ? 'BIENVENIDOS A MI PERFIL' : '',
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
  // El patrón va encima del color o del degradado
  const layers = patternLayers(bg.pattern, bg.patternColor || '#ffffff', bg.patternSize || 28)
  const images = [...layers.images]
  const sizes = [...layers.sizes]
  if (bg.type === 'gradient') {
    images.push(`linear-gradient(160deg, ${bg.color}, ${bg.color2})`)
    sizes.push('auto')
  }
  return {
    backgroundColor: bg.color,
    backgroundImage: images.length ? images.join(', ') : undefined,
    backgroundSize: sizes.length ? sizes.join(', ') : undefined,
  }
}

// Valida lo que viene de la base (por si está incompleto o viejo)
export function parseFreeLayout(raw: any): FreeLayout | null {
  if (!raw || !Array.isArray(raw.elements)) return null
  return {
    height: Math.min(MAX_CANVAS_HEIGHT, Math.max(MIN_CANVAS_HEIGHT, Number(raw.height) || 1000)),
    background: (() => {
      const bg = { type: 'solid', color: '#0f0f0f', color2: '#0f0f0f', image: '', pattern: 'none', patternColor: '#ffffff', patternSize: 28, ...(raw.background || {}) }
      if (!(bg.pattern in PATTERNS)) bg.pattern = 'none'
      return bg as FreeBackground
    })(),
    elements: raw.elements.map((el: any) => {
      const style = { ...defaultStyle(el.type), ...(el.style || {}) }
      // Diseños guardados antes de las animaciones (o con un valor desconocido): sin animación
      if (!(style.animation in ANIMATIONS)) style.animation = 'none'
      if (!(style.pattern in PATTERNS)) style.pattern = 'none'
      if (!(style.font in FONTS)) style.font = 'sans'
      return { ...el, style }
    }),
  }
}
