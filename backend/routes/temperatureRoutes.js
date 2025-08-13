const express = require("express");
const router = express.Router();
const {
  getAllTemperatures,
  getTemperatureHistory,
  getLatestTemperature,
} = require("../controllers/temperatureController");
const { adminOrUser, authenticate } = require("../middleware/auth");

router.get("/", authenticate, adminOrUser, getAllTemperatures);
router.get("/history", adminOrUser, getTemperatureHistory);
router.get("/history/:days", adminOrUser, getTemperatureHistory);
router.get("/latest", adminOrUser, getLatestTemperature); // New route

module.exports = router;
