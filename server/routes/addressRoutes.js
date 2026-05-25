const express = require('express');
const addressController = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');
const sanitizeRequest = require('../middleware/sanitizeRequest');
const validateObjectId = require('../middleware/validateObjectId');
const validateRequest = require('../middleware/validateRequest');
const {
  createAddressSchema,
  updateAddressSchema,
  listAddressQuerySchema,
} = require('../validations/addressValidation');

const router = express.Router();

// All address APIs require JWT auth. `protect` sets the logged-in user on req.user.
router.use(protect);
router.use(sanitizeRequest);

router
  .route('/')
  .post(validateRequest(createAddressSchema), addressController.addAddress)
  .get(validateRequest(listAddressQuerySchema, 'query'), addressController.getAddresses);

router
  .route('/:id')
  .get(validateObjectId('id'), addressController.getAddressById)
  .put(validateObjectId('id'), validateRequest(updateAddressSchema), addressController.updateAddress)
  .delete(validateObjectId('id'), addressController.deleteAddress);

router.patch('/:id/default', validateObjectId('id'), addressController.setDefaultAddress);

module.exports = router;
