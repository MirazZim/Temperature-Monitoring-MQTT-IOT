const mqtt = require("mqtt");
const Temperature = require("../models/Temperature");

class MqttHandler {
  constructor(io) {
    this.io = io;
    this.mqttClient = null;
    this.host = process.env.MQTT_HOST || "mqtt://broker.hivemq.com";
    this.simulationInterval = null;
  }

  connect() {
    this.mqttClient = mqtt.connect(this.host);

    this.mqttClient.on("error", (err) => console.error(err));

    this.mqttClient.on("connect", () => {
      console.log("MQTT connected");
      this.mqttClient.subscribe("home/temperature", { qos: 0 });

      if (process.env.SIMULATE_SENSOR === "true") {
        this.startSimulation();
      }
    });

    this.mqttClient.on("message", async (topic, message) => {
      if (topic === "home/temperature") {
        try {
          const tempValue = parseFloat(message.toString());
          const newTemp = await Temperature.create({
            value: tempValue,
            location: "living-room",
          });

          if (this.io) {
            this.io.emit("temperatureUpdate", {
              id: newTemp.insertId,
              value: tempValue,
              location: "living-room",
              created_at: new Date(),
            });
          }
          console.log("Saved temperature to DB");
        } catch (err) {
          console.error("Error saving temperature:", err);
        }
      }
    });

    this.mqttClient.on("close", () => this.stopSimulation());
  }

  startSimulation() {
    if (this.simulationInterval) return;
    this.simulationInterval = setInterval(() => {
      if (!this.mqttClient.connected) return;
      const tempValue = (Math.random() * 14 + 18).toFixed(2);
      this.mqttClient.publish("home/temperature", tempValue);
      console.log(`Simulated temp: ${tempValue}°C`);
    }, 10000);
  }

  stopSimulation() {
    clearInterval(this.simulationInterval);
    this.simulationInterval = null;
  }
}

module.exports = MqttHandler;
