const fs = require("fs");
const path = require("path");
const Log = require("../models/Log");

const logFilePath = path.join(__dirname, "../request_logs.txt");

// Returns a reason string if suspicious, else null
function getSuspiciousReason(req) {
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  // expand with more signatures or patterns as needed
  if (ua.includes("sqlmap")) return "User-Agent: sqlmap";
  if (ua.includes("curl")) return "User-Agent: curl";
  if (ua.includes("python")) return "User-Agent: python";
  if (/union.*select/i.test(req.originalUrl)) return "Suspect SQLi in URL";
  if (/[\{\}\[\]\$;]/.test(req.originalUrl)) return "Special chars in URL";
  return null;
}

const logger = async (req, res, next) => {
  try {
    const reason = getSuspiciousReason(req);
    const logDoc = {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.headers["user-agent"],
      payload: req.method === "GET" ? req.query : req.body,
      detectedAttackType: reason || undefined,
    };

    await Log.create(logDoc);

    const logMsg = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}` + (reason ? ` - Suspect: ${reason}` : "");
    console.log(logMsg);

    fs.appendFile(logFilePath, logMsg + "\n", err => {
      if (err) console.error("Error writing log:", err);
    });

    // If suspicious, redirect and do not call next():
    if (reason) {
      return res.redirect("https://your-fake-website.com"); // <---- Update this URL
    }

    next();
  } catch (err) {
    console.error("Logging error:", err);
    res.status(500).send({ error: "Internal Server Error" });
    next(err);
  }
};

module.exports = logger;
