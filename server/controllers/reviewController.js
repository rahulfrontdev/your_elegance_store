const mongoose = require('mongoose');
const Product = require('../models/Product');
const {
  APPROVED,
  PENDING,
  REJECTED,
  REVIEW_STATUSES,
  getReviewStatus,
  recalculateApprovedRating,
} = require('../utils/reviewUtils');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const serializeReview = (product, review) => ({
  _id: review._id,
  productId: product._id,
  productName: product.name,
  productSku: product.sku || '',
  productImage: product.imageUrl || '',
  user: review.user,
  name: review.name,
  rating: review.rating,
  comment: review.comment || '',
  status: getReviewStatus(review),
  orderId: review.orderId || null,
  moderatedAt: review.moderatedAt || null,
  moderatedBy: review.moderatedBy || null,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

/**
 * GET /api/reviews
 * Query: status=pending|approved|rejected|all (default pending)
 *        q=search product/customer/comment
 */
const getReviews = async (req, res) => {
  try {
    const statusFilter = String(req.query.status || PENDING).trim().toLowerCase();
    const search = String(req.query.q || '').trim();

    if (statusFilter !== 'all' && !REVIEW_STATUSES.includes(statusFilter)) {
      return res.status(400).json({
        message: 'status must be pending, approved, rejected, or all',
      });
    }

    const products = await Product.find({ 'reviews.0': { $exists: true } })
      .select('name sku imageUrl reviews')
      .lean();

    let reviews = [];
    for (const product of products) {
      for (const review of product.reviews || []) {
        const status = getReviewStatus(review);
        if (statusFilter !== 'all' && status !== statusFilter) continue;
        reviews.push(serializeReview(product, { ...review, status }));
      }
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      reviews = reviews.filter(
        (item) =>
          regex.test(item.productName || '') ||
          regex.test(item.name || '') ||
          regex.test(item.comment || '') ||
          regex.test(String(item.productSku || ''))
      );
    }

    reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const counts = { pending: 0, approved: 0, rejected: 0 };
    for (const product of products) {
      for (const review of product.reviews || []) {
        const status = getReviewStatus(review);
        if (counts[status] != null) counts[status] += 1;
      }
    }

    return res.json({
      success: true,
      count: reviews.length,
      counts,
      data: reviews,
    });
  } catch (error) {
    console.error('Get reviews error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PATCH /api/reviews/:productId/:reviewId
 * Body: { status: 'approved' | 'rejected' }
 */
const moderateReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const nextStatus = String(req.body?.status || '').trim().toLowerCase();

    if (!isValidObjectId(productId) || !isValidObjectId(reviewId)) {
      return res.status(400).json({ message: 'Invalid product or review id' });
    }

    if (![APPROVED, REJECTED].includes(nextStatus)) {
      return res.status(400).json({ message: 'status must be approved or rejected' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.status = nextStatus;
    review.moderatedAt = new Date();
    review.moderatedBy = req.user._id;

    recalculateApprovedRating(product);
    await product.save();

    return res.json({
      success: true,
      message: nextStatus === APPROVED ? 'Review approved' : 'Review rejected',
      data: serializeReview(product, review),
    });
  } catch (error) {
    console.error('Moderate review error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getReviews,
  moderateReview,
  PENDING,
  APPROVED,
  REJECTED,
};
