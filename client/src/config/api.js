/** EC2 public IP — used until DNS/SSL for yourelegancestore.in is live */
export const PRODUCTION_SERVER_ORIGIN = 'http://98.81.77.254'

/** Production API — used when VITE_API_BASE_URL is not set */
export const PRODUCTION_API_BASE_URL = `${PRODUCTION_SERVER_ORIGIN}/api`

export const PRODUCTION_API_ORIGIN = PRODUCTION_SERVER_ORIGIN

/**
 * API base URL for axios (must end with /api).
 */
export function getApiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim().replace(/\/+$/, '')
  }
  return PRODUCTION_API_BASE_URL
}

/** Origin for uploads — no /api suffix */
export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/, '').replace(/\/+$/, '') || PRODUCTION_API_ORIGIN
}
