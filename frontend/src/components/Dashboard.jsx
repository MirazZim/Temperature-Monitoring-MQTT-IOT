import { useState, useEffect, useContext } from "react";
import { createSocket } from "../lib/socket";
import AuthContext from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [realtimeData, setRealtimeData] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const MAX_POINTS = 100;

  useEffect(() => {
    if (!user) return;
    
    console.log("🔗 Connecting to socket for user:", user.id);
    const socket = createSocket(user.token);
    
    socket.on("connect", () => {
      console.log("✅ Socket.io connected");
      setConnectionStatus('Connected');
    });
    
    socket.on("disconnect", () => {
      console.log("❌ Socket.io disconnected");
      setConnectionStatus('Disconnected');
    });
    
    socket.on("temperatureUpdate", (payload) => {
      console.log("🌡️ Temperature update received:", payload);
      setRealtimeData((prev) => [...prev, payload].slice(-MAX_POINTS));
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setConnectionStatus('Connection Error');
    });

    return () => {
      console.log("🔌 Disconnecting socket");
      socket.disconnect();
    };
  }, [user]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Your Live Temperatures</h1>
      <p><strong>User ID:</strong> {user?.id}</p>
      <p><strong>Connection Status:</strong> <span style={{
        color: connectionStatus === 'Connected' ? 'green' : 'red'
      }}>{connectionStatus}</span></p>
      
      {realtimeData.length === 0 ? (
        <div style={{ 
          padding: '20px', 
          border: '1px solid #ccc', 
          borderRadius: '5px',
          backgroundColor: '#f9f9f9'
        }}>
          <p>No temperature data yet. Waiting for updates...</p>
          <p><em>Temperature data should appear every 10 seconds if the simulation is running.</em></p>
        </div>
      ) : (
        <div>
          <h3>Recent Temperature Readings:</h3>
          {realtimeData.map((t, i) => (
            <div key={i} style={{ 
              padding: '10px', 
              margin: '5px 0', 
              border: '1px solid #ddd',
              borderRadius: '3px',
              backgroundColor: '#f8f9fa'
            }}>
              <strong>{t.value}°C</strong> at {new Date(t.created_at).toLocaleTimeString()}
              <br />
              <small>Location: {t.location}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
