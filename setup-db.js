import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function setup() {
  console.log("🚀 Starting Database Setup...");
  
  const connectionConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  };

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log("✅ Connected to MySQL server.");

    const dbName = process.env.DB_NAME || "growth_discipline_db";
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`✅ Database '${dbName}' verified/created.`);

    await connection.query(`USE \`${dbName}\`;`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        name VARCHAR(255) UNIQUE NOT NULL, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        user_id INT, 
        activity VARCHAR(255) NOT NULL, 
        status VARCHAR(50) DEFAULT 'pending', 
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_response (
        id INT AUTO_INCREMENT PRIMARY KEY, 
        user_id INT, 
        prompt TEXT NOT NULL, 
        response TEXT NOT NULL, 
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        goal_name VARCHAR(255) NOT NULL,
        target_value INT DEFAULT 1,
        current_value INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log("✅ All tables verified/created.");
    await connection.end();
    console.log("🏁 Setup complete. You can now run 'node server.js'.");
  } catch (err) {
    console.error("❌ Setup Failed:", err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log("TIP: Check your DB_USER and DB_PASSWORD in .env");
    }
  }
}

setup();
