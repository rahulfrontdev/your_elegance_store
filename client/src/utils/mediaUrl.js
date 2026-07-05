import { getApiOrigin } from '../config/api.js'

export { getApiOrigin }

/**
 * Resolve product/carousel/upload paths to a browser-loadable URL.
 * Strips localhost from stored URLs and uses the production origin.
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return ''

  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('data:')) return trimmed

  const uploadsIdx = trimmed.indexOf('/uploads/')
  if (uploadsIdx >= 0) {
    const relative = trimmed.slice(uploadsIdx)
    const origin = getApiOrigin()
    return origin ? `${origin}${relative}` : relative
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  if (trimmed.startsWith('/')) {
    const origin = getApiOrigin()
    return origin ? `${origin}${trimmed}` : trimmed
  }

  return trimmed
}
