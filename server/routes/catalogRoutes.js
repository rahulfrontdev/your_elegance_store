const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const catalogController = require('../controllers/catalogController');

const router = express.Router();

router.use(protect, admin);

router.route('/').get(catalogController.listCatalogs).post(catalogController.createCatalog);
router
  .route('/:id')
  .get(catalogController.getCatalog)
  .put(catalogController.updateCatalog)
  .delete(catalogController.deleteCatalog);

module.exports = router;
