import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import pool, { initDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());

/**
 * SE2 FINAL LABORATORY - Advanced Features
 * Simple Rate Limiting Implementation
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

const rateLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const userData = requestCounts.get(ip) || { count: 0, startTime: now };

  if (now - userData.startTime > RATE_LIMIT_WINDOW) {
    userData.count = 1;
    userData.startTime = now;
  } else {
    userData.count++;
  }

  requestCounts.set(ip, userData);

  if (userData.count > MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests. Please slow down and focus on your discipline." });
  }
  next();
};

// Deployment Health Check
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// Helper: Get or create user (MySQL Syntax)
const getOrCreateUserId = async (name) => {
  if (!name || name.trim() === "") return null;
  const username = name.trim();
  try {
    // MySQL equivalent for ON CONFLICT (id is auto-incremented)
    await pool.query(
      "INSERT INTO users (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)",
      [username]
    );
    const [rows] = await pool.query("SELECT id FROM users WHERE name = ?", [username]);
    return rows[0]?.id;
  } catch (err) {
    console.error("User helper error:", err.message);
    return null;
  }
};

// Laboratory Feature: Habit History (GET)
app.get("/habits", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, u.name as user_name 
      FROM habits h 
      LEFT JOIN users u ON h.user_id = u.id 
      ORDER BY h.timestamp DESC
    `);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Habits fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch habit history." });
  }
});

// Laboratory Feature: Habit Logging (POST)
app.post("/habits", async (req, res) => {
  const { activity, userName, status } = req.body;
  
  // Validation (Advanced Feature)
  if (!activity || activity.trim() === "") {
    return res.status(400).json({ error: "Activity description cannot be empty." });
  }

  try {
    const userId = await getOrCreateUserId(userName || "Anonymous User");
    const [result] = await pool.query(
      "INSERT INTO habits (user_id, activity, status) VALUES (?, ?, ?)",
      [userId, activity, status || 'completed']
    );
    
    res.status(201).json({ id: result.insertId, activity, status: status || 'completed' });
  } catch (err) {
    console.error("Habit save error:", err.message);
    res.status(500).json({ error: "Failed to log activity." });
  }
});

// AI ADVISOR ENDPOINT (Growth & Discipline focused)
app.post("/api/chat", rateLimiter, async (req, res) => {
  const { messages, prompt, userName } = req.body;
  let chatMessages = messages && Array.isArray(messages) ? messages : (prompt ? [{ role: "user", content: prompt }] : null);

  if (!chatMessages) return res.status(400).json({ reply: "No messages provided." });

  try {
    const name = userName || "Applicant";
    const systemPrompt = `You are "The Mentor", a high-performance Growth & Discipline AI Advisor. 
    Your goal is to help ${name} build ironclad discipline, consistent habits, and a growth mindset.
    
    Guidelines:
    - Be direct, encouraging, and highly practical.
    - Focus on accountability and action steps.
    - Use data-driven advice (CBT, Atomic Habits principles).
    - Keep responses concise and formatted with **bold** highlights.
    - Do not be overly "soft" — prioritize results and discipline over temporary comfort.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: systemPrompt }, ...chatMessages],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ reply: data.error?.message || "Advisor API failed." });
    
    const reply = data.choices?.[0]?.message?.content || "No response.";

    res.json({ reply });

    // Background task: Save to MySQL
    setTimeout(async () => {
      try {
        const userText = prompt || (chatMessages[chatMessages.length - 1].content);
        const userId = await getOrCreateUserId(userName || "Ambitious User");
        await pool.query(
          "INSERT INTO ai_response (user_id, prompt, response) VALUES (?, ?, ?)",
          [userId, userText, reply]
        );
        console.log(">>> Background: AI guidance saved to MySQL.");
      } catch (dbErr) {
        console.error(">>> Background DB Error:", dbErr.message);
      }
    }, 0);

  } catch (err) {
    console.error(">>> Chat error:", err);
    res.status(500).json({ reply: "The Mentor is briefly unavailable. Continue your discipline independently." });
  }
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, "dist")));

// Catch-all route to serve index.html for Vue Router (SPA)
app.use((req, res) => {
  const indexPath = path.join(__dirname, "dist", "index.html");
  res.sendFile(indexPath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`>>> Growth System starting on port ${PORT}...`);
  try {
    // Check for MySQL credentials
    if (process.env.DB_HOST) {
      await initDb();
      console.log(">>> Application database initialized.");
    } else {
      console.warn(">>> WARNING: DB_HOST not found. Running in disconnected mode.");
    }
    console.log(`>>> Growth AI System is LIVE at http://localhost:${PORT}`);
  } catch (err) {
    console.error(">>> CRITICAL ERROR during startup:", err.message);
  }
});