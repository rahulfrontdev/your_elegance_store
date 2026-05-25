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
const productUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 8 },
]);

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

