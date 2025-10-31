// server.js: Entry point for the Phantom Honeypot Server
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const apiRoutes = require('./src/routes/apiRoutes');
const { addFakeDelay } = require('./src/middleware/honeypotUtils');
const rateLimit = require('express-rate-limit');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// --- Honeypot Security & Forensics ---
// 1. Add Fake Defense: Rate Limiter (Max 5 attempts per 15 min on login)
const fakeLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'error',
        message: 'Too many login attempts from this IP, please try again after 15 minutes',
    },
});

// --- Middleware Setup ---
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// --- Apply Middleware to Routes ---
// 1. Apply rate limiting only to authentication endpoints
app.use('/api/auth/login', fakeLoginLimiter);

// 2. Apply fake delay and routing to all API endpoints
app.use('/api', addFakeDelay, apiRoutes);

// --- Health Check / Root Route (FIX FOR DEPLOYMENT) ---
// This ensures the root path serves a definitive "running" status for cloud hosts.
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'Honeypot Server',
        message: 'Trap is deployed and waiting.',
        version: '1.0'
    });
});
// ----------------------------------------------------

// --- Server Start ---
app.listen(port, () => {
    console.log(`🍯 HONEYPOT Server listening on port ${port}`);
    console.log(`Redirecting all suspicious traffic here... (UPGRADED: Now with fake rate limits and delays)`);
});
