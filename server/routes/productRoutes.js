const express = require('express');
const {
  createProduct,
  getProducts,
  getLatestProducts,
  getProductsByCategory,
  getBestDealProducts,
  getGstRates,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer/multer');

/**
 * Allowed multipart file fields for products.
 * Variation images are sent under `images` after gallery extras (see extraImageCount).
 * `variationImages` is kept for backward compatibility with older clients.
 */
const productUploadMiddleware = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 58 },
  { name: 'variationImages', maxCount: 50 },
]);

const productUpload = (req, res, next) => {
  productUploadMiddleware(req, res, (err) => {
    if (err) {
      const field = err.field ? ` "${err.field}"` : '';
      return res.status(400).json({
        success: false,
        message:
          err.code === 'LIMIT_UNEXPECTED_FILE' || err.message === 'Unexpected field'
            ? `Unexpected upload field${field}. Allowed file fields: image, images.`
            : err.message || 'Upload failed',
      });
    }
    next();
  });
};

const router = express.Router();

router.get('/', getProducts);
router.get('/latest', getLatestProducts);
router.get('/best-deals', getBestDealProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/gst-rates', getGstRates);
router.get('/:id', getProductById);
router.post('/', protect, admin, productUpload, createProduct);
router.put('/:id', protect, admin, productUpload, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
