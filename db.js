import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables immediately
dotenv.config();

/**
 * Enhanced DB Factory
 * Specifically designed for Railway's MySQL and native Node.js ESM.
 */
let pool;
try {
  const connectionConfig = process.env.MYSQL_URL || {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "railway",
    ssl: { rejectUnauthorized: false }
  };

  pool = mysql.createPool(connectionConfig);
  console.log(">>> [DB] Connection pool established.");
} catch (err) {
  console.error(">>> [DB] CRITICAL: Failed to create pool:", err.message);
}

export const initDb = async () => {
  if (!pool) return;
  try {
    console.log(">>> [DB] Initializing tables...");
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) UNIQUE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS habits (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, activity VARCHAR(255) NOT NULL, status VARCHAR(50) DEFAULT 'pending', timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ai_response (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, prompt TEXT NOT NULL, response TEXT NOT NULL, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
    console.log(">>> [DB] Initialization complete.");
  } catch (err) {
    console.warn(">>> [DB] Init Warning (Service will stay up):", err.message);
  }
};

export default pool;
