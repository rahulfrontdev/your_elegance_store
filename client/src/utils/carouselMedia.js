/**
 * Resolve image URL from API (absolute or relative to API origin without /api).
 * @param {string | undefined} path
 */
export function resolveCarouselImageUrl(path) {
  if (!path || typeof path !== 'string') return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const origin = base.replace(/\/api\/?$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${origin}${normalized}`
}

/**
 * Normalize one slide from various API shapes.
 * @param {Record<string, unknown>} raw
 */
export function normalizeCarouselSlide(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = raw._id ?? raw.id
  const image =
    raw.imageUrl ??
    (typeof raw.image === 'string' ? raw.image : undefined) ??
    raw.url ??
    raw.src ??
    raw.fileUrl ??
    ''
  const alt = String(raw.alt ?? raw.title ?? raw.caption ?? 'Banner').trim() || 'Banner'
  if (id == null && !image) return null
  const resolved = typeof image === 'string' ? resolveCarouselImageUrl(image) : ''
  return {
    id: String(id ?? resolved),
    image: resolved,
    alt,
    isActive: raw.isActive !== false && raw.active !== false,
    order: typeof raw.order === 'number' ? raw.order : raw.orderIndex ?? raw.sortOrder,
    raw,
  }
}

function extractSlidesArray(apiData) {
  if (!apiData) return []
  if (Array.isArray(apiData)) return apiData
  if (Array.isArray(apiData.data)) return apiData.data
  if (apiData.data && typeof apiData.data === 'object' && (apiData.data._id || apiData.data.id)) {
    return [apiData.data]
  }
  if ((apiData._id || apiData.id) && !Array.isArray(apiData)) return [apiData]
  if (Array.isArray(apiData.slides)) return apiData.slides
  if (Array.isArray(apiData.items)) return apiData.items
  return []
}

/** Pass `response.data` from axios (or equivalent JSON body). */
export function normalizeCarouselSlideList(apiData) {
  return extractSlidesArray(apiData).map(normalizeCarouselSlide).filter(Boolean)
}
