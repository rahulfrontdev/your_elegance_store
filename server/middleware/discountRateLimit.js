const rateLimit = require('express-rate-limit');

/**
 * Rate limit for discount validate/calculate/apply (tunable via env).
 */
const discountPublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.DISCOUNT_RATE_LIMIT_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { discountPublicLimiter };
