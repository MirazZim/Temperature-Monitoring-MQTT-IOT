const Temperature = require("../models/Temperature");

exports.getAllTemperatures = async (req, res) => {
  const temps =
    req.user.role === "admin"
      ? await Temperature.getAll()
      : await Temperature.getAllForUser(req.user.id);
  res.json(temps);
};

exports.getTemperatureHistory = async (req, res) => {
  try {
    const days = parseInt(req.params.days || req.query.days) || 7;
    const userId = req.user.id;

    const history =
      req.user.role === "admin"
        ? await Temperature.getHistoryForDays(days)
        : await Temperature.getHistoryForUserAndDays(userId, days);

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// New method for latest temperature
exports.getLatestTemperature = async (req, res) => {
  try {
    const userId = req.user.id;

    const latest =
      req.user.role === "admin"
        ? await Temperature.getLatest()
        : await Temperature.getLatestForUser(userId);

    res.json(latest);
  } catch (err) {
    console.log("🚀 ~ err:", err);
    res.status(500).json({ error: err.message });
  }
};
