// api/og.js (función de Vercel)
// Links para compartir: /p/<id> (perfil), /b/<id> (banda), /e/<id> (evento).
// WhatsApp, Instagram, etc. leen estas etiquetas para armar la vista previa con
// título, descripción e imagen. Las personas son redirigidas a la página en la app.
// Usa solo funciones públicas de Supabase que devuelven datos resumidos.

const SITE_NAME = 'SANAT'
const DEFAULT_IMAGE = '/og-image.jpg'
const TIME_ZONE = 'America/Argentina/Tucuman'

const escapeHtml = (text) => String(text ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const EVENT_LABELS = { show: 'Show', jam: 'Jam', ensayo: 'Ensayo abierto', otro: 'Evento' }

// Qué función pública consultar, a dónde llevar a la persona y cómo se ve cada tipo
const TYPES = {
  profile: { rpc: 'public_profile_card', path: 'p', target: (id) => `/perfil/${id}`, ogType: 'profile' },
  band: { rpc: 'public_band_card', path: 'b', target: (id) => `/banda/${id}`, ogType: 'website' },
  event: { rpc: 'public_event_card', path: 'e', target: (id) => `/home?seccion=eventos&evento=${id}`, ogType: 'website' },
}

async function loadCard(rpc, id) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key || !UUID.test(id)) return null
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${rpc}`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_id: id }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data[0] || null : data
  } catch {
    return null
  }
}

// WhatsApp no muestra imágenes WebP: en ese caso se usa la imagen de SANAT
const usableImage = (url) => (url && !/\.webp(\?|$)/i.test(url) ? url : null)

export function describe(type, card) {
  if (!card) {
    return { title: `${SITE_NAME} · Comunidad de músicos de Tucumán`, description: 'Encontrá banda, sumá integrantes y enterate de shows y jams en Tucumán.', image: null }
  }
  if (type === 'band') {
    const details = [card.genres, card.localidad, card.members ? `${card.members} integrante${card.members === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · ')
    const looking = card.looking ? `Buscan: ${card.looking}` : ''
    return {
      title: `${card.name} · Banda en ${SITE_NAME}`,
      description: [details, looking, card.bio].filter(Boolean).join(' — ') || 'Conocé la banda, escuchá a sus integrantes y postulate.',
      image: usableImage(card.logo_url),
    }
  }
  if (type === 'event') {
    const when = card.starts_at
      ? new Date(card.starts_at).toLocaleString('es-AR', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false })
      : ''
    const place = [card.place, card.departamento].filter(Boolean).join(', ')
    return {
      title: `${EVENT_LABELS[card.event_type] || 'Evento'}: ${card.title}`,
      description: [when && `${when} hs`, place, card.band_name && `con ${card.band_name}`, card.description].filter(Boolean).join(' — '),
      image: null,
    }
  }
  const details = [card.instrument, card.localidad].filter(Boolean).join(' · ')
  return {
    title: `${card.display_name} en ${SITE_NAME}`,
    description: [details, card.bio ? card.bio.slice(0, 140) : ''].filter(Boolean).join(' — ') || 'Mirá su perfil, escuchá cómo suena y escribile.',
    image: usableImage(card.avatar_url),
  }
}

export default async function handler(req, res) {
  const id = String(req.query.id || '')
  const type = TYPES[String(req.query.type || 'profile')] ? String(req.query.type || 'profile') : 'profile'
  const conf = TYPES[type]
  const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`
  const target = UUID.test(id) ? conf.target(id) : '/home'
  const card = await loadCard(conf.rpc, id)
  const { title, description, image: ownImage } = describe(type, card)
  const image = ownImage || `${origin}${DEFAULT_IMAGE}`

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="${conf.ogType}">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="es_AR">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(`${origin}/${conf.path}/${id}`)}">
<meta property="og:image" content="${escapeHtml(image)}">
${ownImage ? '' : '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'}
<meta name="twitter:card" content="${ownImage ? 'summary' : 'summary_large_image'}">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<meta http-equiv="refresh" content="0;url=${escapeHtml(target)}">
</head>
<body style="background:#0f0f0f;color:#fff;font-family:sans-serif">
<p>Abriendo <a href="${escapeHtml(target)}" style="color:#c4b5fd">${escapeHtml(title)}</a>…</p>
<script>location.replace(${JSON.stringify(target)})</script>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400')
  res.status(200).send(html)
}
