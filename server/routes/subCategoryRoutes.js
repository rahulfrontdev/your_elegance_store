const express = require('express');
const router = express.Router();

const {
  createSubCategory,
  getSubCategories,
  getSubByCategory,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
} = require('../controllers/subCategoryController');

router.post('/', createSubCategory);
router.get('/getAll', getSubCategories);
router.get('/category/:categoryId', getSubByCategory);
router.get('/subcategory/:id', getSubCategoryById);
router.delete('/subcategory/:id', deleteSubCategory);
router.put('/subcategory/:id', updateSubCategory);

module.exports = router;
