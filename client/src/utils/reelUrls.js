const INSTAGRAM_HOST_RE = /(^|\.)instagram\.com$/i

function cleanUrl(raw) {
  return String(raw || '').trim().replace(/&amp;/g, '&')
}

function extractIframeSrc(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  const match = value.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i)
  return cleanUrl(match?.[1] || value)
}

function parseInstagramParts(raw) {
  const value = cleanUrl(raw)
  if (!value) return null

  try {
    const url = new URL(value)
    if (!INSTAGRAM_HOST_RE.test(url.hostname)) return null
    const parts = url.pathname.split('/').filter(Boolean)
    const typeIndex = parts.findIndex((part) => ['p', 'reel', 'tv'].includes(part.toLowerCase()))
    const type = typeIndex >= 0 ? parts[typeIndex].toLowerCase() : 'reel'
    const code = typeIndex >= 0 ? parts[typeIndex + 1] : parts[0]
    if (!code || code.toLowerCase() === 'embed') return null
    return { type: type === 'tv' ? 'reel' : type, code }
  } catch {
    const match = value.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#\s]+)/i)
    if (!match?.[1] || match[1].toLowerCase() === 'embed') return null
    return { type: 'reel', code: match[1] }
  }
}

export function normalizeInstagramReelUrl(raw) {
  const parts = parseInstagramParts(raw)
  if (!parts) return cleanUrl(raw)
  return `https://www.instagram.com/${parts.type}/${parts.code}/`
}

export function toInstagramEmbedUrl(reelUrl, fallbackEmbedUrl = '') {
  const parts = parseInstagramParts(reelUrl)
  if (parts) return `https://www.instagram.com/${parts.type}/${parts.code}/embed/`

  const fallbackParts = parseInstagramParts(fallbackEmbedUrl)
  if (fallbackParts) return `https://www.instagram.com/${fallbackParts.type}/${fallbackParts.code}/embed/`

  return cleanUrl(fallbackEmbedUrl)
}

export function normalizeInstagramEmbedInput(raw) {
  const value = extractIframeSrc(raw)
  const parts = parseInstagramParts(value)
  if (!parts) return ''
  return `https://www.instagram.com/${parts.type}/${parts.code}/embed/`
}

/** Canonical permalink + iframe embed src for a reel from the API. */
export function getReelEmbedProps(reel) {
  const rawEmbed = reel?.embedUrl || reel?.embed_url || ''
  const rawReel = reel?.reelUrl || reel?.reel_url || ''
  const embedSrc = toInstagramEmbedUrl(rawReel, rawEmbed)
  const permalink = normalizeInstagramReelUrl(rawReel || rawEmbed)
  const isValid = Boolean(embedSrc && permalink && embedSrc.includes('/embed'))
  return { embedSrc, permalink, isValid }
}
