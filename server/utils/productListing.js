const { sanitizeProductReviewsForPublic } = require('./reviewUtils');

/** Fields needed for storefront cards + pricing (no reviews body, no variations). */
const PRODUCT_LISTING_SELECT =
  'name slug price imageUrl images sku brand category subcategory createdAt rating numReviews';

const productListingPopulate = [
  { path: 'category', select: 'name slug' },
  { path: 'subcategory', select: 'name slug parentId level' },
];

function trimAppliedDiscount(applied) {
  if (!applied || typeof applied !== 'object') return null;
  const name = applied.discountName || applied.name || '';
  if (!name) return null;
  return { discountName: name, name, discountType: applied.discountType || '' };
}

/** Smaller JSON for list/grid endpoints — keeps rating counts, drops review bodies & variations. */
function toPublicListingProduct(product) {
  if (!product || typeof product !== 'object') return product;

  const base = sanitizeProductReviewsForPublic(product);
  const images = Array.isArray(base.images)
    ? base.images.filter((img) => typeof img === 'string' && img.trim()).slice(0, 1)
    : base.imageUrl
      ? [base.imageUrl]
      : [];

  return {
    _id: base._id,
    name: base.name,
    slug: base.slug,
    price: base.price,
    imageUrl: base.imageUrl || images[0] || '',
    images,
    sku: base.sku,
    brand: base.brand,
    category: base.category,
    subcategory: base.subcategory,
    rating: base.rating,
    numReviews: base.numReviews,
    originalPrice: base.originalPrice,
    discountAmount: base.discountAmount,
    discountPercentage: base.discountPercentage,
    discountedPrice: base.discountedPrice,
    hasActiveDiscount: base.hasActiveDiscount,
    appliedDiscount: trimAppliedDiscount(base.appliedDiscount),
    specialDiscountCategory: base.specialDiscountCategory || '',
    createdAt: base.createdAt,
  };
}

function toPublicListingProducts(products = []) {
  return (Array.isArray(products) ? products : []).map(toPublicListingProduct);
}

module.exports = {
  PRODUCT_LISTING_SELECT,
  productListingPopulate,
  toPublicListingProduct,
  toPublicListingProducts,
};
