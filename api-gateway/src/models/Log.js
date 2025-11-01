const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  ip: String,
  method: String,
  url: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
  detectedAttackType: String,
  payload: mongoose.Schema.Types.Mixed, // to store any suspicious body/query
});

module.exports = mongoose.model("Log", logSchema);
