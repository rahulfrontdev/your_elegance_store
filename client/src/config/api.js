/** Production site/API origin — used when env vars are missing or invalid in prod builds */
export const PRODUCTION_SERVER_ORIGIN = 'https://yourelegancestore.com'

/** Production API — used when VITE_API_BASE_URL is not set */
export const PRODUCTION_API_BASE_URL = `${PRODUCTION_SERVER_ORIGIN}/api`

export const PRODUCTION_API_ORIGIN = PRODUCTION_SERVER_ORIGIN

const LOCAL_HOST_PATTERN = /localhost|127\.0\.0\.1|0\.0\.0\.0/i
const IPV4_HOST_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/

/** Ignore localhost / raw IP env URLs in production builds (use domain defaults). */
function readEnvUrl(value) {
  if (!value || !String(value).trim()) return ''
  const trimmed = String(value).trim().replace(/\/+$/, '')
  if (!import.meta.env.PROD) return trimmed

  if (LOCAL_HOST_PATTERN.test(trimmed) || /98\.81\.77\.254/.test(trimmed)) {
    return ''
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (LOCAL_HOST_PATTERN.test(parsed.hostname) || IPV4_HOST_PATTERN.test(parsed.hostname)) {
      return ''
    }
  } catch {
    if (/98\.81\.77\.254|localhost|127\.0\.0\.1/i.test(trimmed)) return ''
  }

  return trimmed
}

/**
 * API base URL for axios (must end with /api).
 */
export function getApiBaseUrl() {
  const fromEnv = readEnvUrl(import.meta.env.VITE_API_BASE_URL)
  if (fromEnv) return fromEnv
  return PRODUCTION_API_BASE_URL
}

/** Origin for API host — no /api suffix */
export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/, '').replace(/\/+$/, '') || PRODUCTION_API_ORIGIN
}

/**
 * Origin for /uploads media.
 * Local dev can set VITE_MEDIA_ORIGIN in `.env.local` (gitignored).
 */
export function getMediaOrigin() {
  const fromEnv = readEnvUrl(import.meta.env.VITE_MEDIA_ORIGIN)
  if (fromEnv) return fromEnv
  return getApiOrigin() || PRODUCTION_API_ORIGIN
}
