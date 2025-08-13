import TemperatureChart from './TemperatureChart.jsx';
import CurrentTemperature from './CurrentTemperature.jsx';
import DeviceStatus from './DeviceStatus.jsx';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Temperature Monitoring System</h1>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <CurrentTemperature />
        </div>
        
        <div className="dashboard-card">
          <DeviceStatus />
        </div>
        
        <div className="dashboard-card full-width">
          <TemperatureChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
