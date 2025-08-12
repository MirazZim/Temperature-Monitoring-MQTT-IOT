const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('Creating DB pool for:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('Successfully connected to MySQL database!');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

// Device authentication
async function authenticateDevice(deviceId, secret) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM devices WHERE id = ?',
      [deviceId]
    );
    
    if (rows.length === 0) {
      console.log(`Device not found: ${deviceId}`);
      return false;
    }
    
    const device = rows[0];
    return bcrypt.compare(secret, device.secret);
  } catch (err) {
    console.error('Authentication query error:', err);
    return false;
  }
}

// Store message
async function storeMessage({ deviceId, topic, message, qos }) {
  try {
    await pool.query(
      'INSERT INTO messages (device_id, topic, message, qos) VALUES (?, ?, ?, ?)',
      [deviceId, topic, message, qos]
    );
  } catch (err) {
    console.error('Message store error:', err);
  }
}

module.exports = { authenticateDevice, storeMessage };