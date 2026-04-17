import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * Advanced DB Configuration
 * We use a URL-first approach for Railway, with a fallback object for local dev.
 */
let pool;

if (process.env.MYSQL_URL) {
  console.log(">>> [DB] Using MYSQL_URL for connection.");
  pool = mysql.createPool(process.env.MYSQL_URL);
} else {
  console.log(">>> [DB] Using separate variables for connection.");
  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "railway",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false }
  });
}

/**
 * Initializes the database tables.
 */
export const initDb = async () => {
  try {
    console.log(">>> [DB] Pinging database...");
    await pool.query("SELECT 1");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        activity VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_response (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log(">>> [DB] All tables verified/created.");
  } catch (err) {
    console.error(">>> [DB] CONNECTION ERROR:", err.message);
  }
};

export default pool;
