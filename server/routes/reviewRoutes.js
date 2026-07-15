const express = require('express');
const { getReviews, moderateReview } = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, admin);

router.route('/').get(getReviews);
router.route('/:productId/:reviewId').patch(moderateReview);

module.exports = router;
