import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';

const DeviceManagement = () => {
  const { user } = useContext(AuthContext);
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [newDevice, setNewDevice] = useState({ name: '' });
  const [assignment, setAssignment] = useState({ userId: '', deviceId: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch devices
        const devicesRes = await fetch('http://localhost:3001/api/devices', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const devicesData = await devicesRes.json();
        setDevices(devicesData);

        // Fetch users
        const usersRes = await fetch('http://localhost:3001/api/users', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const usersData = await usersRes.json();
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [user]);

  const handleCreateDevice = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/devices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(newDevice)
      });

      if (!response.ok) {
        throw new Error('Failed to create device');
      }

      const data = await response.json();
      alert(`Device created! ID: ${data.id}\nSecret: ${data.secret}`);
      
      // Refresh devices list
      const devicesRes = await fetch('http://localhost:3001/api/devices', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const devicesData = await devicesRes.json();
      setDevices(devicesData);
      
      // Reset form
      setNewDevice({ name: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignDevice = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/devices/assign', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(assignment)
      });

      if (!response.ok) {
        throw new Error('Failed to assign device');
      }

      alert('Device assigned successfully');
      setAssignment({ userId: '', deviceId: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="device-management">
      <h2>Device Management</h2>
      
      <div className="section">
        <h3>Create New Device</h3>
        <div className="form-group">
          <label>Device Name</label>
          <input
            type="text"
            value={newDevice.name}
            onChange={(e) => setNewDevice({ name: e.target.value })}
          />
        </div>
        <button onClick={handleCreateDevice}>Create Device</button>
      </div>
      
      <div className="section">
        <h3>Assign Device to User</h3>
        <div className="form-group">
          <label>User</label>
          <select
            value={assignment.userId}
            onChange={(e) => setAssignment({ ...assignment, userId: e.target.value })}
          >
            <option value="">Select User</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.role})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Device</label>
          <select
            value={assignment.deviceId}
            onChange={(e) => setAssignment({ ...assignment, deviceId: e.target.value })}
          >
            <option value="">Select Device</option>
            {devices.map(device => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.id})
              </option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={handleAssignDevice}
          disabled={!assignment.userId || !assignment.deviceId}
        >
          Assign Device
        </button>
      </div>
      
      <div className="section">
        <h3>Existing Devices</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(device => (
              <tr key={device.id}>
                <td>{device.id}</td>
                <td>{device.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeviceManagement;