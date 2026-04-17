import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import { rateLimit } from "express-rate-limit";

// --- STARTUP CONFIG ---
dotenv.config();
const PORT = process.env.PORT || 3000;
const MYSQL_URL = process.env.MYSQL_URL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- [ADVANCED: LOGGING] ---
const log = (level, message) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [${level}] ${message}`);
};

log("INFO", "-----------------------------------------");
log("INFO", `Server sequence starting on port ${PORT}...`);
log("INFO", `Environment: ${process.env.NODE_ENV || 'production'}`);
log("INFO", "-----------------------------------------");

// --- [ADVANCED: ERROR HANDLING] Global Crash Protection ---
process.on('uncaughtException', (err) => log("ERROR", `Uncaught: ${err.message}`));
process.on('unhandledRejection', (reason) => log("ERROR", `Unhandled: ${reason}`));

// --- DATABASE CONNECTION ---
let pool;
try {
  const host = process.env.MYSQLHOST || process.env.DB_HOST || "localhost";
  const connectionConfig = MYSQL_URL || {
    host,
    user: process.env.MYSQLUSER || process.env.DB_USER || "root",
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || "railway",
    port: process.env.MYSQLPORT || 3306,
    ssl: (host === "localhost" || host === "127.0.0.1") ? false : { rejectUnauthorized: false },
    connectTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  pool = mysql.createPool(connectionConfig);
  log("INFO", "Database connection pool initialized.");
} catch (err) {
  log("ERROR", `CRITICAL: Pool Creation Error: ${err.message}`);
}

const app = express();
app.use(cors());
app.use(express.json());

// --- [ADVANCED: RATE LIMITING] Prevents API Abuse ---
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window`
	standardHeaders: 'draft-7',
	legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
});
app.use(limiter);

// --- API Endpoints ---

// --- [EXTRA: LOGIN] ---
app.post("/login", async (req, res, next) => {
  const { userName } = req.body;
  if (!userName) return res.status(400).json({ error: "Username required" });
  try {
    let [users] = await pool.query("SELECT id, name FROM users WHERE name = ?", [userName]);
    let user = users.length > 0 ? users[0] : null;
    if (!user) {
      const [r] = await pool.query("INSERT INTO users (name) VALUES (?)", [userName]);
      user = { id: r.insertId, name: userName };
      log("INFO", `New user registered: ${userName}`);
    } else {
      log("INFO", `User login: ${userName}`);
    }
    res.json(user);
  } catch (err) { next(err); }
});

app.get("/health", (req, res) => {
    res.json({ 
        status: "alive", 
        dbConnected: !!pool,
        time: new Date().toISOString() 
    });
});

app.get("/habits", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM habits ORDER BY timestamp DESC LIMIT 100");
    res.json(rows);
  } catch (err) { 
    log("WARN", `Query Failure (/habits): ${err.message}`);
    next(err);
  }
});

