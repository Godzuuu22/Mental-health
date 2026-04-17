import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// MySQL connection configuration 
// For local development (XAMPP/WAMP), Host is usually 'localhost', User is 'root', and Password is empty.
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "growth_discipline_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Initializes the database tables required for the Growth & Discipline AI System.
 * Specifically required by the SE2 Final Laboratory.
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

    // 2. Habits table (Part of the core Laboratory requirements)
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

    // 3. AI responses table (For history and advisor context)
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

    console.log(">>> MySQL Database tables ready.");
  } catch (err) {
    console.error(">>> ERROR initializing MySQL database:", err.message);
    console.warn(">>> Make sure your MySQL server is running and credentials in .env are correct.");
  }
};

export default pool;
