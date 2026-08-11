const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const controller = require('../controllers/specialDiscountCategoryController');

const router = express.Router();

router.use(protect, admin);

router.get('/', controller.listCategories);
router.post('/', controller.createCategory);
router.patch('/:id', controller.updateCategory);
router.delete('/:id', controller.deleteCategory);

module.exports = router;