// --- [EXTRA: STREAK TRACKING] ---
app.get("/streaks/:userName", async (req, res, next) => {
    const { userName } = req.params;
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT DATE(timestamp) as date 
            FROM habits h 
            JOIN users u ON h.user_id = u.id 
            WHERE u.name = ? 
            ORDER BY date DESC
        `, [userName]);
        
        if (rows.length === 0) return res.json({ streak: 0 });

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0,0,0,0);

        for (let i = 0; i < rows.length; i++) {
            let logDate = new Date(rows[i].date);
            logDate.setHours(0,0,0,0);
            
            let diffDays = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === streak || diffDays === streak + 1) {
                if (diffDays === streak + 1) streak++;
                // If diffDays is 0 (logged today), streak is at least 1 if it wasn't already.
                if (i === 0 && diffDays === 0) streak = 1;
            } else {
                break;
            }
        }
        res.json({ streak });
    } catch (err) { next(err); }
});

app.post("/habits", async (req, res, next) => {
  const { activity, status, userName } = req.body;

  if (!activity || typeof activity !== 'string' || activity.trim().length === 0) {
    return res.status(400).json({ error: "VALIDATION FAILED: Activity name is required and must be text." });
  }

  try {
    let [users] = await pool.query("SELECT id FROM users WHERE name = ?", [userName || "Anonymous"]);
    let userId = users.length > 0 ? users[0].id : null;
    if (!userId) {
      const [r] = await pool.query("INSERT INTO users (name) VALUES (?)", [userName || "Anonymous"]);
      userId = r.insertId;
    }
    await pool.query("INSERT INTO habits (user_id, activity, status) VALUES (?, ?, ?)", [userId, activity, status || "pending"]);
    log("INFO", `Activity Logged: ${activity} for user ${userName || 'Anonymous'}`);
    res.status(201).json({ success: true, activity });
  } catch (err) { 
    log("ERROR", `POST /habits failure: ${err.message}`);
    next(err);
  }
});

// --- [EXTRA: GOALS] ---
app.get("/goals/:userName", async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT g.* FROM goals g 
            JOIN users u ON g.user_id = u.id 
            WHERE u.name = ?
        `, [req.params.userName]);
        res.json(rows);
    } catch (err) { next(err); }
});

app.post("/goals", async (req, res, next) => {
    const { userName, goalName, targetValue } = req.body;
    try {
        let [users] = await pool.query("SELECT id FROM users WHERE name = ?", [userName]);
        if (users.length === 0) return res.status(404).json({ error: "User not found" });
        await pool.query("INSERT INTO goals (user_id, goal_name, target_value) VALUES (?, ?, ?)", 
            [users[0].id, goalName, targetValue || 1]);
        res.status(201).json({ success: true });
    } catch (err) { next(err); }
});

app.post("/api/chat", async (req, res, next) => {
// ... existing chat logic ...
  const { messages, userName } = req.body;
  
  // --- [ADVANCED: VALIDATION] ---
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "VALIDATION FAILED: Chat messages are required." });
  }

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
        log("INFO", "AI interaction saved to DB.");
    } catch (dbErr) {
        log("WARN", `Failed to save AI interaction to DB: ${dbErr.message}`);
    }

    res.json({ reply });
  } catch (err) { 
    log("ERROR", `AI node failure: ${err.message}`);
    next(err);
  }
});

// --- Static Assets ---
app.use(express.static(path.join(__dirname, "dist")));

// Fallback for SPA Routing
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// --- [ADVANCED: GLOBAL ERROR HANDLER] ---
app.use((err, req, res, next) => {
    log("ERROR", `[GLOBAL_HANDLER] ${err.message}`);
    res.status(500).json({ 
        error: "Internal Server Error", 
        message: process.env.NODE_ENV === 'production' ? "A server error occurred." : err.message 
    });
});

// --- Server START ---
app.listen(PORT, () => {
    log("INFO", `Growth System LIVE on port ${PORT}`);
    
    // Async DB init
    (async () => {
        try {
            log("INFO", "Verifying tables...");
            await pool.query("SELECT 1");
            await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
            await pool.query(`CREATE TABLE IF NOT EXISTS habits (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, activity VARCHAR(255) NOT NULL, status VARCHAR(50) DEFAULT 'pending', timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
            await pool.query(`CREATE TABLE IF NOT EXISTS ai_response (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, prompt TEXT NOT NULL, response TEXT NOT NULL, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
            await pool.query(`CREATE TABLE IF NOT EXISTS goals (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, goal_name VARCHAR(255) NOT NULL, target_value INT DEFAULT 1, current_value INT DEFAULT 0, status VARCHAR(50) DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
            log("INFO", "Database Initialization complete.");
        } catch (e) {
            log("ERROR", `Initialization Failed: ${e.message}`);
            log("WARN", "System running in DEGRADED mode (Database Offline).");
        }
    })();
});