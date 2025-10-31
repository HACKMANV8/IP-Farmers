const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// --- Authentication Routes ---
router.post('/auth/login', apiController.fakeLogin);
router.post('/auth/register', apiController.fakeRegister);

// --- User Data Routes ---
router.get('/users', apiController.getFakeUsers);
router.get('/users/:id', apiController.getFakeUserById);

// --- Profile Routes ---
router.get('/profile/me', apiController.getFakeProfile);
router.post('/profile/update', apiController.updateFakeProfile);

// --- Data/Business Logic Routes ---
router.get('/products', apiController.getFakeProducts);

// --- Fake Admin Routes (High-Value Target) ---
router.get('/admin/logs', apiController.getFakeAdminLogs);
router.post('/admin/config', apiController.fakeAdminAction);

// --- Fake Billing Routes (Very High-Value Targets) ---
router.get('/billing/subscription', apiController.getFakeSubscription);
router.get('/billing/invoices', apiController.getFakeInvoices);

// --- Fake Internal Routes (Looks sensitive) ---
router.get('/internal/health', apiController.getFakeHealth);

// --- Catch-all Route ---
// This is the last route. Any request that doesn't match the ones above
// will be caught here.
router.all('*', (req, res) => {
  // --- THIS IS THE FIX ---
  // Now we can call the exported logAttempt function
  apiController.logAttempt(req);
  // --- END OF FIX ---

  // Send a standard 404 "Not Found" response
  const message = `Cannot ${req.method} ${req.originalUrl}`;
  res.status(404).json({
    status: 'error',
    message: message,
  });
});

module.exports = router;

