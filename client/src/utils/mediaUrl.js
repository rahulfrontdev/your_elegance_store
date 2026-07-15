import { getMediaOrigin, PRODUCTION_SERVER_ORIGIN } from '../config/api.js'

export { getMediaOrigin as getApiOrigin }

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

/**
 * Resolve product/carousel/upload paths to a browser-loadable URL.
 * Relative and localhost /uploads paths use VITE_MEDIA_ORIGIN (or the API origin).
 * Absolute remote upload URLs (e.g. EC2) are kept as-is.
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return ''

  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('data:')) return trimmed

  const uploadsIdx = trimmed.indexOf('/uploads/')
  if (uploadsIdx >= 0) {
    const relative = trimmed.slice(uploadsIdx)

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const parsed = new URL(trimmed)
        if (!LOCAL_HOSTS.has(parsed.hostname.toLowerCase())) {
          return `${parsed.origin}${relative}`
        }
      } catch {
        // fall through
      }
    }

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
