🍯 Phantom Server (Honeypot) Documentation

This document explains the purpose and functionality of the phantom-server.

1. Project Role

This server acts as a high-interaction honeypot. Its job is to be an invisible "trap" for attackers.

When the main api-gateway (Prakhar's server) detects an attack, it redirects the attacker to this server. This server then:

Logs all of the attacker's actions (IP, device, what they're trying to access).

Simulates a real API by sending back fake data and fake success messages.

Defends itself with fake rate-limiting to appear realistic.

All logged evidence is stored in honeypot.log.

2. How to Run This Server

Navigate to the phantom-server directory: cd phantom-server

Install dependencies: npm install

Start the server: npm start

The server will be running at http://localhost:8080.

3. Fake API Routes (The "Traps")

This server simulates a full API to keep attackers engaged.

Authentication (with Rate Limiting)

POST /api/auth/login

POST /api/auth/register

User & Profile Data

GET /api/users

GET /api/users/:id

GET /api/profile/me

POST /api/profile/update

Business & Admin (High-Value Targets)

GET /api/products

GET /api/admin/logs

POST /api/admin/config

Financial & Internal (Highest-Value Targets)

GET /api/billing/subscription (Sends fake credit card info)

GET /api/billing/invoices

GET /api/internal/health (Sends fake server health data)

4. Security Features

Persistent Logging: All hits are logged with a timestamp, IP, User-Agent, and (if applicable) request body to honeypot.log.

Realistic Delays: A random delay (200-800ms) is added to every response to simulate real database lookup times.

Brute-Force Protection: The POST /api/auth/login route will block an IP after 5 attempts (returns a 429 Too Many Requests error).