import { useState, useEffect, useRef, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AuthContext from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [temperatureData, setTemperatureData] = useState([]);
  const [stats, setStats] = useState(null);
  const [realtimeData, setRealtimeData] = useState([]);
  const wsRef = useRef(null);
  const MAX_POINTS = 100;

  // Fetch user's devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/devices', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch devices');
        
        const data = await response.json();
        setDevices(data);
        if (data.length > 0) setSelectedDevice(data[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchDevices();
  }, [user]);

  // Fetch historical data
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDevice) return;
      
      try {
        const response = await fetch(
          `http://localhost:3001/api/devices/${selectedDevice}/data`, 
          { headers: { 'Authorization': `Bearer ${user.token}` } }
        );
        
        if (!response.ok) throw new Error('Failed to fetch device data');
        
        const data = await response.json();
        setTemperatureData(data);
        
        // Calculate statistics
        if (data.length > 0) {
          const temps = data.map(d => parseFloat(d.message.temperature));
          const min = Math.min(...temps).toFixed(2);
          const max = Math.max(...temps).toFixed(2);
          const avg = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2);
          
          setStats({ min, max, avg });
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchData();
  }, [selectedDevice, user]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!selectedDevice) return;
    
    // Secure WebSocket connection
    wsRef.current = new WebSocket(`wss://localhost:3001/realtime?device=${selectedDevice}&token=${user.token}`);
    
    wsRef.current.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        setRealtimeData(prev => {
          const updated = [...prev, ...newData];
          return updated.slice(-MAX_POINTS); // Keep last 100 points
        });
      } catch (err) {
        console.error('Error parsing realtime data:', err);
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedDevice, user]);

  // Format data for chart
  const chartData = realtimeData.map((item, index) => ({
    name: `Reading ${index + 1}`,
    temperature: parseFloat(item.temperature),
    timestamp: new Date(item.timestamp).toLocaleTimeString()
  }));

  return (
    <div className="dashboard">
      <h1>Temperature Monitoring Dashboard</h1>
      
      <div className="device-selector">
        <label>Select Device: </label>
        <select 
          value={selectedDevice} 
          onChange={(e) => setSelectedDevice(e.target.value)}
        >
          {devices.map(device => (
            <option key={device.id} value={device.id}>
              {device.name} ({device.id})
            </option>
          ))}
        </select>
      </div>
      
      {selectedDevice && (
        <>
          <div className="temperature-stats">
            {stats && (
              <div className="stat-card">
                <h3>Current</h3>
                <p className="current-temp">
                  {realtimeData.length > 0 
                    ? `${parseFloat(realtimeData[realtimeData.length - 1].temperature).toFixed(2)}°C` 
                    : 'N/A'}
                </p>
              </div>
            )}
            {stats && (
              <>
                <div className="stat-card">
                  <h3>24h Min</h3>
                  <p>{stats.min}°C</p>
                </div>
                <div className="stat-card">
                  <h3>24h Max</h3>
                  <p>{stats.max}°C</p>
                </div>
                <div className="stat-card">
                  <h3>24h Avg</h3>
                  <p>{stats.avg}°C</p>
                </div>
              </>
            )}
          </div>
          
          <div className="chart-container">
            <h2>Real-time Temperature</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="timestamp" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip 
                  formatter={(value) => [`${value}°C`, 'Temperature']}
                  labelFormatter={(value) => `Time: ${value}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ff7300" 
                  activeDot={{ r: 8 }}
                  name="Temperature (°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="data-table">
            <h2>Historical Data</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Temperature (°C)</th>
                    <th>Battery</th>
                  </tr>
                </thead>
                <tbody>
                  {temperatureData.slice(0, 10).map((entry, index) => (
                    <tr key={index}>
                      <td>{new Date(entry.created_at).toLocaleString()}</td>
                      <td>{entry.message.temperature}</td>
                      <td>{entry.message.battery || 'N/A'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;