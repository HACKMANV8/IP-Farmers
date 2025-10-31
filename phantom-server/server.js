const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./src/routes/apiRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Set a port for this server, distinct from the main API
const PORT = process.env.PHANTOM_PORT || 8080;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies

// --- HONEYPOT ROUTE ---
// All fake API traffic will be prefixed with /api
app.use('/api', apiRoutes);

// --- CATCH-ALL TRAP ---
// A catch-all route to log any other suspicious requests
// that don't match your fake routes.
app.use('*', (req, res) => {
  console.log(
    `[HONEYPOT-TRAP] Caught unhandled request: ${req.method} ${req.originalUrl} from IP: ${req.ip}`
  );
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist.',
  });
});

app.listen(PORT, () => {
  console.log(`🍯 HONEYPOT Server listening on port ${PORT}`);
  console.log('Redirecting all suspicious traffic here...');
});