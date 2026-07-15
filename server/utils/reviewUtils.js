const APPROVED = 'approved';
const PENDING = 'pending';
const REJECTED = 'rejected';

const REVIEW_STATUSES = [PENDING, APPROVED, REJECTED];

/** Legacy reviews without status are treated as approved (already public). */
const getReviewStatus = (review) => {
  const status = String(review?.status || APPROVED).trim().toLowerCase();
  return REVIEW_STATUSES.includes(status) ? status : APPROVED;
};

const isApprovedReview = (review) => getReviewStatus(review) === APPROVED;

const getApprovedReviews = (reviews = []) =>
  (Array.isArray(reviews) ? reviews : []).filter(isApprovedReview);

const recalculateApprovedRating = (product) => {
  const approved = getApprovedReviews(product.reviews);
  product.numReviews = approved.length;
  product.rating =
    approved.length === 0
      ? 0
      : Number(
          (
            approved.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
            approved.length
          ).toFixed(2)
        );
  return product;
};

/** Strip non-approved reviews from a public product payload. */
const sanitizeProductReviewsForPublic = (product) => {
  if (!product || typeof product !== 'object') return product;
  const approved = getApprovedReviews(product.reviews);
  const rating =
    approved.length === 0
      ? 0
      : Number(
          (
            approved.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
            approved.length
          ).toFixed(2)
        );

  return {
    ...product,
    reviews: approved,
    numReviews: approved.length,
    rating,
  };
};

const sanitizeProductsReviewsForPublic = (products = []) =>
  (Array.isArray(products) ? products : []).map(sanitizeProductReviewsForPublic);

module.exports = {
  APPROVED,
  PENDING,
  REJECTED,
  REVIEW_STATUSES,
  getReviewStatus,
  isApprovedReview,
  getApprovedReviews,
  recalculateApprovedRating,
  sanitizeProductReviewsForPublic,
  sanitizeProductsReviewsForPublic,
};
