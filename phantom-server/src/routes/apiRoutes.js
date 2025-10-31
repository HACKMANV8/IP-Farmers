const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// --- Fake Authentication Route ---
// A common target for brute-force attacks
router.post('/auth/login', apiController.fakeLogin);
router.post('/auth/register', apiController.fakeRegister);

// --- Fake Data Routes ---
// Mimic real data endpoints to make the honeypot believable
router.get('/users', apiController.getFakeUsers);
router.get('/users/:id', apiController.getFakeUserById);
router.post('/admin/config', apiController.fakeAdminAction);

module.exports = router;
