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
    key: 'punk',
    name: 'Punk fanzine',
    description: 'Recortes, rosa chicle sobre negro y amarillo de advertencia.',
    preview: 'linear-gradient(160deg, #111111, #2b0a1e)',
    build: (hasAudio) => {
      const zine: Partial<FreeElementStyle> = { bg: '#fdf6e3', color: '#111111', borderColor: '#111111', borderWidth: 4, radius: 0, shadow: true, font: 'mono' }
      const pink: Partial<FreeElementStyle> = { ...zine, bg: '#ff3ea5', color: '#111111' }
      const elements = [
        make('name', 50, 50, 620, 130, { bg: '#facc15', color: '#111111', borderColor: '#111111', borderWidth: 5, radius: 0, font: 'impact', fontSize: 66, align: 'center', shadow: true }, { rotation: -3 }),
        make('photo', 700, 40, 250, 250, { radius: 0, borderWidth: 6, borderColor: '#facc15', shadow: true }, { rotation: 5 }),
        make('text', 80, 210, 420, 70, { ...pink, font: 'impact', fontSize: 30, align: 'center' }, { rotation: 2, content: 'HAZLO TÚ MISMO' }),
        make('sticker', 540, 200, 120, 120, { color: '#ff3ea5' }, { content: 'rayo', rotation: -15 }),
        make('bio', 60, 330, 540, 230, zine, { rotation: -1 }),
        make('instruments', 640, 340, 310, 160, pink, { rotation: 3 }),
        make('genres', 640, 540, 310, 120, zine, { rotation: -2 }),
        make('location', 60, 600, 380, 70, { ...zine, bg: '#facc15' }, { rotation: 1 }),
        make('sticker', 470, 600, 120, 120, { color: '#fdf6e3' }, { content: 'calavera', rotation: 10 }),
        make('friends', 640, 700, 300, 70, zine, { rotation: 2 }),
        make('mascot', 60, 710, 150, 170, { color: '#ff3ea5' }),
      ]
      if (hasAudio) elements.push(make('audio', 240, 760, 360, 100, pink))
      return { height: 960, background: { type: 'gradient', color: '#111111', color2: '#2b0a1e', image: '' }, elements }
    },
  },
  {
    key: 'jazz',
    name: 'Jazz club',
    description: 'Azul noche, dorado y letras elegantes de club de humo.',
    preview: 'linear-gradient(160deg, #0b1d3a, #05070d)',
    build: (hasAudio) => {
      const box: Partial<FreeElementStyle> = { bg: '#0d1b33', color: '#f3e7c4', borderColor: '#c9a227', borderWidth: 2, radius: 10, font: 'serif' }
      const elements = [
        make('name', 100, 60, 800, 120, { bg: 'transparent', borderWidth: 0, font: 'cursive', fontSize: 70, color: '#e6c35c', align: 'center' }),
        make('sticker', 130, 190, 90, 90, { color: '#c9a227' }, { content: 'saxo', rotation: -10 }),
        make('photo', 380, 190, 240, 240, { borderWidth: 4, borderColor: '#c9a227', shadow: true }),
        make('sticker', 780, 190, 90, 90, { color: '#c9a227' }, { content: 'nota', rotation: 10 }),
        make('location', 330, 450, 340, 60, { ...box, align: 'center' }),
        make('bio', 80, 540, 520, 220, box),
        make('instruments', 630, 540, 290, 140, box),
        make('genres', 630, 700, 290, 110, box),
        make('friends', 80, 790, 300, 70, box),
        make('mascot', 420, 780, 140, 160),
      ]
      if (hasAudio) elements.push(make('audio', 590, 840, 330, 100, box))
      return { height: 1000, background: { type: 'gradient', color: '#0b1d3a', color2: '#05070d', image: '' }, elements }
    },
  },
  {
    key: 'metal',
    name: 'Metal',
    description: 'Negro, acero y fuego. Letras pesadas y bordes filosos.',
    preview: 'linear-gradient(160deg, #3a3f47, #050505)',
    build: (hasAudio) => {
      const steel: Partial<FreeElementStyle> = { bg: '#0d0d0f', color: '#d4d7dd', borderColor: '#8a9099', borderWidth: 3, radius: 0, shadow: true, font: 'impact' }
      const fire: Partial<FreeElementStyle> = { ...steel, borderColor: '#e2541b', color: '#f3d2c1' }
      const elements = [
        make('name', 40, 40, 920, 150, { bg: 'transparent', borderWidth: 0, font: 'nirvana', fontSize: 86, color: '#e7e9ee', align: 'center' }),
        make('sticker', 60, 200, 120, 120, { color: '#e2541b' }, { content: 'fuego', rotation: -12 }),
        make('photo', 360, 190, 280, 280, { radius: 0, borderWidth: 6, borderColor: '#8a9099', shadow: true }),
        make('sticker', 820, 200, 120, 120, { color: '#d4d7dd' }, { content: 'calavera', rotation: 12 }),
        make('text', 300, 490, 400, 70, { ...fire, bg: '#1a0a05', fontSize: 30, align: 'center' }, { content: 'MÁS FUERTE \\m/' }),
        make('bio', 60, 590, 540, 220, steel),
        make('instruments', 630, 590, 310, 150, fire),
        make('genres', 630, 760, 310, 120, steel),
        make('location', 60, 830, 360, 70, steel),
        make('sticker', 470, 830, 100, 100, { color: '#e2541b' }, { content: 'rayo', rotation: -8 }),
        make('friends', 630, 900, 310, 70, steel),
        make('mascot', 60, 920, 140, 160),
      ]
      if (hasAudio) elements.push(make('audio', 230, 960, 370, 100, fire))
      return { height: 1100, background: { type: 'gradient', color: '#3a3f47', color2: '#050505', image: '' }, elements }
    },
  },
  {
    key: 'terror',
    name: 'Terror',
    description: 'Rojo sangre, oscuridad total y cosas que se mueven en la noche.',
    preview: 'linear-gradient(160deg, #3b0000, #000000)',
    build: (hasAudio) => {
      const crypt: Partial<FreeElementStyle> = { bg: '#0a0000', color: '#d9c6c6', borderColor: '#7a0000', borderWidth: 2, radius: 4, shadow: true, font: 'serif' }
      const elements = [
        make('name', 60, 50, 880, 140, { bg: 'transparent', borderWidth: 0, font: 'nirvana', fontSize: 80, color: '#b30000', align: 'center' }, { rotation: -1 }),
        make('sticker', 40, 30, 110, 110, { color: '#6b6b6b' }, { content: 'murcielago', rotation: -18 }),
        make('sticker', 860, 40, 100, 100, { color: '#e8e2c8' }, { content: 'luna' }),
        make('photo', 370, 200, 260, 260, { borderWidth: 5, borderColor: '#7a0000', radius: 130, shadow: true }),
        make('sticker', 120, 260, 130, 130, { color: '#d9c6c6' }, { content: 'fantasma', rotation: 8 }),
        make('sticker', 760, 280, 120, 120, { color: '#b30000' }, { content: 'calavera', rotation: -10 }),
        make('text', 250, 480, 500, 70, { ...crypt, bg: 'transparent', borderWidth: 0, color: '#b30000', fontSize: 28, align: 'center', shadow: false }, { content: 'NO MIRES ATRÁS...', rotation: 1 }),
        make('bio', 60, 580, 540, 230, crypt, { rotation: -1 }),
        make('instruments', 630, 580, 310, 150, crypt, { rotation: 1 }),
        make('genres', 630, 750, 310, 120, crypt),
        make('location', 60, 840, 380, 70, crypt),
        make('friends', 630, 900, 310, 70, crypt),
        make('mascot', 470, 830, 140, 160, { color: '#7a0000' }),
      ]
      if (hasAudio) elements.push(make('audio', 60, 940, 380, 100, crypt))
      return { height: 1080, background: { type: 'gradient', color: '#3b0000', color2: '#000000', image: '' }, elements }
    },
  },
  {
    key: 'videojuego',
    name: 'Videojuego',
    description: 'Pantalla de arcade: pixeles, verde fósforo y "PRESS START".',
    preview: 'linear-gradient(160deg, #13002b, #001a14)',
    build: (hasAudio) => {
      const hud: Partial<FreeElementStyle> = { bg: '#05010f', color: '#39ff88', borderColor: '#39ff88', borderWidth: 4, radius: 0, font: 'mono' }
      const pink: Partial<FreeElementStyle> = { ...hud, color: '#ff4fd8', borderColor: '#ff4fd8' }
      const yellow: Partial<FreeElementStyle> = { ...hud, color: '#ffe14d', borderColor: '#ffe14d' }
      const elements = [
        make('text', 60, 40, 300, 60, { ...yellow, fontSize: 22, align: 'left', borderWidth: 0, bg: 'transparent' }, { content: '1UP  000990' }),
        make('text', 640, 40, 300, 60, { ...yellow, fontSize: 22, align: 'right', borderWidth: 0, bg: 'transparent' }, { content: 'HI-SCORE 99999' }),
        make('name', 60, 110, 880, 120, { ...hud, bg: 'transparent', borderWidth: 0, fontSize: 64, align: 'center' }),
        make('photo', 380, 250, 240, 240, { radius: 0, borderWidth: 6, borderColor: '#ff4fd8' }),
        make('sticker', 160, 290, 110, 110, { color: '#ffe14d' }, { content: 'estrella' }),
        make('sticker', 730, 290, 110, 110, { color: '#39ff88' }, { content: 'gema' }),
        make('text', 330, 510, 340, 60, { ...pink, fontSize: 24, align: 'center' }, { content: 'PRESS START' }),
        make('bio', 60, 600, 540, 220, hud),
        make('instruments', 630, 600, 310, 150, pink),
        make('genres', 630, 770, 310, 120, yellow),
        make('location', 60, 850, 360, 70, pink),
        make('friends', 630, 910, 310, 70, hud),
        make('sticker', 450, 850, 110, 110, { color: '#ff4fd8' }, { content: 'cohete', rotation: -20 }),
        make('mascot', 60, 940, 140, 160, { color: '#39ff88' }),
      ]
      if (hasAudio) elements.push(make('audio', 230, 990, 370, 100, hud))
      return { height: 1120, background: { type: 'gradient', color: '#13002b', color2: '#001a14', image: '' }, elements }
    },
  },
  {
    key: 'escena',
    name: 'Escena 2008',
    description: 'Neón flúor, damero, letras pixeladas y todo brillando. Pura época de fotolog.',
    preview: 'linear-gradient(160deg, #7cff00 0 14%, #050505 14% 86%, #ff2bd6 86%)',
    build: (hasAudio) => {
      const lime = '#7cff00'
      const pink = '#ff2bd6'
      const cyan = '#00e5ff'
      const plain: Partial<FreeElementStyle> = { bg: 'transparent', borderWidth: 0, color: '#ffffff', font: 'sans', fontSize: 17 }
      const title = (color: string): Partial<FreeElementStyle> => ({ bg: '#000000', color, borderColor: color, borderWidth: 3, radius: 4, font: 'pixel', fontSize: 15, align: 'center' })
      const checker = (color: string): Partial<FreeElementStyle> => ({ bg: '#000000', borderWidth: 0, radius: 0, pattern: 'damero', patternColor: color, patternSize: 14 })
      const elements = [
        // Marco y barra superior
        make('box', 20, 20, 960, 1060, { bg: '#050505', borderColor: lime, borderWidth: 6, radius: 18, glow: true, glowColor: lime }),
        make('box', 40, 40, 920, 84, { bg: lime, borderWidth: 0, radius: 10 }),
        make('social', 56, 54, 280, 58, { bg: '#000000', color: '#ffffff', borderColor: pink, borderWidth: 3, radius: 10, fontSize: 14 }),
        make('name', 356, 50, 590, 66, { bg: '#000000', color: cyan, borderWidth: 0, radius: 999, font: 'marker', fontSize: 34, align: 'center' }),
        // Columna izquierda
        make('box', 56, 146, 300, 22, checker('#ffffff')),
        make('photo', 56, 180, 300, 300, { radius: 6, borderWidth: 4, borderColor: pink }),
        make('box', 56, 494, 300, 22, checker('#ffffff')),
        make('text', 56, 528, 300, 52, { ...title(lime), bg: lime, color: '#000000', radius: 999 }, { content: 'SOBRE MI' }),
        make('bio', 56, 590, 300, 190, plain),
        // Columna del medio
        make('text', 380, 146, 280, 48, { ...plain, color: cyan, font: 'marker', fontSize: 24 }, { content: 'mis amigos <3' }),
        make('friends', 380, 196, 280, 50, plain),
        make('marquee', 380, 262, 280, 52, { bg: '#1d4ed8', color: '#ffe14d', borderColor: '#ffe14d', borderWidth: 2, radius: 4, font: 'pixel', fontSize: 15, glow: true, glowColor: '#ffe14d' }, { content: 'CUIDADO: ZONA DE RUIDO  ' }),
        make('text', 380, 334, 280, 44, { ...plain, color: pink, font: 'marker', fontSize: 24 }, { content: 'lo que toco!!' }),
        make('instruments', 380, 380, 280, 150, plain),
        make('genres', 380, 544, 280, 110, { ...plain, borderColor: lime, borderWidth: 2, radius: 6 }),
        make('mascot', 430, 690, 180, 200, {}, { }),
        // Columna derecha
        make('lights', 690, 140, 270, 70),
        make('text', 690, 222, 270, 54, title('#ff3b3b'), { content: 'NO ME GUSTA >:(' }),
        make('text', 690, 284, 270, 110, plain, { content: 'el silencio, los ensayos que se suspenden y los lunes.' }),
        make('text', 690, 404, 270, 54, title(lime), { content: 'OTROS.' }),
        make('text', 690, 466, 270, 120, plain, { content: 'Toco los findes. Busco gente para armar algo ruidoso. ¡Escribime!' }),
        make('sticker', 690, 600, 86, 86, { color: pink, glow: true, glowColor: pink }, { content: 'calavera', rotation: -10 }),
        make('sticker', 782, 600, 86, 86, { color: '#ffe14d', animation: 'parpadeo' }, { content: 'rayo' }),
        make('sticker', 874, 600, 86, 86, { color: lime, animation: 'flotar' }, { content: 'alien', rotation: 8 }),
        make('box', 690, 704, 270, 22, checker(pink)),
        make('equalizer', 690, 740, 270, 110, { color: cyan }),
        // Cartel de abajo
        make('marquee', 40, 990, 920, 66, { bg: '#000000', color: lime, borderColor: lime, borderWidth: 3, radius: 10, font: 'pixel', fontSize: 20 }, { content: 'SANAT  *  ESCENA 2008  *  RAWR  *  ' }),
      ]
      if (hasAudio) elements.push(make('audio', 380, 876, 580, 106, { bg: '#000000', color: '#ffffff', borderColor: pink, borderWidth: 3, radius: 10 }))
      return {
        height: 1100,
        background: { type: 'solid', color: '#000000', color2: '#000000', image: '', pattern: 'lunares', patternColor: '#2a0a3d', patternSize: 30 },
        elements,
      }
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
