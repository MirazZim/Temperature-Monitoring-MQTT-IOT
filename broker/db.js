const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log("Database pool created successfully");

    // Verify connection
    await pool.query("SELECT 1");
    console.log(`Connected to MySQL database: ${process.env.DB_DATABASE}`);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

const storeMessage = async ({ deviceId, topic, message, qos }) => {
  try {
    const query = `
            INSERT INTO messages (device_id, topic, message, qos, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        `;
    await pool.query(query, [deviceId, topic, message, qos]);
  } catch (error) {
    console.error("Error storing message:", error);
  }
};

module.exports = {
  connectDB,
  storeMessage,
};
