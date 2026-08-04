/** Strip any host and return `/uploads/...` so clients resolve the current domain. */
function normalizeMediaPath(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const uploadsIdx = trimmed.indexOf('/uploads/');
  if (uploadsIdx >= 0) return trimmed.slice(uploadsIdx);

  return trimmed;
}

function normalizeProductMedia(product) {
  if (!product || typeof product !== 'object') return product;

  const normalized = { ...product };

  if (normalized.imageUrl) {
    normalized.imageUrl = normalizeMediaPath(normalized.imageUrl);
  }

  if (Array.isArray(normalized.images)) {
    normalized.images = normalized.images.map((img) => normalizeMediaPath(img));
  }

  if (Array.isArray(normalized.variations)) {
    normalized.variations = normalized.variations.map((variation) => {
      if (!variation || typeof variation !== 'object') return variation;
      if (!variation.imageUrl) return variation;
      return { ...variation, imageUrl: normalizeMediaPath(variation.imageUrl) };
    });
  }

  return normalized;
}

function normalizeCarouselSlide(slide) {
  if (!slide || typeof slide !== 'object') return slide;
  if (!slide.imageUrl) return slide;
  return { ...slide, imageUrl: normalizeMediaPath(slide.imageUrl) };
}

module.exports = {
  normalizeMediaPath,
  normalizeProductMedia,
  normalizeCarouselSlide,
};
