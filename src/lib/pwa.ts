// src/lib/pwa.ts
// App instalable (PWA) y notificaciones del dispositivo.
import { supabase } from './supabaseClient'

// ---------- Instalación ----------
let installPrompt: any = null
const listeners = new Set<() => void>()

export function initPwa() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('No se pudo registrar el service worker:', err))
    })
  }
  // Android/Chrome avisan cuando la app se puede instalar: guardamos ese aviso
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installPrompt = e
    listeners.forEach(fn => fn())
  })
  window.addEventListener('appinstalled', () => {
    installPrompt = null
    listeners.forEach(fn => fn())
  })
}

export const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true

export const canPromptInstall = () => !!installPrompt

export function onInstallChange(fn: () => void) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export async function promptInstall(): Promise<boolean> {
  if (!installPrompt) return false
  installPrompt.prompt()
  const { outcome } = await installPrompt.userChoice
  installPrompt = null
  listeners.forEach(fn => fn())
  return outcome === 'accepted'
}

// ---------- Notificaciones ----------
export const NOTIFICATIONS_EVENT = 'sanat-notifications-changed'
export const notificationsSupported = () => 'Notification' in window

export const notificationPermission = (): NotificationPermission | 'unsupported' =>
  notificationsSupported() ? Notification.permission : 'unsupported'

export async function requestNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  const result = await Notification.requestPermission()
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
  if (result === 'granted') {
    showDeviceNotification('¡Notificaciones activadas! 🎸', 'Te vamos a avisar cuando te escriban o le den like a tu publicación.', '/home', 'sanat-welcome')
  }
  return result
}

// ---------- Push (avisos con la app cerrada) ----------
// La clave pública VAPID va en la variable VITE_VAPID_PUBLIC_KEY (Vercel y .env).
// Sin esa clave, la app sigue avisando solo mientras está abierta.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

const urlBase64ToUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export const pushSupported = () =>
  !!VAPID_PUBLIC_KEY && 'serviceWorker' in navigator && 'PushManager' in window && notificationsSupported()

// Registra este dispositivo para recibir avisos del servidor. Es seguro llamarlo varias veces.
export async function subscribePush(userId: string) {
  if (!pushSupported() || Notification.permission !== 'granted') return
  try {
    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!) })
    }
    const json = subscription.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return
    await supabase.from('push_subscriptions').upsert({ endpoint: json.endpoint, user_id: userId, p256dh: json.keys.p256dh, auth: json.keys.auth }, { onConflict: 'endpoint' })
  } catch (error) {
    console.warn('No se pudo activar el push:', error)
  }
}

// Al cerrar sesión: este dispositivo deja de recibir avisos de esa cuenta
export async function unsubscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    if (!subscription) return
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    await subscription.unsubscribe()
  } catch (error) {
    console.warn('No se pudo desactivar el push:', error)
  }
}

// En celulares hay que mostrarlas desde el service worker; en compu sirve cualquiera de las dos
export async function showDeviceNotification(title: string, body: string, url: string, tag?: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  const options = { body, icon: '/icon-192.png', badge: '/icon-192.png', tag, data: { url } }
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration) { await registration.showNotification(title, options); return }
    const notification = new Notification(title, options)
    notification.onclick = () => { window.focus(); window.location.href = url }
  } catch (error) {
    console.warn('No se pudo mostrar la notificación:', error)
  }
}
