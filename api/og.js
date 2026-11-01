// api/og.js (función de Vercel)
// Link para compartir un perfil: /p/<id>
// WhatsApp, Instagram, etc. leen estas etiquetas para armar la vista previa con
// nombre, descripción e imagen. Las personas son redirigidas al perfil en la app.
// Usa solo la función pública "public_profile_card" (nombre, instrumento, zona, foto).

const SITE_NAME = 'SANAT'
const DEFAULT_IMAGE = '/og-image.jpg'

const escapeHtml = (text) => String(text ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function loadCard(id) {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key || !UUID.test(id)) return null
  try {
    const res = await fetch(`${url}/rest/v1/rpc/public_profile_card`, {
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

export default async function handler(req, res) {
  const id = String(req.query.id || '')
  const origin = `https://${req.headers['x-forwarded-host'] || req.headers.host}`
  const target = UUID.test(id) ? `/perfil/${id}` : '/home'
  const card = await loadCard(id)

  const title = card ? `${card.display_name} en ${SITE_NAME}` : `${SITE_NAME} · Comunidad de músicos de Tucumán`
  const details = card ? [card.instrument, card.localidad].filter(Boolean).join(' · ') : ''
  const bio = card?.bio ? card.bio.slice(0, 140) : ''
  const description = card
    ? [details, bio].filter(Boolean).join(' — ') || 'Mirá su perfil, escuchá cómo suena y escribile.'
    : 'Encontrá banda, sumá integrantes y enterate de shows y jams en Tucumán.'
  // WhatsApp no muestra imágenes WebP: en ese caso usamos la imagen de SANAT
  const avatar = card?.avatar_url && !/\.webp(\?|$)/i.test(card.avatar_url) ? card.avatar_url : null
  const image = avatar || `${origin}${DEFAULT_IMAGE}`

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="es_AR">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(origin + '/p/' + id)}">
<meta property="og:image" content="${escapeHtml(image)}">
${avatar ? '' : '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'}
<meta name="twitter:card" content="${avatar ? 'summary' : 'summary_large_image'}">
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
