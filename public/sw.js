// Service worker de SANAT.
// No guarda nada en caché (la app siempre carga la versión más nueva):
// solo existe para que la app sea instalable y pueda mostrar notificaciones.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// Al tocar una notificación: abrir (o enfocar) la app en la sección correspondiente
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/home'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const win of windows) {
        if ('focus' in win) {
          if ('navigate' in win) win.navigate(url)
          return win.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})

// Notificaciones push desde el servidor (llegan aunque la app esté cerrada).
// Si la app está abierta y a la vista, no se muestra: la app ya avisa sola.
// Usan la misma "tag" que los avisos de la app, así nunca salen repetidos.
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      if (windows.some((win) => win.visibilityState === 'visible')) return
      return self.registration.showNotification(data.title || 'SANAT', {
        body: data.body || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: data.tag,
        data: { url: data.url || '/home' },
      })
    })
  )
})
