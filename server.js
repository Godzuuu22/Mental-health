import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch"; // Production stability for Node.js fetch
import { initDb } from "./db.js";
import pool from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Advanced Feature: Rate Limiting ---
const rateLimits = new Map();
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const limit = 15; // Increased slightly for production
  const window = 60 * 1000;

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, start: now });
    return next();
  }

  const data = rateLimits.get(ip);
  if (now - data.start > window) {
    rateLimits.set(ip, { count: 1, start: now });
    return next();
  }

  if (data.count >= limit) {
    return res.status(429).json({ error: "Rate limit exceeded. Slow down." });
  }

  data.count++;
  next();
};

// --- API Endpoints ---

// Health Check (Fast response for Railway monitoring)
app.get("/health", (req, res) => {
  res.json({ status: "ok", system: "Growth & Discipline AI System", timestamp: new Date() });
});

// GET /habits
app.get("/habits", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, u.name as user_name 
      FROM habits h 
      LEFT JOIN users u ON h.user_id = u.id 
      ORDER BY timestamp DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Fetch habits error:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /habits
app.post("/habits", async (req, res) => {
  const { activity, status, userName } = req.body;
  if (!activity) return res.status(400).json({ error: "No activity provided" });

  try {
    let [users] = await pool.query("SELECT id FROM users WHERE name = ?", [userName || "Anonymous"]);
    let userId;
    if (users.length === 0) {
      const [result] = await pool.query("INSERT INTO users (name) VALUES (?)", [userName || "Anonymous"]);
      userId = result.insertId;
    } else {
      userId = users[0].id;
    }

    const [result] = await pool.query(
      "INSERT INTO habits (user_id, activity, status) VALUES (?, ?, ?)",
      [userId, activity, status || "pending"]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error("Log habit error:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/chat
app.post("/api/chat", rateLimitMiddleware, async (req, res) => {
  const { messages, userName } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "AI Engine not configured" });

  const systemMessage = {
    role: "system",
    content: `You are "The Mentor", a high-performance Growth and Discipline advisor. Tone: Direct, Action-Oriented. Max 3 paragraphs.`
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [systemMessage, ...messages],
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error("AI provider error");
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    // Async log to DB (don't block the response)
    if (process.env.DB_HOST || process.env.MYSQL_URL) {
      pool.query("SELECT id FROM users WHERE name = ?", [userName || "Anonymous"])
        .then(([users]) => {
          if (users.length > 0) {
            pool.query("INSERT INTO ai_response (user_id, prompt, response) VALUES (?, ?, ?)", 
            [users[0].id, messages[messages.length - 1].content, reply]);
          }
        }).catch(e => console.error("AI logging error:", e.message));
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Mentor is currently offline" });
  }
});

// Start Server
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`>>> [SERVER] Starting on port ${PORT}...`);
  if (process.env.DB_HOST || process.env.MYSQL_URL) {
    await initDb();
  }
  console.log(`>>> [SERVER] Growth AI System is LIVE.`);
});