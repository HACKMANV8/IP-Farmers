// --- Code Snippet Prakhar needs to modify in his server.js ---

// 1. IMPORT the new relay service
const { relayAndLog } = require('./src/services/honeypotRelay');
// 2. CONNECT TO MONGOOSE (Assuming his code is here)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected for Attack Logging'))
    .catch(err => console.error(err));

// 3. Example of his Detection Middleware (The Sentinel's code)
app.use('/api/*', (req, res, next) => {
    // This is where Prakhar's SQLi/XSS detection logic goes
    const isMalicious = req.body && req.body.username && req.body.username.includes(' OR 1=1');

    if (isMalicious) {
        // If attack is detected, STOP the regular API process and call the relay service
        console.log('SQL INJECTION DETECTED! RELAYING TRAFFIC...');
        return relayAndLog(req, res, 'SQL Injection'); // This calls the function you provided
    }

    // If safe, continue to the real business logic
    next();
});

// --- End of Integration Snippet ---