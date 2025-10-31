const express = require("express");
const logger = require("./middleware/logger");
const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/hackathonLogs")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB connection failed:", err));

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.get("/", (req, res) => res.send("Server Running!"));

app.listen(3000, () => console.log("Server on http://localhost:3000"));
