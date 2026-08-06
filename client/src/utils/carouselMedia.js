import { resolveMediaUrl } from './mediaUrl'

export function resolveCarouselImageUrl(path) {
  return resolveMediaUrl(path)
}

/** Recommended hero upload specs (see home-hero CSS — aspect-ratio scaling). */
export const HERO_BANNER_SPECS = {
  /** Primary upload size (5:2) — fits desktop/tablet hero without cropping */
  width: 2000,
  height: 800,
  aspectRatio: '5:2',
  aspectRatioLabel: '5:2 (wide banner)',
  formats: 'JPG or WebP',
  maxFileSizeMb: 15,
  safeZone:
    'Keep important content in the center 70%. Upload at 2000×800 (5:2) for best fit on desktop and tablet; mobile uses a taller crop from the center.',
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
    linkUrl: raw.linkUrl || '',
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
