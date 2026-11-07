// src/lib/share.ts
// Compartir links de SANAT. En el celular abre el menú del sistema (WhatsApp,
// Instagram, etc.); en la compu abre WhatsApp con el mensaje listo.
// Los links /p/, /b/ y /e/ muestran vista previa con imagen al pegarlos.

export const profileShareUrl = (id: string) => `${window.location.origin}/p/${id}`
export const bandShareUrl = (id: string) => `${window.location.origin}/b/${id}`
export const eventShareUrl = (id: string) => `${window.location.origin}/e/${id}`

export async function shareLink({ title, text, url }: { title: string; text: string; url: string }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return
    } catch (error: any) {
      // La persona cerró el menú: no hacer nada más
      if (error?.name === 'AbortError') return
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener,noreferrer')
}
