// apiController.js: Contains the core logic for the honeypot endpoints and logging.
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Create a path to our new log file.
const logFilePath = path.join(__dirname, '..', '..', 'honeypot.log');

// New function to write to our log file
const logToFile = (message) => {
  // This converts the UTC time to your local timezone and a readable format
  const timestamp = new Date().toLocaleString();
  const logMessage = `${timestamp} - ${message}\n`;

  // 'a' means 'append' (don't overwrite the file)
  // --- START MODIFICATION FOR CLOUD DEPLOYMENT ---
  /* fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('CRITICAL: Failed to write to honeypot.log', err);
    }
  });
  */
  // --- END MODIFICATION FOR CLOUD DEPLOYMENT ---
};

// Helper function to log attempts (now async for Geo-IP lookup)
const logAttempt = async (req) => {
  const ip = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'unknown';

  // --- Geo-IP Lookup ---
  let location = 'Unknown (Localnet)';
  // **UPDATED IP ADDRESS FOR TESTING**
  // This IP will be looked up when you connect from localhost (::1)
  const testIp = '106.206.35.59'; 
  
  // If IP is localhost, use testIp; otherwise, use the real IP
  const ipToLookup = (ip === '::1' || ip === '127.0.0.1') ? testIp : ip;

  try {
    // This logic ensures only remote IPs hit the API. Localhost uses the testIp.
    if (ipToLookup !== testIp) {
      const response = await axios.get(
        `http://ip-api.com/json/${ipToLookup}?fields=status,message,country,city,query`
      );
      if (response.data && response.data.status === 'success') {
        location = `${response.data.city}, ${response.data.country}`;
      }
    } else {
      // Execute API call for the test IP, so you see the Geo-IP result (even if it's not Bangalore)
       const response = await axios.get(
        `http://ip-api.com/json/${ipToLookup}?fields=status,message,country,city,query`
      );
      if (response.data && response.data.status === 'success') {
        location = `${response.data.city}, ${response.data.country} (Public Test)`;
      } else {
        location = 'Geo-IP Test Failed';
      }
    }

  } catch (error) {
    location = 'Geo-IP API Error';
  }
  // --- END Geo-IP Lookup ---

  // 1. Log the HIT (IP, Location, Method, URL, User-Agent)
  const hitMessage = `[HIT] IP: ${ip} | LOCATION: ${location} | ${req.method} ${
    req.originalUrl
  } | UA: ${userAgent}`;
  console.log(hitMessage);
  logToFile(hitMessage); // This function now only logs to the console

  // 2. Log all Request Headers (Deep Forensics)
  const headerMessage = `[HEADERS] ${JSON.stringify(req.headers)}`;
  console.log(headerMessage);
  logToFile(headerMessage);

  // 3. Log the Body (Payload) for POST/PUT/PATCH requests
  if (
    (req.method === 'POST' ||
      req.method === 'PUT' ||
      req.method === 'PATCH') &&
    Object.keys(req.body).length > 0
  ) {
    const bodyMessage = `[BODY] ${JSON.stringify(req.body)}`;
    console.log(bodyMessage);
    logToFile(bodyMessage);
  }
};

// --- Controller Functions (The Fake API Logic) ---

// 1. Fake Login
exports.fakeLogin = (req, res) => {
  logAttempt(req);
  const { email } = req.body;
  res.status(200).json({
    status: 'success',
    message: 'Login successful.',
    token: `fake-jwt-token.${Buffer.from(email || 'user').toString('base64')}`,
    userId: 'user-fake-id-12345',
  });
};

// 2. Fake Register
exports.fakeRegister = (req, res) => {
  logAttempt(req);
  res.status(201).json({
    status: 'success',
    message: 'User registered successfully.',
    userId: 'user-fake-id-67890',
  });
};

// 3. Fake Get All Users
exports.getFakeUsers = (req, res) => {
  logAttempt(req);
  res.status(200).json([
    { id: 'user-fake-1', username: 'admin', role: 'admin' },
    { id: 'user-fake-2', username: 'guest', role: 'user' },
    { id: 'user-fake-3', username: 'test_user', role: 'user' },
  ]);
};

// 4. Fake Get Single User
exports.getFakeUserById = (req, res) => {
  logAttempt(req);
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
exports.fakeAdminAction = (req, res) => {
  logAttempt(req);
  res.status(200).json({
    status: 'success',
    message: 'Configuration updated successfully.',
  });
};

// 6. Fake Get User Profile
exports.getFakeProfile = (req, res) => {
  logAttempt(req);
  res.status(200).json({
    id: 'user-fake-id-12345',
    username: 'admin_user_01',
    email: 'admin@internal-systems.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    team: 'IT_Operations',
    apiKey: 'fake-api-key-zX9qB7yP3sF5aC8t',
    createdAt: '2023-01-01T10:00:00Z',
  });
};

// 7. Fake Profile Update
exports.updateFakeProfile = (req, res) => {
  logAttempt(req);
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully.',
    data: req.body,
  });
};

// 8. Fake Get Products
exports.getFakeProducts = (req, res) => {
  logAttempt(req);
  res.status(200).json([
    { id: 'prod_abc', name: 'Standard Server', price: 100.0 },
    { id: 'prod_def', name: 'Premium Server', price: 300.0 },
    { id: 'prod_xyz', name: 'Enterprise Cluster', price: 2500.0 },
  ]);
};

// 9. Fake Admin Logs
exports.getFakeAdminLogs = (req, res) => {
  logAttempt(req);
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
exports.getFakeSubscription = (req, res) => {
  logAttempt(req);
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
exports.getFakeInvoices = (req, res) => {
  logAttempt(req);
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
exports.getFakeHealth = (req, res) => {
  logAttempt(req);
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

// 13. Fake Token Refresh (Session Persistence Trap)
exports.fakeTokenRefresh = (req, res) => {
  logAttempt(req);
  const oldToken = req.body.token || 'expired-token';

  // The trap sends a NEW fake token to keep the attacker busy
  res.status(200).json({
    status: 'success',
    message: 'Token renewed successfully.',
    oldToken: oldToken,
    // Generates a new unique token
    newToken: `new-fake-jwt-token.${Buffer.from(Date.now().toString()).toString('base64')}`, 
    expiresIn: '3600s',
  });
};

// 14. Fake File Upload (RCE Trap)
exports.fakeFileUpload = (req, res) => {
  logAttempt(req);

  // Print a warning to the console so the developer sees the attack attempt immediately
  if (req.body.content && (req.body.content.includes('<script>') || req.body.content.includes('<?php') || req.body.content.includes('bash'))) {
    console.log('\x1b[31m%s\x1b[0m', '!!! POTENTIAL MALICIOUS FILE UPLOAD DETECTED !!!');
  }

  // Send back a success message to trick the attacker
  res.status(201).json({
    status: 'success',
    message: 'File upload successful. File ID: file-trap-8901',
    fileName: req.body.fileName || 'unknown',
  });
};

// --- We export the logAttempt function so apiRoutes.js can use it in the catch-all route. ---
exports.logAttempt = logAttempt;
