// src/lib/monitoring.ts
// Aviso automático de errores con Sentry (te llega un mail por cada error nuevo).
// - Solo en la página publicada (no en la compu mientras se desarrolla).
// - Se carga después de que arranca la app, para no sumar peso a la primera carga.
// - Privacidad: solo el id de la persona; sin mails, sin IP, sin lo que se escribe en la consola
//   y sin la parte de búsqueda de las direcciones consultadas.
type SentryModule = typeof import('@sentry/react')

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
export const monitoringEnabled = import.meta.env.PROD && !!DSN

let sentry: SentryModule | null = null
let pendingUserId: string | null | undefined
const pendingErrors: { error: unknown; context?: Record<string, unknown> }[] = []

// Errores que no son fallas de SANAT (conexión, extensiones, avisos internos del navegador)
const IGNORED = [
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'Failed to fetch',
  'NetworkError',
  'Load failed',
  'AbortError',
  'The user aborted a request',
  'Non-Error promise rejection captured',
]

// Saca la parte de búsqueda (?...) de una dirección: ahí pueden ir términos que escribió la persona
const stripQuery = (url: unknown) => (typeof url === 'string' ? url.split('?')[0] : url)

export async function initMonitoring() {
  if (!monitoringEnabled || sentry) return
  try {
    const mod = await import('@sentry/react')
    mod.init({
      dsn: DSN,
      // Los avisos salen por el dominio de SANAT (api/aviso.js) para que los bloqueadores no los corten
      tunnel: '/api/aviso',
      environment: 'production',
      sendDefaultPii: false,
      tracesSampleRate: 0,
      ignoreErrors: IGNORED,
      // Errores que vienen de extensiones del navegador, no de SANAT
      denyUrls: [/extensions\//i, /^chrome(-extension)?:\/\//i, /^moz-extension:\/\//i, /^safari-(web-)?extension:\/\//i],
      integrations: [mod.breadcrumbsIntegration({ console: false })],
      beforeBreadcrumb(crumb) {
        if (crumb.data?.url) crumb.data.url = stripQuery(crumb.data.url)
        return crumb
      },
      beforeSend(event) {
        // Solo el id: nada de mail ni IP
        if (event.user) event.user = { id: event.user.id }
        if (event.request) {
          delete event.request.cookies
          delete event.request.headers
          if (event.request.url) event.request.url = stripQuery(event.request.url) as string
          delete event.request.query_string
        }
        return event
      },
    })
    sentry = mod
    if (pendingUserId !== undefined) setMonitoringUser(pendingUserId)
    pendingErrors.splice(0).forEach(({ error, context }) => reportError(error, context))
  } catch (error) {
    console.warn('No se pudo iniciar el aviso de errores:', error)
  }
}

export function setMonitoringUser(userId: string | null) {
  if (!monitoringEnabled) return
  if (!sentry) { pendingUserId = userId; return }
  sentry.setUser(userId ? { id: userId } : null)
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!monitoringEnabled) return
  if (!sentry) { pendingErrors.push({ error, context }); return }
  sentry.captureException(error, context ? { extra: context } : undefined)
}
