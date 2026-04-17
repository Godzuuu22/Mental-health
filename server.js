import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
  const limit = 10; // 10 requests per minute
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
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
  }

  data.count++;
  next();
};

// --- API Endpoints ---

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", system: "Growth & Discipline AI System", timestamp: new Date() });
});

// GET /habits - Fetch habit history (Required Feature)
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
    res.status(500).json({ error: "Failed to fetch habits", details: err.message });
  }
});

// POST /habits - Log a new habit (Required Feature + Validation)
app.post("/habits", async (req, res) => {
  const { activity, status, userName } = req.body;

  if (!activity) {
    return res.status(400).json({ error: "Activity description is required." });
  }

  try {
    // Ensure user exists
    let [users] = await pool.query("SELECT id FROM users WHERE name = ?", [userName || "Anonymous"]);
    let userId;
    if (users.length === 0) {
      const [result] = await pool.query("INSERT INTO users (name) VALUES (?)", [userName || "Anonymous"]);
      userId = result.insertId;
    } else {
      userId = users[0].id;
    }

    // Insert habit
    const [result] = await pool.query(
      "INSERT INTO habits (user_id, activity, status) VALUES (?, ?, ?)",
      [userId, activity, status || "pending"]
    );
    
    res.status(201).json({ id: result.insertId, activity, status: status || "pending" });
  } catch (err) {
    res.status(500).json({ error: "Failed to log habit", details: err.message });
  }
});

// POST /api/chat - AI Mentor Advisor (Required Feature + Rate Limiting + Error Handling)
app.post("/api/chat", rateLimitMiddleware, async (req, res) => {
  const { messages, userName } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "AI Engine not configured. GROQ_API_KEY missing." });
  }

  // System prompt to pivot to a Discipline Mentor
  const systemMessage = {
    role: "system",
    content: `You are "The Mentor", a high-performance Growth and Discipline advisor for the ${userName || 'User'}. 
    Your tone is direct, encouraging, and focused on radical accountability. 
    Use principles of CBT and Atomic Habits to help the user build consistency. 
    Keep responses concise (max 3 short paragraphs). Use **bolding** for actionable steps.`
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response generated.";

    // Track AI usage in DB
    try {
      if (process.env.DB_HOST || process.env.MYSQL_URL) {
        let [users] = await pool.query("SELECT id FROM users WHERE name = ?", [userName || "Anonymous"]);
        let userId = users.length > 0 ? users[0].id : null;
        if (userId) {
          await pool.query("INSERT INTO ai_response (user_id, prompt, response) VALUES (?, ?, ?)", 
          [userId, messages[messages.length - 1].content, reply]);
        }
      }
    } catch (dbErr) {
      console.error("Failed to log AI response:", dbErr.message);
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: "AI Mentor is currently offline", details: err.message });
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`>>> Growth AI System starting on port ${PORT}...`);
  try {
    if (process.env.DB_HOST || process.env.MYSQL_URL) {
      await initDb();
    } else {
      console.warn(">>> WARNING: No database credentials found. Running in disconnected mode.");
    }
  } catch (err) {
    console.error(">>> Failed to connect during startup:", err);
  }
  console.log(`>>> Growth AI System is LIVE at http://localhost:${PORT}`);
});