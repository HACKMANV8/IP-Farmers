const rateLimit = require('express-rate-limit');

// 1. Simulate a realistic response delay
// Real servers take time to look up data. This adds a random delay
// to every response to make the server feel real.
const addFakeDelay = (req, res, next) => {
  // Add a random delay between 200ms and 800ms
  const delay = Math.floor(Math.random() * 600) + 200;
  setTimeout(next, delay);
};

// 2. Simulate a realistic rate limiter for login
// This will block an attacker's IP after 5 login attempts,
// making them think the server is secure.
const fakeLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per 15-min window
  message: {
    status: 'error',
    message:
      'Too many login attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
});

module.exports = {
  addFakeDelay,
  fakeLoginLimiter,
};
