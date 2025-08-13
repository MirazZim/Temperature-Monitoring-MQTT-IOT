const Device = require("../models/Device");
const Message = require("../models/Message");
const generateSecret = require("../utils/generateSecret");
const pool = require("../config/db"); // ADD THIS IMPORT

exports.createDevice = async (req, res) => {
  try {
    const { name } = req.body;
    const deviceId = `device-${Date.now()}`;
    const secret = generateSecret();

    await Device.create(deviceId, name, secret);
    res.status(201).json({ id: deviceId, name, secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assignDevice = async (req, res) => {
  try {
    const { userId, deviceId } = req.body;
    await Device.assignToUser(userId, deviceId);
    res.status(201).json({ message: "Device assigned successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDevices = async (req, res) => {
  try {
    let devices;

    if (req.user.role === "admin") {
      devices = await Device.getAll();
    } else {
      const [rows] = await pool.query(
        `SELECT d.id, d.name 
         FROM devices d
         JOIN user_devices ud ON d.id = ud.device_id
         WHERE ud.user_id = ?`,
        [req.user.id]
      );
      devices = rows;
    }

    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDeviceData = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const userId = req.user.id;

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
};

exports.simulateMessage = async (req, res) => {
  try {
    const { deviceId, topic, message } = req.body;
    await Message.store(deviceId, topic, message, 1);
    res.status(201).json({ message: "Message stored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
