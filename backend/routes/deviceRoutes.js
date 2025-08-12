const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
  createDevice,
  assignDevice,
  getDevices,
  getDeviceData,
  simulateMessage,
} = require("../controllers/deviceController");

router.post("/", authenticate.adminOnly, createDevice);
router.post("/assign", authenticate.adminOnly, assignDevice);
router.get("/", authenticate.adminOrUser, getDevices);
router.get("/:id/data", authenticate.adminOrUser, getDeviceData);
router.post("/simulate", authenticate.adminOnly, simulateMessage);

module.exports = router;
