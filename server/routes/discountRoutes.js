const express = require('express');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { discountPublicLimiter } = require('../middleware/discountRateLimit');
const discountController = require('../controllers/discountController');
const {
  createDiscountSchema,
  updateDiscountSchema,
  patchDiscountStatusSchema,
  validateCartSchema,
  listDiscountQuerySchema,
} = require('../validators/discountValidators');

const router = express.Router();

router.post(
  '/validate',
  optionalProtect,
  discountPublicLimiter,
  validateRequest(validateCartSchema),
  discountController.validate
);
router.post(
  '/calculate',
  optionalProtect,
  discountPublicLimiter,
  validateRequest(validateCartSchema),
  discountController.calculate
);
router.post(
  '/apply',
  optionalProtect,
  discountPublicLimiter,
  validateRequest(validateCartSchema),
  discountController.apply
);

router.get(
  '/',
  protect,
  admin,
  validateRequest(listDiscountQuerySchema, 'query'),
  discountController.list
);
router.post('/', protect, admin, validateRequest(createDiscountSchema), discountController.create);
router.get('/:id/analytics', protect, admin, discountController.analytics);
router.get('/:id', protect, admin, discountController.getById);
router.put('/:id', protect, admin, validateRequest(updateDiscountSchema), discountController.update);
router.patch(
  '/:id/status',
  protect,
  admin,
  validateRequest(patchDiscountStatusSchema),
  discountController.patchStatus
);
router.delete('/:id', protect, admin, discountController.remove);

module.exports = router;
