// --- HONEYPOT RELAY SERVICE (The Teleporter's Code) ---

const axios = require('axios');
// NOTE: AttackLog model is passed via function argument from server.js

// The live deployed URL for Vansh's honeypot server
// This should be set in Prakhar's .env file as HONEYPOT_URL
const HONEYPOT_BASE_URL = process.env.HONEYPOT_URL || 'https://ip-farmers.onrender.com';

/**
 * Executes the core relay logic: proxies the malicious request to the honeypot,
 * intercepts the secret header, and saves the forensic data to MongoDB.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {string} attackType - The type of attack detected (e.g., 'SQL Injection')
 * @param {object} AttackLog - Mongoose model for Attack Logs
 */
async function relayAndLog(req, res, attackType, AttackLog) {
    // Note: Mongoose connection setup code should be in Prakhar's main server.js

    try {
        // 1. Build the target URL for the honeypot (FIX: Using backticks for string interpolation)
        const honeypotTarget = `${HONEYPOT_BASE_URL}${req.originalUrl}`;

        // 2. Secretly forward the request to the honeypot
        const honeypotResponse = await axios({
            method: req.method,
            url: honeypotTarget,
            // CRITICAL: Forwards original headers for deep logging
            headers: req.headers,
            data: req.body,
            // Accept all status codes from the honeypot (200, 201, 429, etc.)
            validateStatus: () => true, 
        });

        // 3. INTERCEPT THE SECRET DATA HEADER (X-Honeypot-Data)
        const honeypotDataHeader = honeypotResponse.headers['x-honeypot-data'];

        if (honeypotDataHeader) {
            // Parse the JSON data sent back from Vansh's honeypot
            const attackData = JSON.parse(honeypotDataHeader);

            // 4. SAVE THE STRUCTURED DATA TO MONGODB
            const logEntry = new AttackLog({
                // Extract data from the honeypot's structured response
                sessionId: attackData.sessionId,
                attackType: attackData.attackType, // Use classification from honeypot
                severity: attackData.severity,
                ipAddress: attackData.ipAddress,
                location: attackData.location,
                userAgent: attackData.userAgent,
                latencyMs: attackData.latencyMs,
                targetUrl: attackData.targetUrl,
                httpMethod: attackData.httpMethod,
                payloadAnalysis: attackData.payloadAnalysis,
                fullPayload: attackData.payload,
                fullHeaders: attackData.headers,
                timestamp: new Date(attackData.timestamp), // Convert ISO string back to Date object
            });
            await logEntry.save();
            console.log([ATTACK LOGGED] Severity: ${attackData.severity}, Session: ${attackData.sessionId});
        }

        // 5. Send the honeypot's response back to the attacker (The deception continues)
        res.status(honeypotResponse.status).json(honeypotResponse.data);

    } catch (error) {
        console.error("Relay Error:", error.message);
        // Fallback: send a generic error so the hacker doesn't get suspicious
        res.status(503).json({ status: 'error', message: 'Service Unavailable' });
    }
}

module.exports = { relayAndLog };