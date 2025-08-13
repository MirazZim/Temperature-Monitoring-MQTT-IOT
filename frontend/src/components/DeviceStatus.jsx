import { useState, useEffect, useContext } from 'react';
import { FaWifi, FaSignal } from 'react-icons/fa';
import { createSocket } from '../lib/socket';
import AuthContext from '../context/AuthContext';

const DeviceStatus = () => {
  const { user } = useContext(AuthContext);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');

  useEffect(() => {
    if (!user) return;

    const socket = createSocket(user.token);

    socket.on('connect', () => {
      setIsOnline(true);
      setConnectionStatus('Connected');
      setLastSeen(new Date());
    });

    socket.on('disconnect', () => {
      setIsOnline(false);
      setConnectionStatus('Disconnected');
    });

    socket.on('temperatureUpdate', () => {
      setLastSeen(new Date());
      setIsOnline(true);
    });

    socket.on('connect_error', () => {
      setIsOnline(false);
      setConnectionStatus('Connection Error');
    });

    return () => socket.disconnect();
  }, [user]);

  return (
    <div className="device-status">
      <h2>Device Status</h2>
      <div className="status-indicator">
        <div className={`status-light ${isOnline ? 'online' : 'offline'}`}></div>
        <span>{connectionStatus}</span>
      </div>
      
      {isOnline ? (
        <div className="status-details">
          <p><FaWifi /> Connected to MQTT Broker</p>
          <p><FaSignal /> Signal: Strong</p>
          <p>User ID: {user?.id}</p>
        </div>
      ) : (
        <div className="status-details">
          <p>Device disconnected</p>
          {lastSeen && (
            <p>Last seen: {lastSeen.toLocaleTimeString()}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DeviceStatus;
