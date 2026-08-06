import { resolveMediaUrl } from './mediaUrl'

const VARIANT_PATTERN = /-(thumb|medium|large)\.webp$/i

/**
 * Derive responsive variant paths from an optimized upload URL.
 * Legacy JPG/PNG uploads return the same URL for every size.
 */
export function getResponsiveVariants(url) {
  const resolved = resolveMediaUrl(url)
  if (!resolved) {
    return { thumb: '', medium: '', large: '', src: '' }
  }

  if (VARIANT_PATTERN.test(resolved)) {
    const thumb = resolved.replace(VARIANT_PATTERN, '-thumb.webp')
    const medium = resolved.replace(VARIANT_PATTERN, '-medium.webp')
    const large = resolved.replace(VARIANT_PATTERN, '-large.webp')
    return { thumb, medium, large, src: medium }
  }

  return { thumb: resolved, medium: resolved, large: resolved, src: resolved }
}

export function buildSrcSet(variants, widths = { thumb: 400, medium: 800, large: 1600 }) {
  const parts = []
  if (variants.thumb) parts.push(`${variants.thumb} ${widths.thumb}w`)
  if (variants.medium && variants.medium !== variants.thumb) {
    parts.push(`${variants.medium} ${widths.medium}w`)
  }
  if (variants.large && variants.large !== variants.medium) {
    parts.push(`${variants.large} ${widths.large}w`)
  }
  if (parts.length <= 1) return undefined
  return parts.join(', ')
}

/** Carousel banners: medium 1200w, large 2000w */
export function buildHeroSrcSet(variants) {
  const parts = []
  if (variants.medium) parts.push(`${variants.medium} 1200w`)
  if (variants.large && variants.large !== variants.medium) {
    parts.push(`${variants.large} 2000w`)
  }
  if (parts.length <= 1) return undefined
  return parts.join(', ')
}

export const CARD_IMAGE_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
export const DETAIL_IMAGE_SIZES = '(max-width: 1024px) 90vw, 480px'
export const CART_THUMB_SIZES = '64px'
export const CATEGORY_IMAGE_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
export const HERO_IMAGE_SIZES = '100vw'
