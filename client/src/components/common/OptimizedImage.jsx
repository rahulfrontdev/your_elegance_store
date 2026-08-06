import {
  buildHeroSrcSet,
  buildSrcSet,
  CARD_IMAGE_SIZES,
  CART_THUMB_SIZES,
  CATEGORY_IMAGE_SIZES,
  DETAIL_IMAGE_SIZES,
  getResponsiveVariants,
  HERO_IMAGE_SIZES,
} from '../../utils/responsiveImage'

const PRESET_DEFAULTS = {
  card: { sizes: CARD_IMAGE_SIZES, variant: 'medium', build: buildSrcSet },
  detail: { sizes: DETAIL_IMAGE_SIZES, variant: 'large', build: buildSrcSet },
  thumb: { sizes: CART_THUMB_SIZES, variant: 'thumb', build: buildSrcSet },
  category: { sizes: CATEGORY_IMAGE_SIZES, variant: 'medium', build: buildSrcSet },
  hero: { sizes: HERO_IMAGE_SIZES, variant: 'large', build: buildHeroSrcSet },
}

/**
 * Optimized product/media image with lazy loading and responsive srcset when available.
 */
export default function OptimizedImage({
  src,
  alt = '',
  preset = 'card',
  loading = 'lazy',
  fetchPriority,
  className = '',
  sizes,
  variant,
  onError,
  ...rest
}) {
  const config = PRESET_DEFAULTS[preset] || PRESET_DEFAULTS.card
  const variants = getResponsiveVariants(src)
  const chosenVariant = variant || config.variant
  const imgSrc = variants[chosenVariant] || variants.src || variants.medium
  const srcSet = config.build ? config.build(variants) : buildSrcSet(variants)

  if (!imgSrc) return null

  return (
    <img
      src={imgSrc}
      srcSet={srcSet}
      sizes={sizes || config.sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      className={className}
      onError={onError}
      {...rest}
    />
  )
}
