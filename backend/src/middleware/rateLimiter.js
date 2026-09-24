const rateLimit = require('express-rate-limit');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again in a few moments.',
  },
});

// Strict rate limiter for Flash Sale queue entrance (prevents scripted DDoS / bots)
const flashSaleJoinLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 8, // max 8 queue join attempts per 10s per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'FLASH_SALE_RATE_LIMIT',
    message: 'Too many flash sale join attempts. Please slow down and try again.',
  },
});

module.exports = {
  generalLimiter,
  flashSaleJoinLimiter,
};
