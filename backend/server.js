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
const EventEmitter = require("events");
require("dotenv").config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb", extended: true }));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({
  server: server,
  clientTracking: true,
  verifyClient: (info, done) => {
    const token = new URL(info.req.url, "http://localhost").searchParams.get(
      "token"
    );

    if (!token) return done(false, 401, "Unauthorized");

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return done(false, 401, "Invalid token");

      // Attach user to request for later use
      info.req.user = decoded;
      done(true);
    });
  },
});

// Message emitter for real-time updates
const messageEmitter = new EventEmitter();

// Handle realtime connections
wss.on("connection", (ws, req) => {
  const deviceId = new URL(req.url, "http://localhost").searchParams.get(
    "device"
  );
  const user = req.user;

  console.log(
    `WebSocket connection established for user ${user.id}, device ${deviceId}`
  );

  // Verify device access
  pool
    .query(`SELECT * FROM user_devices WHERE user_id = ? AND device_id = ?`, [
      user.id,
      deviceId,
    ])
    .then(([rows]) => {
      if (rows.length === 0) {
        ws.close(1008, "Device access denied");
        return;
      }

      // Subscribe to device messages
      const query = `
      SELECT * FROM messages 
      WHERE device_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `;

      // Send initial batch
      pool
        .query(query, [deviceId])
        .then(([rows]) => {
          ws.send(
            JSON.stringify(
              rows.map((row) => ({
                ...row,
                message: JSON.parse(row.message || "{}"),
              }))
            )
          );
        })
        .catch((err) => {
          console.error("Error fetching initial messages:", err);
        });

      // Listen for new messages
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

      // Add to our message listeners
      messageEmitter.on("newMessage", listener);

      ws.on("close", () => {
        console.log(
          `WebSocket connection closed for user ${user.id}, device ${deviceId}`
        );
        messageEmitter.off("newMessage", listener);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        messageEmitter.off("newMessage", listener);
      });
    })
    .catch((err) => {
      console.error("Database error:", err);
      ws.close(1011, "Internal error");
    });
});

// Message storage function
async function storeMessage({ deviceId, topic, message, qos }) {
  try {
    const [result] = await pool.query(
      "INSERT INTO messages (device_id, topic, message, qos) VALUES (?, ?, ?, ?)",
      [deviceId, topic, JSON.stringify(message), qos]
    );

    // Emit event for realtime updates
    messageEmitter.emit("newMessage", {
      id: result.insertId,
      device_id: deviceId,
      topic,
      message: JSON.stringify(message),
      qos,
      created_at: new Date(),
    });

    return result.insertId;
  } catch (error) {
    console.error("Error storing message:", error);
    throw error;
  }
}

// Example REST API routes
app.get("/api/devices", async (req, res) => {
  try {
    // Add your authentication middleware here
    const [rows] = await pool.query("SELECT * FROM devices");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/messages/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM messages WHERE device_id = ? ORDER BY created_at DESC LIMIT 100",
      [deviceId]
    );

    const messages = rows.map((row) => ({
      ...row,
      message: JSON.parse(row.message || "{}"),
    }));

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api", authRoutes);
app.use(deviceRoutes);
app.use(userRoutes);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is ready for connections`);
});

// Export for use in other modules
module.exports = { app, server, storeMessage, messageEmitter };
