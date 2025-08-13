const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const cors = require("cors");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const userRoutes = require("./routes/userRoutes");
const temperatureRoutes = require("./routes/temperatureRoutes");
const EventEmitter = require("events");
require("dotenv").config();

const MqttHandler = require("./mqtt/mqttHandler");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb", extended: true }));

const server = http.createServer(app);
const io = require("socket.io")(server, {
  transports: ["polling"],
  allowUpgrades: false,
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware to secure Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// Auto-join user room
io.on("connection", (socket) => {
  socket.join(`user_${socket.user.id}`);
  console.log(`User ${socket.user.id} joined room user_${socket.user.id}`);

  socket.on("disconnect", () => {
    console.log(
      `Client ${socket.user.id} disconnected from temperature stream`
    );
  });
});

// MQTT init
const mqttClient = new MqttHandler(io);
mqttClient.connect();

process.on("SIGINT", () => {
  mqttClient.stopSimulation();
  process.exit();
});

// WebSocket Server for device telemetry
const wss = new WebSocket.Server({
  server,
  clientTracking: true,
  verifyClient: (info, done) => {
    const token = new URL(info.req.url, "http://localhost").searchParams.get(
      "token"
    );
    if (!token) return done(false, 401, "Unauthorized");
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return done(false, 401, "Invalid token");
      info.req.user = decoded;
      done(true);
    });
  },
});

const messageEmitter = new EventEmitter();

// Handle device WebSocket connection
wss.on("connection", (ws, req) => {
  const deviceId = new URL(req.url, "http://localhost").searchParams.get(
    "device"
  );
  const user = req.user;
  pool
    .query(`SELECT * FROM user_devices WHERE user_id = ? AND device_id = ?`, [
      user.id,
      deviceId,
    ])
    .then(([rows]) => {
      if (rows.length === 0) return ws.close(1008, "Device access denied");

      pool
        .query(
          `SELECT * FROM messages WHERE device_id = ? ORDER BY created_at DESC LIMIT 100`,
          [deviceId]
        )
        .then(([rows]) =>
          ws.send(
            JSON.stringify(
              rows.map((row) => ({
                ...row,
                message: JSON.parse(row.message || "{}"),
              }))
            )
          )
        );

      const listener = (message) => {
        if (message.device_id === deviceId) {
          ws.send(
            JSON.stringify([
              {
                ...message,
                message: JSON.parse(message.message || "{}"),
              },
            ])
          );
        }
      };
      messageEmitter.on("newMessage", listener);

      ws.on("close", () => messageEmitter.off("newMessage", listener));
      ws.on("error", () => messageEmitter.off("newMessage", listener));
    });
});

async function storeMessage({ deviceId, topic, message, qos }) {
  const [result] = await pool.query(
    "INSERT INTO messages (device_id, topic, message, qos) VALUES (?, ?, ?, ?)",
    [deviceId, topic, JSON.stringify(message), qos]
  );
  messageEmitter.emit("newMessage", {
    id: result.insertId,
    device_id: deviceId,
    topic,
    message: JSON.stringify(message),
    qos,
    created_at: new Date(),
  });
  return result.insertId;
}

app.use("/api", authRoutes);
app.use("/api", deviceRoutes);
app.use("/api", userRoutes);
app.use("/api/temperature", temperatureRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = { app, server, storeMessage, messageEmitter };
