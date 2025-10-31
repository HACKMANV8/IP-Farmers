// Helper function to log attempts
const logAttempt = (req) => {
  console.log(
    `[HONEYPOT-HIT] IP: ${req.ip} | ${req.method} ${req.originalUrl}`
  );
  if (Object.keys(req.body).length > 0) {
    console.log('[HONEYPOT-BODY]', req.body);
  }
};

// --- Controller Functions ---

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