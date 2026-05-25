const express = require('express');
const {
  createOrder,
  verifyPayment,
  getOrderById,
  getAllOrders,
  getOrdersByUser,
  getMyOrderDetails,
  cancelMyOrder,
  updateOrderStatusByAdmin,
  addProductReview,
} = require('../controllers/orderController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', optionalProtect, createOrder);
router.post('/verify-payment', verifyPayment);
router.post('/:orderId/review', protect, addProductReview);
router.patch('/:id/cancel', protect, cancelMyOrder);
router.get('/my/:id', protect, getMyOrderDetails);
router.get('/user/:userId', protect, getOrdersByUser);
router.get('/admin/all', protect, admin, getAllOrders);
router.patch('/admin/:id/status', protect, admin, updateOrderStatusByAdmin);
router.get('/:id', optionalProtect, getOrderById);

module.exports = router;

