// src/types/profileTemplates.ts
// Plantillas listas para el perfil libre. Usan los datos del propio perfil
// (nombre, foto, bio...) y después se pueden editar como cualquier diseño.
import { defaultStyle, type FreeLayout, type FreeElement, type FreeElementType, type FreeElementStyle } from './freeLayout'

export interface ProfileTemplate {
  key: string
  name: string
  description: string
  preview: string   // fondo CSS para la miniatura
  build: (hasAudio: boolean) => FreeLayout
}

let counter = 0
const make = (
  type: FreeElementType, x: number, y: number, w: number, h: number,
  style: Partial<FreeElementStyle> = {}, extra: Partial<FreeElement> = {},
): FreeElement => ({
  id: `tpl-${Date.now().toString(36)}-${counter++}`,
  type, x, y, w, h, rotation: 0, z: counter,
  style: { ...defaultStyle(type), ...style },
  content: '',
  links: type === 'social' ? [] : undefined,
  ...extra,
})

export const PROFILE_TEMPLATES: ProfileTemplate[] = [
  {
    key: 'grunge',
    name: 'Grunge 90s',
    description: 'Tonos gastados, letras de impacto y todo un poco torcido.',
    preview: 'linear-gradient(160deg, #4a4334, #151310)',
    build: (hasAudio) => {
      const box: Partial<FreeElementStyle> = { bg: '#26221b', color: '#e8dcc0', borderColor: '#9c8f6a', borderWidth: 4, radius: 2, shadow: true, font: 'mono' }
      const elements = [
        make('photo', 60, 60, 260, 260, { radius: 4, borderWidth: 8, borderColor: '#e8dcc0', shadow: true }, { rotation: -4 }),
        make('name', 360, 70, 600, 130, { bg: 'transparent', borderWidth: 0, font: 'impact', fontSize: 64, color: '#e8dcc0', align: 'left' }, { rotation: -2 }),
        make('text', 370, 210, 330, 70, { ...box, bg: '#9c2b1c', color: '#f5ead2', borderColor: '#e8dcc0', font: 'impact', fontSize: 26, align: 'center' }, { rotation: 3, content: 'NUNCA DEJES DE TOCAR' }),
        make('sticker', 780, 200, 140, 140, { color: '#e8dcc0' }, { content: 'calavera', rotation: 12 }),
        make('bio', 60, 380, 520, 230, box, { rotation: 1 }),
        make('instruments', 620, 400, 320, 150, box, { rotation: -2 }),
        make('genres', 620, 580, 320, 120, box, { rotation: 2 }),
        make('location', 60, 650, 360, 70, box),
        make('mascot', 450, 640, 150, 170, { color: '#e8dcc0' }),
        make('friends', 60, 750, 280, 70, box, { rotation: -1 }),
        make('sticker', 840, 760, 100, 100, { color: '#c9a227' }, { content: 'fuego', rotation: -10 }),
      ]
      if (hasAudio) elements.push(make('audio', 360, 840, 480, 100, box))
      return { height: 1000, background: { type: 'gradient', color: '#4a4334', color2: '#151310', image: '' }, elements }
    },
  },
  {
    key: 'neon',
    name: 'Neón',
    description: 'Fondo nocturno y bordes que brillan en fucsia y celeste.',
    preview: 'linear-gradient(160deg, #2a0050, #000000)',
    build: (hasAudio) => {
      const pink: Partial<FreeElementStyle> = { bg: '#0b0014', color: '#f5d0fe', borderColor: '#ff2bd6', borderWidth: 3, radius: 18, font: 'mono' }
      const cyan: Partial<FreeElementStyle> = { ...pink, borderColor: '#00f0ff', color: '#cffafe' }
      const elements = [
        make('name', 60, 50, 880, 120, { bg: 'transparent', borderWidth: 0, font: 'nirvana', fontSize: 72, color: '#00f0ff', align: 'center' }),
        make('photo', 380, 190, 240, 240, { borderWidth: 5, borderColor: '#ff2bd6' }),
        make('sticker', 220, 230, 110, 110, { color: '#ff2bd6' }, { content: 'rayo', rotation: -12 }),
        make('sticker', 680, 230, 110, 110, { color: '#00f0ff' }, { content: 'estrella', rotation: 12 }),
        make('bio', 60, 470, 430, 220, pink),
        make('instruments', 510, 470, 430, 140, cyan),
        make('genres', 510, 630, 430, 120, pink),
        make('location', 60, 710, 430, 70, cyan),
        make('friends', 60, 800, 260, 70, pink),
        make('mascot', 800, 770, 150, 170),
      ]
      if (hasAudio) elements.push(make('audio', 340, 800, 440, 100, cyan))
      return { height: 980, background: { type: 'gradient', color: '#2a0050', color2: '#000000', image: '' }, elements }
    },
  },
  {
    key: 'folklore',
    name: 'Folklore',
    description: 'Colores de tierra, letras clásicas y calidez de peña.',
    preview: 'linear-gradient(160deg, #f3e3c3, #c9864b)',
    build: (hasAudio) => {
      const box: Partial<FreeElementStyle> = { bg: '#fff8ea', color: '#4a2c17', borderColor: '#8b4513', borderWidth: 3, radius: 22, font: 'serif' }
      const elements = [
        make('photo', 60, 60, 240, 240, { borderWidth: 6, borderColor: '#8b4513' }),
        make('name', 340, 80, 600, 120, { bg: 'transparent', borderWidth: 0, font: 'serif', fontSize: 58, color: '#5a2d0c', align: 'left' }),
        make('location', 340, 210, 380, 70, box),
        make('sticker', 790, 190, 130, 130, { color: '#e0a526' }, { content: 'sol' }),
        make('bio', 60, 340, 560, 220, box),
        make('instruments', 660, 360, 280, 160, box),
        make('genres', 60, 590, 560, 110, box),
        make('sticker', 700, 560, 120, 120, { color: '#8b4513' }, { content: 'guitarra', rotation: -15 }),
        make('friends', 660, 700, 280, 70, box),
        make('mascot', 470, 720, 150, 170),
      ]
      if (hasAudio) elements.push(make('audio', 60, 740, 380, 100, box))
      return { height: 960, background: { type: 'gradient', color: '#f3e3c3', color2: '#c9864b', image: '' }, elements }
    },
  },
  {
    key: 'minimal',
    name: 'Minimal',
    description: 'Blanco, limpio y ordenado. Que hable tu música.',
    preview: 'linear-gradient(160deg, #ffffff, #e5e5e5)',
    build: (hasAudio) => {
      const box: Partial<FreeElementStyle> = { bg: '#ffffff', color: '#111111', borderColor: '#9ca3af', borderWidth: 1, radius: 14, font: 'sans' }
      const elements = [
        make('photo', 400, 60, 200, 200, { borderWidth: 0 }),
        make('name', 150, 280, 700, 110, { bg: 'transparent', borderWidth: 0, font: 'sans', fontSize: 48, color: '#111111', align: 'center' }),
        make('location', 330, 400, 340, 60, { ...box, align: 'center' }),
        make('bio', 150, 490, 700, 180, box),
        make('instruments', 150, 700, 340, 140, box),
        make('genres', 510, 700, 340, 140, box),
        make('friends', 150, 870, 340, 60, box),
      ]
      if (hasAudio) elements.push(make('audio', 510, 860, 340, 100, box))
      return { height: 1000, background: { type: 'solid', color: '#f5f5f5', color2: '#f5f5f5', image: '' }, elements }
    },
  },
]
