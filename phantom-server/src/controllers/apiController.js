// Import Node.js built-in modules for file system and path
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto'); // For UUID/Session ID generation

// Helper function to classify the attack type based on request path and body
const classifyAttack = (req) => {
    let type = 'Reconnaissance';
    let severity = 'LOW';
    let analysis = 'N/A';

    const path = req.originalUrl.toLowerCase();
    const body = JSON.stringify(req.body);

    // 1. Critical Execution / RCE Check (High Priority)
    if (path.includes('/upload/') || path.includes('/exec')) {
        severity = 'CRITICAL';
        type = 'Code Execution / File Upload';
        if (body.includes('<?php') || body.includes('bash') || body.includes('system(')) {
            analysis = 'Confirmed Malicious Code (Web Shell/RCE)';
        } else {
            analysis = 'File Upload Attempt (High Risk)';
        }
    }
    // 2. Financial/High-Value Data Check (High Priority)
    else if (path.includes('/billing/') || path.includes('/payment') || path.includes('/invoice')) {
        severity = 'HIGH';
        type = 'Financial Reconnaissance';
        analysis = 'Targeting Billing and Financial Data';
    }
    // 3. Admin/Config Access (Medium Priority)
    else if (path.includes('/admin/') || path.includes('/config') || path.includes('/logs')) {
        severity = 'MEDIUM';
        type = 'Administrative Reconnaissance';
        analysis = 'Targeting Internal System Logs/Settings';
    }
    // 4. SQL/XSS Injection Syntax Check
    else if (body.includes(' or ') || body.includes('--') || body.includes('<script')) {
        severity = 'HIGH';
        type = 'Injection Attempt';
        analysis = body.includes('<script') ? 'XSS Payload Found' : 'SQL Syntax Found';
    }
    // 5. Brute Force / Session Start
    else if (path.includes('/login') || path.includes('/register') || path.includes('/auth')) {
        severity = 'MEDIUM';
        type = 'Brute Force / Session Start';
        analysis = 'Repeated Auth Attempt';
    }

    return { type, severity, analysis };
};

// New function to write to our log file (modified for cloud readiness)
const logToFile = (message) => {
    const timestamp = new Date().toLocaleString();
    const logMessage = `${timestamp} - ${message}\n`;

    // In a cloud environment (Render), we log to stdout, which Render captures.
    console.log(logMessage);

    // If you were on a local machine, you would use this for local file persistence:
    // fs.appendFile(logFilePath, logMessage, (err) => { ... });
};

// --- MODIFIED: logAttempt is now an async function that RETURNS the log data ---
const logAttempt = async (req) => {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const sessionId = req.headers['x-fake-session-id'] || 'N/A'; // Capture Fake Session ID
    const latency = req.requestStart ? (Date.now() - req.requestStart) : 'N/A';
    const hostId = process.pid;

    // 1. Geo-IP Lookup (Ensuring only public IPs are looked up)
    let location = 'Unknown (Localnet)';
    const testIp = '1.1.1.1'; // Default test IP
    const ipToLookup = (ip === '::1' || ip === '127.0.0.1') ? testIp : ip;

    // Use a special check to ensure the Geo-IP feature works for any external IP
    if (ipToLookup !== testIp) {
        try {
            const response = await axios.get(
                `http://ip-api.com/json/${ipToLookup}?fields=status,message,country,city,query`
            );
            if (response.data && response.data.status === 'success') {
                location = `${response.data.city}, ${response.data.country}`;
            }
        } catch (error) {
            location = 'Geo-IP API Error';
        }
    } else {
         // Manual setting for localhost test IP (This is what you see when testing locally)
        location = 'Localhost Test (South Brisbane, Australia)';
    }

    // 2. Attack Classification
    const classification = classifyAttack(req);

    // 3. Structured Log Data (The full intelligence object)
    const logData = {
        timestamp: new Date().toISOString(),
        sessionId: sessionId,
        attackType: classification.type,
        severity: classification.severity,
        ipAddress: ip,
        location: location,
        userAgent: userAgent,
        latencyMs: latency,
        targetUrl: req.originalUrl,
        httpMethod: req.method,
        payloadAnalysis: classification.analysis,
        processId: hostId,
        // Only include body if it exists
        payload: (req.method !== 'GET' && Object.keys(req.body).length > 0) ? req.body : null,
        headers: req.headers, // Full headers for deep forensics
    };

    // 4. Log to Console (for Render/Analyst view)
    const structuredLog = [
        `[HIT] IP: ${logData.ipAddress} | LOCATION: ${logData.location} | URL: ${logData.httpMethod} ${logData.targetUrl}`,
        `[SESSION: ${logData.sessionId}] [LATENCY: ${logData.latencyMs}ms] [ATTACK TYPE: ${logData.attackType}]`,
        `[PAYLOAD ANALYSIS: ${logData.payloadAnalysis}]`
    ];

    structuredLog.forEach(line => logToFile(line));

    if (classification.severity === 'CRITICAL' || classification.severity === 'HIGH') {
         logToFile(`!!! CRITICAL ALERT: ${classification.type.toUpperCase()} !!!`);
    }

    // 5. RETURN the structured object for Prakhar's MongoDB integration
    return logData;
};

