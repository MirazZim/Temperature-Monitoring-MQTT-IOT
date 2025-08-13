const pool = require("../config/db");

class Temperature {
  static async create(temperatureData) {
    const [result] = await pool.query(
      "INSERT INTO temperatures (value, location) VALUES (?, ?)",
      [temperatureData.value, temperatureData.location]
    );
    return result;
  }

  static async getAll(limit = 100) {
    const [rows] = await pool.query(
      "SELECT * FROM temperatures ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    return rows;
  }

  static async getLatest() {
    const [rows] = await pool.query(
      "SELECT * FROM temperatures ORDER BY created_at DESC LIMIT 1"
    );
    return rows[0] || null;
  }
}

module.exports = Temperature;
