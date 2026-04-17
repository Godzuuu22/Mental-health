import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./db.js";
import pool from "./db.js";

// --- Global Error Handlers ---
process.on('uncaughtException', (err) => console.error('>>> [CRITICAL] Uncaught:', err));
process.on('unhandledRejection', (reason) => console.error('>>> [CRITICAL] Unhandled Rejection:', reason));

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Health ---
app.get("/health", (req, res) => res.json({ status: "ok", node: process.version }));

// --- Habits ---
app.get("/habits", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM habits ORDER BY timestamp DESC LIMIT 50");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: "DB error" }); }
});

app.post("/habits", async (req, res) => {
  const { activity, status, userName } = req.body;
  if (!activity) return res.status(400).json({ error: "Missing activity" });
  try {
    let [users] = await pool.query("SELECT id FROM users WHERE name = ?", [userName || "Anonymous"]);
    let userId = users.length > 0 ? users[0].id : null;
    if (!userId) {
      const [r] = await pool.query("INSERT INTO users (name) VALUES (?)", [userName || "Anonymous"]);
      userId = r.insertId;
    }
    await pool.query("INSERT INTO habits (user_id, activity, status) VALUES (?, ?, ?)", [userId, activity, status || "pending"]);
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: "DB log error" }); }
});

// --- AI Chat (Using Native Fetch for Node 22+) ---
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI key missing" });

  try {
    // Native fetch (No 'node-fetch' required on Node 18+)
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: "You are The Mentor. Be direct." }, ...messages]
      })
    });
    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (err) { res.status(500).json({ error: "AI system error" }); }
});

// --- Start ---
app.listen(PORT, "0.0.0.0", () => {
  console.log(`>>> [SERVER] Growth System listening on port ${PORT}`);
  if (process.env.DB_HOST || process.env.MYSQL_URL) {
    initDb().catch(e => console.error(">>> [INIT] Async DB failure:", e.message));
  } else {
    console.warn(">>> [INIT] WARNING: No DB host/URL provided. DB-reliant features will fail.");
  }
});