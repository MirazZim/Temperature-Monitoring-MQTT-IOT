const mqtt = require('mqtt');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
require('dotenv').config();

// Configuration
const DEVICE_ID = process.env.DEVICE_ID || `sensor-${uuidv4()}`;
const DEVICE_SECRET = process.env.DEVICE_SECRET;
const BROKER_URL = process.env.BROKER_URL || 'mqtts://localhost:8883'; // TLS
const BUFFER_SIZE = parseInt(process.env.BUFFER_SIZE) || 5;
const INTERVAL = parseInt(process.env.INTERVAL) || 2000;

// Validate required credentials
if (!DEVICE_SECRET) {
  console.error('DEVICE_SECRET environment variable is required');
  process.exit(1);
}

// Production-grade connection options
const options = {
  clientId: DEVICE_ID,
  username: DEVICE_ID,
  password: DEVICE_SECRET,
  protocolVersion: 4, // MQTT v3.1.1
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 10000,
  rejectUnauthorized: true, // Verify server certificate
  ca: [fs.readFileSync('/path/to/ca-certificate.pem')] // Trusted CA
};

const client = mqtt.connect(BROKER_URL, options);

// Message buffer
let buffer = [];
const TOPIC = `devices/${DEVICE_ID}/temperature`;

client.on('connect', () => {
  console.log(`Device ${DEVICE_ID} securely connected to broker`);
  
  // Simulate temperature readings with realistic values
  setInterval(() => {
    const baseTemp = 22; // Base temperature
    const fluctuation = (Math.sin(Date.now() / 60000) * 5 + Math.random() * 2).toFixed(2);
    const temperature = (baseTemp + parseFloat(fluctuation)).toFixed(2);
    const timestamp = Date.now();
    
    // Add random noise to simulate real sensor
    const noisyTemp = (parseFloat(temperature) + (Math.random() - 0.5)).toFixed(2);
    
    buffer.push({ 
      temperature: noisyTemp, 
      timestamp,
      deviceId: DEVICE_ID,
      battery: (95 - buffer.length * 0.1).toFixed(2) // Simulate battery drain
    });
    
    if (buffer.length >= BUFFER_SIZE) {
      const payload = JSON.stringify({
        device: DEVICE_ID,
        readings: buffer,
        checksum: crypto.createHash('sha256').update(JSON.stringify(buffer)).digest('hex')
      });
      
      client.publish(TOPIC, payload, { qos: 1 }, (err) => {
        if (err) console.error('Publish error:', err.message);
      });
      
      console.log(`[${DEVICE_ID}] Sent ${BUFFER_SIZE} readings`);
      buffer = [];
    }
  }, INTERVAL);
});

// Enhanced error handling
client.on('error', (err) => {
  console.error('Connection error:', err.message);
});

// Reconnect logic
client.on('close', () => {
  console.log('Connection closed. Reconnecting...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Safely disconnecting device...');
  client.end(false, () => {
    process.exit();
  });
});