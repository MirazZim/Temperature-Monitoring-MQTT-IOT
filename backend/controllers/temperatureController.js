const Temperature = require("../models/Temperature");

exports.getAllTemperatures = async (req, res) => {
  try {
    const temps = await Temperature.getAll();
    res.json(Array.isArray(temps) ? temps : []);
  } catch (err) {
    console.error(err.message);
    res.status(500).json([]);
  }
};

exports.getLatestTemperature = async (req, res) => {
  try {
    const temp = await Temperature.getLatest();
    res.json(temp);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
