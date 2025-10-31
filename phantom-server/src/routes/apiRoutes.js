// apiRoutes.js: Defines all the fake endpoints for the honeypot
const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// --- Authentication Traps (POST/Login uses rate-limiter in server.js) ---
router.post('/auth/login', apiController.fakeLogin);
router.post('/auth/register', apiController.fakeRegister);
router.post('/auth/token/refresh', apiController.fakeTokenRefresh); // New Token Refresh Trap

// --- User/Profile Traps ---
router.get('/users', apiController.getFakeUsers);
router.get('/users/:id', apiController.getFakeUserById);
router.get('/profile/me', apiController.getFakeProfile);
router.post('/profile/update', apiController.updateFakeProfile);

// --- Data Traps ---
router.get('/products', apiController.getFakeProducts);

// --- Admin/High-Value Traps ---
router.post('/admin/config', apiController.fakeAdminAction); // Fake action to log intent
router.get('/admin/logs', apiController.getFakeAdminLogs);

// --- Financial Traps ---
router.get('/billing/subscription', apiController.getFakeSubscription);
router.get('/billing/invoices', apiController.getFakeInvoices);

// --- Infrastructure Traps ---
router.get('/internal/health', apiController.getFakeHealth);

// --- File System Traps (The RCE/Malware Trap) ---
router.post('/upload/file', apiController.fakeFileUpload);

// --- The Catch-All Route (Logs EVERY failed attempt) ---
router.all('*', (req, res) => {
  // This route catches anything that did not match the routes above.
  // We still log the attempt because it is suspicious activity.
  apiController.logAttempt(req);

  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}. Resource not found.`,
    tip: 'The requested resource could not be found on this server.',
  });
});

module.exports = router;
