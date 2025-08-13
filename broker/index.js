const aedes = require("aedes")();
const { createServer } = require("aedes-server-factory");
const { authenticate, authorizePublish } = require("./security");
const db = require("./db");

// Load environment variables
require("dotenv").config();

aedes.authenticate = authenticate;
aedes.authorizePublish = authorizePublish;

// Store messages in DB
aedes.on("publish", async (packet, client) => {
  if (packet.topic.startsWith("devices/") && client) {
    const deviceId = packet.topic.split("/")[1];
    await db.storeMessage({
      deviceId,
      topic: packet.topic,
      message: packet.payload.toString(),
      qos: packet.qos,
    });
  }
});

// Create MQTT server with WebSocket support
const server = createServer(aedes, {
  ws: true, // Enable WebSocket support
});

const PORT = process.env.MQTT_PORT || 1883; // Standard MQTT port
server.listen(PORT, () => {
  console.log(`Secure MQTT broker running on port ${PORT}`);
});
