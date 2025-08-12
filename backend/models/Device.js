const express = require("express");
const router = express.Router();
const {
  loginlogin,
  register,
  authenticate,
  adminOnly,
  userOnly,
  adminOrUser,
} = require("../middleware/auth");
const Device = require("../models/Device");

// Get all devices (admin only)
router.get("/", adminOnly, async (req, res) => {
  try {
    const devices = await Device.findAll();
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get device data (admin or owner)
router.get("/:id/data", adminOrUser, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const userId = req.user.id;

    // Check if user has access to device
    const hasAccess =
      req.user.role === "admin" ||
      (await Device.userHasAccess(userId, deviceId));

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    const data = await Device.getMessages(deviceId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