// --- Controller Functions (The Traps) ---

// 1. Fake Login
exports.fakeLogin = async (req, res) => {
    const logData = await logAttempt(req); // Capture log data
    
    const fakeSessionId = crypto.randomUUID();
    
    // 1. Set the data bridge header for Prakhar
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    // 2. Set the Fake Session ID for the hacker's next request
    res.setHeader('X-Fake-Session-ID', fakeSessionId);

    const { email } = req.body;
    res.status(200).json({
        status: 'success',
        message: 'Login successful.',
        token: `fake-jwt-token.${Buffer.from(email || 'user').toString('base64')}`,
        userId: 'user-fake-id-12345',
    });
};

// 2. Fake Register
exports.fakeRegister = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(201).json({
        status: 'success',
        message: 'User registered successfully.',
        userId: 'user-fake-id-67890',
    });
};

// 3. Fake Get All Users
exports.getFakeUsers = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(200).json([
        { id: 'user-fake-1', username: 'admin', role: 'admin' },
        { id: 'user-fake-2', username: 'guest', role: 'user' },
        { id: 'user-fake-3', username: 'test_user', role: 'user' },
    ]);
};

// 4. Fake Get Single User
exports.getFakeUserById = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    const { id } = req.params;
    res.status(200).json({
        id: id,
        username: `fake_user_${id}`,
        email: `${id}@example.com`,
        role: 'user',
        last_login: new Date().toISOString(),
    });
};

// 5. Fake Admin Action
exports.fakeAdminAction = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(200).json({
        status: 'success',
        message: 'Configuration updated successfully.',
    });
};

// 6. Fake Get User Profile
exports.getFakeProfile = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(200).json({
        id: 'user-fake-id-12345',
        username: 'admin_user_01',
        email: 'admin@internal-systems.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        team: 'IT_Operations',
        apiKey: 'fake_api_key_zX9qB7yP3sF5aC8t',
        createdAt: '2023-01-01T10:00:00Z',
    });
};

// 7. Fake Profile Update
exports.updateFakeProfile = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully.',
        data: req.body,
    });
};

// 8. Fake Get Products
exports.getFakeProducts = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(200).json([
        { id: 'prod_abc', name: 'Standard Server', price: 100.0 },
        { id: 'prod_def', name: 'Premium Server', price: 300.0 },
        { id: 'prod_xyz', name: 'Enterprise Cluster', price: 2500.0 },
    ]);
};

// 9. Fake Admin Logs
exports.getFakeAdminLogs = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(200).json({
        log_count: 3,
        logs: [
            '2025-10-31T13:30:00Z - INFO - User admin@internal-systems.com logged in.',
            '2025-10-31T13:31:12Z - WARN - Failed login attempt for user: guest',
            '2025-10-31T13:32:05Z - INFO - System backup completed successfully.',
        ],
    });
};

// 10. Fake Get Subscription / Billing
exports.getFakeSubscription = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(200).json({
        userId: 'user-fake-id-12345',
        plan: 'Enterprise (Monthly)',
        status: 'active',
        billing_email: 'billing@internal-systems.com',
        payment_method: 'VISA **** **** **** 4242',
        next_invoice: '2025-11-30T10:00:00Z',
    });
};

// 11. Fake Get Invoices
exports.getFakeInvoices = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(200).json([
        {
            id: 'inv_A8B7C6',
            date: '2025-10-30T10:00:00Z',
            amount: 2500.0,
            status: 'paid',
        },
        {
            id: 'inv_D9E8F7',
            date: '2025-09-30T10:00:00Z',
            amount: 2500.0,
            status: 'paid',
        },
    ]);
};

// 12. Fake Internal Health Check
exports.getFakeHealth = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(200).json({
        status: 'ok',
        services: {
            api: 'healthy',
            database: 'healthy',
            cache: 'healthy',
        },
        uptime: '12d 4h 32m',
        timestamp: new Date().toISOString(),
    });
};

// 13. Fake File Upload (The RCE Trap)
exports.fakeFileUpload = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    res.status(201).json({
        status: 'success',
        message: 'File upload successful. File ID: file-trap-8901',
        fileName: req.body.fileName || 'file_uploaded',
    });
};

// 14. Fake Token Refresh (Session Persistence Trap)
exports.fakeTokenRefresh = async (req, res) => {
    const logData = await logAttempt(req);
    res.setHeader('X-Honeypot-Data', JSON.stringify(logData)); 
    const oldToken = req.body.token || 'expired-token';

    res.status(200).json({
        status: 'success',
        message: 'Token renewed successfully.',
        oldToken: oldToken,
        newToken: `new-fake-jwt-token.${crypto.randomUUID()}`,
        expiresIn: '3600s',
    });
};
