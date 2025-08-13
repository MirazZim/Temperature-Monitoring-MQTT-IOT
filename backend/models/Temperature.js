const pool = require("../config/db");

class Temperature {
  static async create({ user_id, value, location }) {
    const [result] = await pool.query(
      "INSERT INTO temperatures (user_id, value, location) VALUES (?, ?, ?)",
      [user_id, value, location]
    );
    return result;
  }

  static async getAll() {
    const [rows] = await pool.query(
      "SELECT * FROM temperatures ORDER BY created_at DESC"
    );
    return rows;
  }

  static async getAllForUser(userId) {
    const [rows] = await pool.query(
      "SELECT * FROM temperatures WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  // New methods for latest temperature
  static async getLatest() {
    const [rows] = await pool.query(
      "SELECT * FROM temperatures ORDER BY created_at DESC LIMIT 1"
    );
    return rows[0] || null;
  }

  static async getLatestForUser(userId) {
    const [rows] = await pool.query(
      "SELECT * FROM temperatures WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    return rows[0] || null;
  }

  static async getHistoryForDays(days) {
    const [rows] = await pool.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as timestamp,
        AVG(value) as average_temp,
        MIN(value) as min_temp,
        MAX(value) as max_temp,
        COUNT(*) as readings_count
      FROM temperatures 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:%i')
      ORDER BY created_at ASC`,
      [days]
    );
    return rows;
  }

  static async getHistoryForUserAndDays(userId, days) {
    const [rows] = await pool.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as timestamp,
        AVG(value) as average_temp,
        MIN(value) as min_temp,
        MAX(value) as max_temp,
        COUNT(*) as readings_count
      FROM temperatures 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d %H:%i')
      ORDER BY created_at ASC`,
      [userId, days]
    );
    return rows;
  }
}

module.exports = Temperature;
