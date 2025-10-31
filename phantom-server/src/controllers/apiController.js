// Helper function to log attempts
const logAttempt = (req) => {
  // --- THIS IS THE UPGRADED PART ---
  // Get the IP address
  const ip = req.ip || req.socket.remoteAddress;

  // Get the User-Agent (this tells you their OS and browser)
  const userAgent = req.headers['user-agent'] || 'unknown';
  // --- END OF UPGRADE ---

  console.log(
    `[HONEYPOT-HIT] IP: ${ip} | ${req.method} ${req.originalUrl}`
  );

  // --- THIS IS THE UPGRADED PART ---
  // Log the device info
  console.log(`[HONEYPOT-DEVICE] User-Agent: ${userAgent}`);
  // --- END OF UPGRADE ---

  if (Object.keys(req.body).length > 0) {
    console.log('[HONEYPOT-BODY]', req.body);
  }
};

// --- Controller Functions ---
// (All your functions are still here)

// 1. Fake Login
exports.fakeLogin = (req, res) => {
  logAttempt(req);
  const { email } = req.body;

  // Send back a fake token to make the attack seem successful
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
  // Send believable, but completely fake, user data
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
    id: 'user-fake-id-12345', // Use a consistent fake ID
    username: 'admin_user_01',
    email: 'admin@internal-systems.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin',
    team: 'IT_Operations',
    apiKey: 'fake_api_key_zX9qB7yP3sF5aC8t', // Juicy-looking fake data
    createdAt: '2023-01-01T10:00:00Z',
  });
};

// 7. Fake Profile Update
exports.updateFakeProfile = (req, res) => {
  logAttempt(req);
  // We log the body to see what they tried to change
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully.',
    data: req.body, // Send back the data they sent
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

// 9. Fake Admin Logs (A very juicy target!)
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
