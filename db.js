import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * MySQL connection configuration
 * Supports both individual variables and a single MYSQL_URL (common for Railway/Render).
 */
const connectionConfig = process.env.MYSQL_URL || {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "railway", // Default to 'railway' for production compatibility
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(connectionConfig);

/**
 * Initializes the database tables required for the Growth & Discipline AI System.
 */
export const initDb = async () => {
  try {
    console.log(">>> Connecting to MySQL and initializing tables...");
    
    // 1. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Habits table
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

    // 3. AI responses table
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

    console.log(">>> Database initialization sequence complete.");
  } catch (err) {
    console.error(">>> ERROR initializing MySQL database:", err.message);
    console.warn(">>> CHECK: 1. Is your MySQL server running? 2. Are credentials correct? 3. Does the database exist?");
  }
};

export default pool;
