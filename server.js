import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { initDb } from "./db.js";
import pool from "./db.js";

// --- Global Error Handlers for Production Debugging ---
process.on('uncaughtException', (err) => {
  console.error('>>> [CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('>>> [CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Advanced Feature: Rate Limiting ---
const rateLimits = new Map();
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || "0.0.0.0";
  const now = Date.now();
  const data = rateLimits.get(ip) || { count: 0, start: now };

  if (now - data.start > 60000) {
    data.count = 1;
    data.start = now;
  } else {
    data.count++;
  }

  rateLimits.set(ip, data);
  if (data.count > 30) return res.status(429).json({ error: "Too many requests" });
  next();
};

// --- API Endpoints ---

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/habits", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM habits ORDER BY timestamp DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/habits", async (req, res) => {
  const { activity, status, userName } = req.body;
  if (!activity) return res.status(400).json({ error: "No activity" });
  try {
    let [users] = await pool.query("SELECT id FROM users WHERE name = ?", [userName || "Anonymous"]);
    let userId = users.length > 0 ? users[0].id : null;
    if (!userId) {
      const [r] = await pool.query("INSERT INTO users (name) VALUES (?)", [userName || "Anonymous"]);
      userId = r.insertId;
    }
    await pool.query("INSERT INTO habits (user_id, activity, status) VALUES (?, ?, ?)", [userId, activity, status || "pending"]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chat", rateLimitMiddleware, async (req, res) => {
  const { messages } = req.body;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API Key Missing" });

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: "You are The Mentor. Be direct." }, ...messages]
      })
    });
    const data = await r.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "AI Error" });
  }
});

// STARTUP SEQUENCE
// 1. Listen immediately to avoid Railway timeout
app.listen(PORT, "0.0.0.0", () => {
  console.log(`>>> [SERVER] Listening on port ${PORT}`);
  
  // 2. Initialize DB asynchronously after the server is up
  if (process.env.DB_HOST || process.env.MYSQL_URL) {
    initDb().catch(e => console.error(">>> [INIT] Async DB failure:", e));
  }
});