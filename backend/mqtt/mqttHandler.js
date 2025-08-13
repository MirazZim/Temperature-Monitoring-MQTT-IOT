const mqtt = require("mqtt");
const Temperature = require("../models/Temperature");
const User = require("../models/User");

class MqttHandler {
  constructor(io) {
    this.io = io;
    this.mqttClient = null;
    this.host = process.env.MQTT_HOST || "mqtt://broker.hivemq.com";
    this.simulationInterval = null;
  }

  connect() {
    this.mqttClient = mqtt.connect(this.host);
    this.mqttClient.on("connect", () => {
      console.log("✅ MQTT connected");
      this.mqttClient.subscribe("home/+/temperature", { qos: 0 });
      if (process.env.SIMULATE_SENSOR === "true") this.startSimulation();
    });

    this.mqttClient.on("message", async (topic, message) => {
      const parts = topic.split("/");
      const userId = parseInt(parts[1]);
      console.log("userid", userId);
      if (!userId) return;

      const tempValue = parseFloat(message.toString());
      const newTemp = await Temperature.create({
        user_id: userId,
        value: tempValue,
        location: "living-room",
      });

      console.log(`📊 Temperature update for user ${userId}: ${tempValue}°C`);

      this.io.to(`user_${userId}`).emit("temperatureUpdate", {
        id: newTemp.insertId,
        value: tempValue,
        location: "living-room",
        created_at: new Date(),
      });
    });
  }

  async startSimulation() {
    console.log("🔄 Starting temperature simulation...");

    this.simulationInterval = setInterval(async () => {
      try {
        // Fetch users EVERY time to get newly registered users
        const users = await User.getAll();

        if (users.length === 0) {
          console.log("⚠️ No users found for temperature simulation");
          return;
        }

        console.log(`📡 Simulating temperature for ${users.length} users`);

        users.forEach((user) => {
          const tempValue = (Math.random() * 14 + 18).toFixed(2);
          const topic = `home/${user.id}/temperature`;
          this.mqttClient.publish(topic, tempValue);
          console.log(
            `📤 Published ${tempValue}°C for user ${user.id} (${user.username})`
          );
        });
      } catch (error) {
        console.error("❌ Error in temperature simulation:", error);
      }
    }, 10000); // Every 10 seconds
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      console.log("🛑 Temperature simulation stopped");
    }
  }
}

module.exports = MqttHandler;
