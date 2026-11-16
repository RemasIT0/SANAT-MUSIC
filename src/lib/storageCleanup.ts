// src/lib/storageCleanup.ts
// Borra de Storage las imágenes que dejaron de usarse (foto de perfil o logo reemplazados,
// imágenes que se sacaron del diseño de perfil) para no gastar el espacio gratis de Supabase.
// Solo toca archivos propios: los que están en la carpeta de la persona o en gallery/<su id>-...
import { supabase } from './supabaseClient'
import type { FreeLayout } from '../types/freeLayout'

const PUBLIC_PREFIX = `${String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')}/storage/v1/object/public/`

// "https://.../storage/v1/object/public/avatars/abc/foto.webp" -> "abc/foto.webp" (o null si no es de ese bucket)
export function storagePathFromUrl(url: string | null | undefined, bucket: string): string | null {
  if (!url || !url.startsWith(PUBLIC_PREFIX + bucket + '/')) return null
  const path = decodeURIComponent(url.slice(PUBLIC_PREFIX.length + bucket.length + 1).split('?')[0])
  return path || null
}

const isOwnPath = (path: string, userId: string) => path.startsWith(`${userId}/`) || path.startsWith(`gallery/${userId}-`)

// Borra en silencio: si algo falla (sin permiso, ya no existe) no molesta a la persona
export async function removeOwnFiles(urls: (string | null | undefined)[], userId: string, bucket = 'avatars') {
  const paths = [...new Set(urls.map(u => storagePathFromUrl(u, bucket)).filter((p): p is string => !!p && isOwnPath(p, userId)))]
  if (!paths.length) return
  try {
    await supabase.storage.from(bucket).remove(paths)
  } catch {
    // sin conexión o sin permiso: queda para otra vez
  }
}

// Todas las imágenes subidas que usa un diseño de perfil (fondo + elementos "imagen")
export function layoutImageUrls(layout: FreeLayout | null | undefined): string[] {
  if (!layout) return []
  const urls = layout.elements.filter(el => el.type === 'image' && el.content).map(el => el.content as string)
  if (layout.background.type === 'image' && layout.background.image) urls.push(layout.background.image)
  return urls
}

// Los diseños guardados son solo el "molde": sin fotos (así borrar una foto no rompe nada)
export function stripLayoutImages(layout: FreeLayout): FreeLayout {
  return {
    ...layout,
    background: layout.background.type === 'image' ? { ...layout.background, type: 'solid', image: '' } : { ...layout.background, image: '' },
    elements: layout.elements.map(el => el.type === 'image' ? { ...el, content: '' } : el),
  }
}
