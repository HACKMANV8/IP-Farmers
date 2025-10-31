// --- API GATEWAY & ATTACK DETECTION LAYER (The Keeper) ---

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables (like MONGO_URI)

const app = express();
const port = process.env.PORT || 5000; // Running on port 5000

// Project Imports (Schema and Relay Service)
const AttackLog = require('./src/models/AttackLog'); 
const { relayAndLog } = require('./src/services/honeypotRelay'); 

// Middleware Setup
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// --- 1. MONGODB CONNECTION (Prakhar's Keeper Task) ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackathon_db'; // Use a default for testing

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected for Attack Logging'))
    .catch(err => console.error('MongoDB Connection Error:', err));


// --- 2. THE SENTINEL'S DETECTION MIDDLEWARE ---
// This middleware runs on all /api routes and checks for malicious payloads.

app.use('/api/*', (req, res, next) => {
    // Check request body for known attack patterns (Sentinel's job)
    const bodyContent = JSON.stringify(req.body);
    const isSqlInjection = bodyContent.includes("' OR '1'='1") || bodyContent.includes("--");
    const isXssAttempt = bodyContent.includes('<script>');

    if (isSqlInjection || isXssAttempt) {
        // Attack Detected: Log and Relay
        console.log('--- CRITICAL ATTACK DETECTED! RELAYING TRAFFIC... ---');
        
        // Define the simple attack type for the log entry
        const attackType = isSqlInjection ? 'SQL Injection' : 'XSS Attempt';

        // Call the Teleporter's relay function, passing the AttackLog model
        // This function will proxy the request, save the data to MongoDB, and deceive the hacker.
        return relayAndLog(req, res, attackType, AttackLog); 
    }

    // If safe, continue to the real business logic
    next();
});

// --- 3. EXAMPLE REAL API ROUTE (Runs only if attack is NOT detected) ---

// This is the real login path (Safe path)
app.post('/api/auth/login', (req, res) => {
    // If the request makes it here, it means it passed the Sentinel's check.
    // Prakhar would put the real database login logic here.
    res.status(200).json({ status: 'success', message: 'Login validated and successful (non-malicious path).' });
});

// Start the server
app.listen(port, () => {
    // --- FIX APPLIED HERE ---
    console.log(`API Gateway running on port ${port}`);
});