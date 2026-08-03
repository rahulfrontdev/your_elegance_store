import { getMediaOrigin, PRODUCTION_SERVER_ORIGIN } from '../config/api.js'

export { getMediaOrigin as getApiOrigin }

/**
 * Resolve product/carousel/upload paths to a browser-loadable URL.
 * Always uses the configured media origin (production domain on deploy).
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return ''

  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('data:')) return trimmed

  const uploadsIdx = trimmed.indexOf('/uploads/')
  if (uploadsIdx >= 0) {
    const relative = trimmed.slice(uploadsIdx)
    const origin = getMediaOrigin() || PRODUCTION_SERVER_ORIGIN
    return `${origin}${relative}`
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  if (trimmed.startsWith('/')) {
    const origin = getMediaOrigin() || PRODUCTION_SERVER_ORIGIN
    return `${origin}${trimmed}`
  }

  return trimmed
}
