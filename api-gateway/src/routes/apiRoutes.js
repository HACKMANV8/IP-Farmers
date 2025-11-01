// api-gateway/src/routes/apiRoutes.js

const express = require('express');
const { redirectMaliciousTraffic } = require('../services/redirectionService');

const router = express.Router();

// The catch-all route that redirects all traffic (GET, POST, etc.)
// to the honeypot via the redirection service.
// The '*' pattern ensures it catches any path.
router.all('*', redirectMaliciousTraffic);

module.exports = router;