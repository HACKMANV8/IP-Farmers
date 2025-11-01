const mongoose = require('mongoose');

const AttackLogSchema = new mongoose.Schema({
    // Primary ID for tracing across services
    sessionId: { type: String, required: true, index: true }, 

    // Attack Classification
    attackType: { type: String, required: true },
    severity: { type: String, required: true },

    // Forensic Data
    ipAddress: { type: String, required: true },
    location: { type: String, required: true },
    userAgent: { type: String }, 
    timestamp: { type: Date, required: true, default: Date.now },
    latencyMs: { type: Number },
    
    // Attacker's Intent/Method
    targetUrl: { type: String, required: true },
    httpMethod: { type: String },
    payloadAnalysis: { type: String },

    // The raw data sent by the hacker
    fullPayload: { type: mongoose.Schema.Types.Mixed }, // Use Mixed for flexible JSON payloads
    fullHeaders: { type: mongoose.Schema.Types.Mixed }, 
});

const AttackLog = mongoose.model('AttackLog', AttackLogSchema);
module.exports = AttackLog;