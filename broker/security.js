const db = require('./db');
const bcrypt = require('bcryptjs'); // Move bcrypt to top-level

// Device authentication
async function authenticate(client, username, password, callback) {
  try {
    console.log(`Authenticating device: ${username}`);
    const isValid = await db.authenticateDevice(username, password.toString());
    
    if (isValid) {
      console.log(`Authentication successful for: ${username}`);
      callback(null, true);
    } else {
      console.log(`Authentication failed for: ${username}`);
      const error = new Error('Authentication failed');
      error.returnCode = 4; // MQTT bad username/password
      callback(error, false);
    }
  } catch (err) {
    console.error('Authentication error:', err);
    callback(err, false);
  }
}

// Authorization rules
function authorizePublish(client, packet, callback) {
  const expectedPrefix = `devices/${client.id}/`;
  const validTopic = packet.topic.startsWith(expectedPrefix);
  
  if (!validTopic) {
    console.warn(`Unauthorized publish attempt: ${client.id} to ${packet.topic}`);
  }
  
  callback(null, validTopic);
}

module.exports = { authenticate, authorizePublish };