/**
 * API origin without /api suffix — e.g. http://localhost:8000
 */
export function getApiOrigin() {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  return String(base).replace(/\/api\/?$/, '').replace(/\/+$/, '')
}

/**
 * Resolve product/carousel/upload paths to a browser-loadable URL.
 * In dev, `/uploads/...` uses the Vite proxy so images work on localhost and LAN IPs.
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return ''

  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('data:')) return trimmed

  const uploadsIdx = trimmed.indexOf('/uploads/')
  if (uploadsIdx >= 0) {
    const relative = trimmed.slice(uploadsIdx)
    if (import.meta.env.DEV) return relative
    return `${getApiOrigin()}${relative}`
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  if (trimmed.startsWith('/')) {
    if (import.meta.env.DEV) return trimmed
    return `${getApiOrigin()}${trimmed}`
  }

  return trimmed
}
