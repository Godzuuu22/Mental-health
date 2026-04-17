import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

// --- STARTUP DATA ---
dotenv.config();
const PORT = process.env.PORT || 3000;
const MYSQL_URL = process.env.MYSQL_URL;

console.log("-----------------------------------------");
console.log(`>>> [BOOT] Server sequence starting on port ${PORT}...`);
console.log(`>>> [BOOT] Mode: ${process.env.NODE_ENV || 'production'}`);
console.log("-----------------------------------------");

// 1. Error Handlers
process.on('uncaughtException', (err) => console.error('>>> [CRITICAL] Uncaught Exception:', err.message));
process.on('unhandledRejection', (reason) => console.error('>>> [CRITICAL] Unhandled Rejection:', reason));

// 2. Database Connection Logic
let pool;
try {
  const connectionConfig = MYSQL_URL || {
    host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
    user: process.env.MYSQLUSER || process.env.DB_USER || "root",
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || "railway",
    port: process.env.MYSQLPORT || 3306,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  pool = mysql.createPool(connectionConfig);
  console.log(">>> [DB] Connection pool initialized.");
} catch (err) {
  console.error(">>> [DB] CRITICAL ERROR during startup (Pool Creation):", err.message);
}

const app = express();
app.use(cors());
app.use(express.json());

// --- Endpoints ---
app.get("/health", (req, res) => {
    res.json({ 
        status: "alive", 
        dbConnected: !!pool,
        time: new Date().toISOString() 
    });
});

app.get("/habits", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM habits ORDER BY timestamp DESC LIMIT 100");
    res.json(rows);
  } catch (err) { 
    console.error(">>> [DB] Query Error (/habits):", err.message);
    res.status(500).json({ error: "Database offline" }); 
  }
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
    res.json({ success: true });
  } catch (err) { 
    console.error(">>> [DB] Query Error (POST /habits):", err.message);
    res.status(500).json({ error: "Log failure" }); 
  }
});

app.post("/api/chat", async (req, res) => {
  const { messages, userName } = req.body;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Mentor node unconfigured" });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: "You are The Mentor. Be direct and insightful." }, ...messages]
      })
    });
    const data = await response.json();
    const reply = data.choices[0].message.content;

    // --- Background: AI interaction saved to DB ---
    try {
        let [users] = await pool.query("SELECT id FROM users WHERE name = ?", [userName || "Anonymous"]);
        let userId = users.length > 0 ? users[0].id : null;
        if (!userId) {
            const [r] = await pool.query("INSERT INTO users (name) VALUES (?)", [userName || "Anonymous"]);
            userId = r.insertId;
        }
        await pool.query("INSERT INTO ai_response (user_id, prompt, response) VALUES (?, ?, ?)", 
            [userId, messages[messages.length - 1].content, reply]);
        console.log(">>> Background: AI interaction saved to DB.");
    } catch (dbErr) {
        console.warn(">>> [VERBOSE] Failed to save AI interaction to DB:", dbErr.message);
    }

    res.json({ reply });
  } catch (err) { 
    console.error(">>> [AI] Failure:", err.message);
    res.status(500).json({ error: "AI node failure" }); 
  }
});

// --- Server START ---
app.listen(PORT, () => {
    console.log(`>>> [SERVER] Growth System LIVE on port ${PORT}`);
    
    // Async DB init
    (async () => {
        try {
            console.log(">>> [DB] Verifying tables...");
            await pool.query("SELECT 1");
            await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            await pool.query(`CREATE TABLE IF NOT EXISTS habits (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, activity VARCHAR(255) NOT NULL, status VARCHAR(50) DEFAULT 'pending', timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
            await pool.query(`CREATE TABLE IF NOT EXISTS ai_response (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, prompt TEXT NOT NULL, response TEXT NOT NULL, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
            console.log(">>> [DB] Initialization complete.");
        } catch (e) {
            console.error(">>> [DB] CRITICAL ERROR during startup:", e.message);
            console.warn(">>> [BOOT] System running in DEGRADED mode (Database Offline).");
        }
    })();
});