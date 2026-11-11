// src/types/postDesign.ts
// Diseño de una publicación: un póster chico (400 x 500) con el texto de la publicación,
// textos extra, stickers y formas de color. Se guarda en posts.design (jsonb).
// Reusa los elementos del diseño de perfil, con menos opciones para no saturar.
import {
  FONTS, STICKERS, PATTERNS, defaultStyle,
  type FreeElement, type FreeElementStyle, type FontKey, type PatternKey,
} from './freeLayout'

export const POSTER_W = 400
export const POSTER_H = 500
export const MAX_POSTER_ELEMENTS = 8
// El texto de la publicación es siempre este elemento (no se puede borrar)
export const BODY_ID = 'body'

export type PosterElementType = 'text' | 'sticker' | 'box'

export interface PostDesign {
  v: 1
  background: { type: 'solid' | 'gradient'; color: string; color2: string; pattern: PatternKey; patternColor: string }
  elements: FreeElement[]
}

// Fuentes que se ofrecen en el póster
export const POSTER_FONTS: FontKey[] = ['sans', 'nirvana', 'impact', 'marker', 'serif', 'mono', 'pixel', 'cursive']

// Colores rápidos (además del selector libre)
export const POSTER_SWATCHES = ['#121212', '#f4efe6', '#7e22ce', '#c084fc', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#ec4899', '#ffffff']

const newId = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function posterStyle(type: PosterElementType | 'body', patch: Partial<FreeElementStyle> = {}): FreeElementStyle {
  const base = defaultStyle(type === 'body' ? 'text' : type)
  return {
    ...base,
    bg: type === 'box' ? '#7e22ce' : 'transparent',
    color: type === 'sticker' ? '#c084fc' : '#ffffff',
    borderWidth: 0,
    radius: type === 'box' ? 6 : 0,
    fontSize: type === 'body' ? 22 : 34,
    font: type === 'text' ? 'impact' : 'sans',
    align: 'center',
    ...patch,
  }
}

export function defaultPostDesign(): PostDesign {
  return {
    v: 1,
    background: { type: 'solid', color: '#121212', color2: '#2e1065', pattern: 'none', patternColor: '#2a2a2a' },
    elements: [
      { id: BODY_ID, type: 'text', x: 30, y: 110, w: 340, h: 280, rotation: 0, z: 2, style: posterStyle('body') },
    ],
  }
}

export function makePosterElement(type: PosterElementType, elements: FreeElement[]): FreeElement {
  const z = elements.reduce((max, e) => Math.max(max, e.z), 0) + 1
  const offset = (elements.length % 5) * 18
  const size = type === 'sticker' ? { w: 90, h: 90 } : type === 'box' ? { w: 220, h: 120 } : { w: 300, h: 70 }
  return {
    id: newId(),
    type,
    x: Math.round((POSTER_W - size.w) / 2) + offset - 36,
    y: 30 + offset,
    ...size,
    rotation: type === 'text' ? -3 : 0,
    z,
    style: posterStyle(type),
    content: type === 'text' ? 'BUSCO BANDA' : type === 'sticker' ? 'guitarra' : '',
  }
}

// ---------- Validación de lo que viene de la base ----------

const COLOR = /^#[0-9a-f]{3,8}$/i
const safeColor = (value: unknown, fallback: string, allowTransparent = false) =>
  typeof value === 'string' && (COLOR.test(value) || (allowTransparent && value === 'transparent')) ? value : fallback
const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback
}

export function parsePostDesign(raw: unknown): PostDesign | null {
  const data = raw as any
  if (!data || typeof data !== 'object' || !Array.isArray(data.elements)) return null
  const bg = data.background || {}
  const elements: FreeElement[] = data.elements
    .filter((el: any) => el && (el.type === 'text' || el.type === 'sticker' || el.type === 'box'))
    .slice(0, 14) // tope amplio para no recortar diseños ya guardados; el editor limita a MAX_POSTER_ELEMENTS
    .map((el: any, i: number): FreeElement => {
      const isBody = el.id === BODY_ID
      const kind: PosterElementType | 'body' = isBody ? 'body' : el.type
      const base = posterStyle(kind)
      const s = el.style || {}
      const w = clamp(el.w, 24, POSTER_W, 200)
      const h = clamp(el.h, 24, POSTER_H, 100)
      return {
        id: isBody ? BODY_ID : String(el.id || `p-${i}`).slice(0, 40),
        type: isBody ? 'text' : el.type,
        x: clamp(el.x, 0, POSTER_W - w, 0),
        y: clamp(el.y, 0, POSTER_H - h, 0),
        w, h,
        rotation: clamp(el.rotation, -45, 45, 0),
        z: clamp(el.z, 0, 99, i + 1),
        style: {
          ...base,
          bg: safeColor(s.bg, base.bg, true),
          color: safeColor(s.color, base.color),
          radius: clamp(s.radius, 0, 200, base.radius),
          fontSize: clamp(s.fontSize, 10, 90, base.fontSize),
          font: POSTER_FONTS.includes(s.font) ? s.font : base.font,
          align: ['left', 'center', 'right'].includes(s.align) ? s.align : base.align,
        },
        content: isBody ? '' : el.type === 'sticker'
          ? (typeof el.content === 'string' && el.content in STICKERS ? el.content : 'estrella')
          : typeof el.content === 'string' ? el.content.slice(0, 80) : '',
      }
    })
  // El texto de la publicación tiene que estar siempre
  if (!elements.some(el => el.id === BODY_ID)) elements.push(defaultPostDesign().elements[0])
  return {
    v: 1,
    background: {
      type: bg.type === 'gradient' ? 'gradient' : 'solid',
      color: safeColor(bg.color, '#121212'),
      color2: safeColor(bg.color2, '#2e1065'),
      pattern: typeof bg.pattern === 'string' && bg.pattern in PATTERNS ? bg.pattern : 'none',
      patternColor: safeColor(bg.patternColor, '#ffffff'),
    },
    elements,
  }
}

export const posterFontCss = (font: FontKey) => FONTS[font]?.css
