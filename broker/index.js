const aedes = require('aedes')();
const { createServer } = require('aedes-server-factory');
const tls = require('tls');
const fs = require('fs');
const { authenticate, authorizePublish } = require('./security');
const db = require('./db');

// Production-grade TLS configuration
const tlsOptions = {
  key: fs.readFileSync('/path/to/private-key.pem'),
  cert: fs.readFileSync('/path/to/certificate.pem'),
  requestCert: true,
  rejectUnauthorized: true,
  minVersion: 'TLSv1.3'
};

aedes.authenticate = authenticate;
aedes.authorizePublish = authorizePublish;

// Store messages in DB
aedes.on('publish', async (packet, client) => {
  if (packet.topic.startsWith('devices/') && client) {
    const deviceId = packet.topic.split('/')[1];
    await db.storeMessage({
      deviceId,
      topic: packet.topic,
      message: packet.payload.toString(),
      qos: packet.qos
    });
  }
});

// Create secure MQTT server
const server = createServer(aedes, { 
  ws: true,
  tls: tlsOptions // Enable TLS encryption
});

const PORT = process.env.PORT || 8883; // Standard secure MQTT port
server.listen(PORT, () => {
  console.log(`Secure MQTT broker running on port ${PORT}`);
});