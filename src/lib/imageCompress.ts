// src/lib/imageCompress.ts
// Comprime imágenes antes de subirlas: las achica al tamaño que realmente se
// muestra y las convierte a WebP (pesa ~30% menos que JPG con la misma calidad).
import * as _imageCompression from 'browser-image-compression'
const imageCompression = (_imageCompression as any).default || _imageCompression

export type ImagePreset = 'avatar' | 'gallery' | 'background'

const PRESETS: Record<ImagePreset, { maxWidthOrHeight: number; maxSizeMB: number }> = {
  avatar: { maxWidthOrHeight: 512, maxSizeMB: 0.15 },      // foto de perfil (se ve chica)
  gallery: { maxWidthOrHeight: 1200, maxSizeMB: 0.35 },    // imágenes del perfil libre
  background: { maxWidthOrHeight: 1600, maxSizeMB: 0.5 },  // fondo del perfil libre
}

export const MAX_INPUT_IMAGE_MB = 15

// Devuelve el archivo comprimido (o el original si no se pudo comprimir y ya es liviano)
export async function compressImage(file: File, preset: ImagePreset): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen')
  if (file.size > MAX_INPUT_IMAGE_MB * 1024 * 1024) throw new Error(`La imagen pesa más de ${MAX_INPUT_IMAGE_MB} MB`)
  // Los GIF animados perderían la animación: se suben tal cual si son livianos
  if (file.type === 'image/gif') {
    if (file.size > 1024 * 1024) throw new Error('Los GIF tienen que pesar menos de 1 MB')
    return file
  }
  const { maxWidthOrHeight, maxSizeMB } = PRESETS[preset]
  try {
    const compressed: Blob = await imageCompression(file, {
      maxWidthOrHeight,
      maxSizeMB,
      fileType: 'image/webp',
      initialQuality: 0.8,
      useWebWorker: true,
    })
    const name = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return new File([compressed], name, { type: 'image/webp' })
  } catch {
    if (file.size <= 2 * 1024 * 1024) return file
    throw new Error('No se pudo comprimir la imagen. Probá con otra.')
  }
}

export const imageExtension = (file: File) => (file.type === 'image/webp' ? 'webp' : file.name.split('.').pop() || 'jpg')
