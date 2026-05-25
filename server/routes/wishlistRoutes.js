const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const wishlistController = require('../controllers/wishlistController');

const router = express.Router();

router.get('/', protect, wishlistController.getWishlist);
router.get('/:productId/status', protect, wishlistController.getWishlistStatus);
router.post('/:productId', protect, wishlistController.addToWishlist);
router.post('/toggle/:productId', protect, wishlistController.toggleWishlist);
router.delete('/', protect, wishlistController.clearWishlist);
router.delete('/:productId', protect, wishlistController.removeFromWishlist);

module.exports = router;

