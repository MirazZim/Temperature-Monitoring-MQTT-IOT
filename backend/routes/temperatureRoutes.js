const express = require("express");
const router = express.Router();
const {
  getAllTemperatures,
  getLatestTemperature,
} = require("../controllers/temperatureController");

router.get("/", getAllTemperatures);
router.get("/latest", getLatestTemperature);

module.exports = router;
