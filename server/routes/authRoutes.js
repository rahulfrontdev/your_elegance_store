const express = require('express');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { forgotPasswordLimiter } = require('../middleware/authRateLimit');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);

module.exports = router;
