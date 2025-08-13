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
}

module.exports = Temperature;
