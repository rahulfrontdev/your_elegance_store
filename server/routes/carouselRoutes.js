const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer/multer');
const { protect, admin } = require('../middleware/authMiddleware');
const carousel = require('../controllers/carouselController');

// Public — homepage carousel (active only)
router.get('/', carousel.getActiveCarousel);

// Admin — must be before /:id so "admin" is not captured as id
router.get('/admin/all', protect, admin, carousel.getAllCarouselAdmin);
router.get('/admin/:id', protect, admin, carousel.getCarouselById);

router.post('/', protect, admin, upload.single('image'), carousel.createCarouselSlide);
router.put('/:id', protect, admin, upload.single('image'), carousel.updateCarouselSlide);
router.delete('/:id', protect, admin, carousel.deleteCarouselSlide);

module.exports = router;
