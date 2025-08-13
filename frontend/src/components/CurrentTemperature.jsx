import { useState, useEffect, useContext } from 'react';
import { FaThermometerHalf } from 'react-icons/fa';
import { createSocket } from '../lib/socket';
import AuthContext from '../context/AuthContext';

const CurrentTemperature = () => {
  const { user } = useContext(AuthContext);
  const [currentTemp, setCurrentTemp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchLatestTemp = async () => {
        console.log('token', user.token);
      try {
        const response = await fetch('http://localhost:3001/api/temperature/latest', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCurrentTemp(data);
        }
      } catch (err) {
        console.error('Error fetching latest temperature:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestTemp();

    // Setup socket for real-time updates
    const socket = createSocket(user.token);
    
    socket.on('temperatureUpdate', (newTemp) => {
      setCurrentTemp(newTemp);
    });

    return () => socket.disconnect();
  }, [user]);

  if (loading) {
    return (
      <div className="current-temp">
        <h2><FaThermometerHalf /> Current Temperature</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="current-temp">
      <h2><FaThermometerHalf /> Current Temperature</h2>
      {currentTemp ? (
        <div className="temp-display">
          <div className="temp-value">
            {typeof currentTemp.value === 'number' 
              ? currentTemp.value.toFixed(1) 
              : 'N/A'} °C
          </div>
          <div className="temp-meta">
            <p>Location: {currentTemp.location || 'Living Room'}</p>
            <p>Last updated: {
              currentTemp.created_at 
                ? new Date(currentTemp.created_at).toLocaleTimeString() 
                : 'N/A'
            }</p>
          </div>
        </div>
      ) : (
        <div className="temp-display">
          <p>No temperature data available</p>
        </div>
      )}
    </div>
  );
};

export default CurrentTemperature;
