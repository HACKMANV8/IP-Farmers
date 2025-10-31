const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./src/routes/apiRoutes');

// --- NEW ---
// Import your new middleware from the file you just created
const {
  addFakeDelay,
  fakeLoginLimiter,
} = require('./src/middleware/honeypotUtils');
// --- END NEW ---

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- Global Middleware ---
app.use(cors());
app.use(express.json());

// --- NEW ---
// Use the fake delay on ALL routes. Now your server will feel
// like it's doing real work (checking a database, etc.).
app.use(addFakeDelay);
// --- END NEW ---

// --- Routes ---

// --- NEW ---
// Apply the rate limiter *only* to the login route.
// This simulates a real brute-force-attack defense.
app.use('/api/auth/login', fakeLoginLimiter);
// --- END NEW ---

// This handles all your other routes
app.use('/api', apiRoutes);

// --- Root Endpoint ---
app.get('/', (req, res) => {
  res.send('This is the phantom server. Access denied.');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🍯 HONEYPOT Server listening on port ${PORT}`);
  console.log(
    'Redirecting all suspicious traffic here... (UPGRADED: Now with fake rate limits and delays)'
  );
});
