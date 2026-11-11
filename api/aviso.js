// api/aviso.js (función de Vercel)
// Reenvía a Sentry los avisos de error de la app. Pasan por el dominio de SANAT
// para que los bloqueadores de anuncios (Brave, uBlock, etc.) no los corten.
// Solo acepta avisos dirigidos al proyecto de Sentry de SANAT: cualquier otro destino se rechaza.
// No se reenvía la IP ni nada de la persona; solo el aviso tal como lo armó la app.

const MAX_BYTES = 1024 * 1024 // 1 MB por aviso

function sentryTarget() {
  try {
    const dsn = new URL(process.env.VITE_SENTRY_DSN || '')
    const projectId = dsn.pathname.replace(/\//g, '')
    if (!dsn.hostname.endsWith('.sentry.io') || !projectId) return null
    return { host: dsn.hostname, projectId }
  } catch {
    return null
  }
}

async function readBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BYTES) throw new Error('too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const target = sentryTarget()
  if (!target) return res.status(503).end()

  let body
  try {
    body = await readBody(req)
  } catch {
    return res.status(413).end()
  }

  // La primera línea del aviso dice a qué proyecto va: tiene que ser el de SANAT
  try {
    const header = JSON.parse(body.toString('utf8', 0, Math.min(body.length, 4096)).split('\n')[0])
    const dsn = new URL(header.dsn)
    if (dsn.hostname !== target.host || dsn.pathname.replace(/\//g, '') !== target.projectId) {
      return res.status(403).end()
    }
  } catch {
    return res.status(400).end()
  }

  try {
    const upstream = await fetch(`https://${target.host}/api/${target.projectId}/envelope/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body,
    })
    return res.status(upstream.status).end()
  } catch {
    return res.status(502).end()
  }
}
