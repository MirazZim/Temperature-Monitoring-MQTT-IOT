const express = require("express");
const router = express.Router();
const { getAllTemperatures } = require("../controllers/temperatureController");
const { adminOrUser } = require("../middleware/auth");

router.get("/", adminOrUser, getAllTemperatures);

module.exports = router;
