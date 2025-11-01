// api-gateway/src/services/redirectionService.js

const axios = require('axios');

const HONEYPOT_URL = 'https://ip-farmers.onrender.com';

/**
 * Extracts all relevant headers and the client IP for forwarding.
 * @param {object} req - The Express request object.
 * @returns {object} An object containing the forwarding headers.
 */
function getForwardingHeaders(req) {
    // 1. Copy all original headers
    const headers = { ...req.headers };

    // 2. Determine the attacker's original IP
    // The attacker's IP is typically found in:
    // a) req.ip (if 'trust proxy' is set in Express)
    // b) req.socket.remoteAddress (if no proxy)
    // c) X-Forwarded-For (most common header used by proxies)
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 3. Set standard proxy headers to pass the original IP/Host
    // We append the new IP to 'x-forwarded-for' if it already exists, or set it.
    // NOTE: For a honeypot, setting X-Real-IP is crucial for the honeypot to log the actual attacker.
    headers['x-real-ip'] = clientIp.split(',')[0].trim(); // Take the first IP if it's a list
    headers['x-forwarded-for'] = req.headers['x-forwarded-for'] 
        ? `${req.headers['x-forwarded-for']}, ${clientIp}` 
        : clientIp;

    // Prevent issues with keep-alive connections on forwarding
    delete headers['connection'];
    
    // Also remove the host header to ensure the request goes to the honeypot's host.
    delete headers['host']; 

    return headers;
}

/**
 * Manages the silent forwarding of malicious traffic to the honeypot.
 * @param {object} req - The Express request object (from the attacker).
 * @param {object} res - The Express response object (to the attacker).
 */
async function redirectMaliciousTraffic(req, res) {
    try {
        const forwardingHeaders = getForwardingHeaders(req);

        // Construct the full URL for the honeypot, preserving the original path and query
        const honeypotUrl = `${HONEYPOT_URL}${req.originalUrl}`;
        
        // Use axios to make the request to the honeypot
        // This is the core of the Server-Side Reverse Proxy logic
        const response = await axios({
            method: req.method,
            url: honeypotUrl,
            headers: forwardingHeaders,
            data: req.body, // Pass the request body (important for POST/PUT)
            validateStatus: (status) => true, // Resolve on all status codes (don't throw on 4xx/5xx)
        });

        // 4. Send the fake success response (or whatever response the honeypot sent)
        // Back to the attacker.
        // Copy all headers from the honeypot's response back to the attacker's response
        Object.keys(response.headers).forEach(key => {
            // Avoid copying headers that Express/Node should manage (like Transfer-Encoding)
            if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'connection') {
                 res.set(key, response.headers[key]);
            }
        });

        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Redirection Service Error:', error.message);
        
        // In case of a failure (e.g., honeypot is down), send a generic fake success response
        // to maintain the illusion.
        res.status(200).json({ success: true, message: 'Operation completed successfully.' });
    }
}

module.exports = {
    redirectMaliciousTraffic,
};