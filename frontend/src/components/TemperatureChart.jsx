import React, { useState, useEffect, useContext } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import AuthContext from '../context/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const TemperatureChart = () => {
  const { user } = useContext(AuthContext);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDays, setSelectedDays] = useState(7);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3001/api/temperature/history/${selectedDays}`,
          {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch historical data');
        }

        const data = await response.json();
        
        const labels = data.map(item => item.timestamp);
        const temperatures = data.map(item => parseFloat(item.average_temp));
        const minTemps = data.map(item => parseFloat(item.min_temp));
        const maxTemps = data.map(item => parseFloat(item.max_temp));

        setChartData({
          labels,
          datasets: [
            {
              label: 'Average Temperature',
              data: temperatures,
              borderColor: '#4cc9f0',
              backgroundColor: 'rgba(76, 201, 240, 0.2)',
              tension: 0.1,
              fill: false,
            },
            {
              label: 'Min Temperature',
              data: minTemps,
              borderColor: '#4361ee',
              backgroundColor: 'rgba(67, 97, 238, 0.2)',
              tension: 0.1,
              fill: false,
              borderDash: [5, 5],
            },
            {
              label: 'Max Temperature',
              data: maxTemps,
              borderColor: '#f72585',
              backgroundColor: 'rgba(247, 37, 133, 0.2)',
              tension: 0.1,
              fill: false,
              borderDash: [5, 5],
            }
          ]
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [user, selectedDays]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f8f9fa'
        }
      },
      title: {
        display: true,
        text: `Temperature History - Last ${selectedDays} Days`,
        color: '#f8f9fa'
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            hour: 'MMM dd HH:mm',
            day: 'MMM dd'
          }
        },
        title: {
          display: true,
          text: 'Time',
          color: '#f8f9fa'
        },
        ticks: {
          color: '#f8f9fa'
        },
        grid: {
          color: 'rgba(248, 249, 250, 0.1)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#f8f9fa'
        },
        beginAtZero: false,
        ticks: {
          color: '#f8f9fa'
        },
        grid: {
          color: 'rgba(248, 249, 250, 0.1)'
        }
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return (
    <div className="chart-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Temperature History</h2>
        <select 
          value={selectedDays} 
          onChange={(e) => setSelectedDays(parseInt(e.target.value))}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#1e1e2c',
            color: '#f8f9fa',
            border: '1px solid #4cc9f0',
            borderRadius: '6px'
          }}
        >
          <option value={1}>Last 24 hours</option>
          <option value={3}>Last 3 days</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>
      
      <div className="chart-wrapper">
        {loading ? (
          <div style={{ 
            height: '400px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            Loading chart...
          </div>
        ) : error ? (
          <div style={{ 
            height: '400px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#f72585'
          }}>
            Error loading chart: {error}
          </div>
        ) : !chartData || chartData.labels.length === 0 ? (
          <div style={{ 
            height: '400px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            No historical data available
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default TemperatureChart;
