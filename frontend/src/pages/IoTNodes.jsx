import React, { useState, useEffect } from 'react';
import axios from 'axios';

const IoTNodes = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/sensors/latest');
        setNodes(response.data);
      } catch (error) {
        console.error("Error fetching nodes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNodes();
    const interval = setInterval(fetchNodes, 2000); // Poll every 2s to match dashboard
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Live Node Monitoring</h1>
          <p className="text-xs text-gray-400 mt-1">🔄 Live — updates every 2s</p>
        </div>
      </div>
      
      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading node data...</div>
      ) : nodes.length === 0 ? (
        <div className="text-gray-500">No active nodes connected to MQTT.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((node) => {
            const temp   = node.temperature !== undefined ? `${node.temperature}°C` : 'N/A';
            const hum    = node.humidity    !== undefined ? `${node.humidity}%`      : 'N/A';
            const pres   = node.pressure    !== undefined ? node.pressure            : 'N/A';
            const mq135  = node.mq135       !== undefined ? node.mq135               : 'N/A';
            const mq7    = node.mq7         !== undefined ? node.mq7                 : 'N/A';
            const light  = node.light       !== undefined ? `${node.light}%`         : 'N/A';
            
            // Use backend-calculated AQI (7-step engine)
            const estAqi = node.estAqi ?? 'N/A';

            return (
              <div key={node.nodeId} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 transition-colors shadow-sm">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-mono text-blue-600 font-bold text-lg">{node.nodeId}</h3>
                    {node.city && (
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">📍 {node.city}, {node.state || ''}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200 font-medium animate-pulse">● Live</span>
                  </div>
                </div>

                {/* Body Gauges */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Temp', value: temp, color: 'border-orange-500' },
                    { label: 'Hum', value: hum, color: 'border-blue-500' },
                    { label: 'Pres', value: pres, color: 'border-gray-500' },
                    { label: 'MQ135', value: mq135, color: 'border-yellow-500' },
                    { label: 'MQ7', value: mq7, color: 'border-red-500' },
                    { label: 'Light', value: light, color: 'border-indigo-500' }
                  ].map((gauge, i) => (
                    <div key={i} className="flex flex-col items-center justify-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center mb-2 ${gauge.color}`}>
                        <span className="text-[10px] font-bold text-gray-700">{gauge.value}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 uppercase text-center font-semibold">{gauge.label}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end pt-4 border-t border-gray-200 text-xs">
                  <div className="space-y-1">
                    <div className="text-gray-500">
                      Last Sync:{' '}
                      <span className="text-gray-900 font-medium">
                        {new Date(node.createdAt || node.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-500">Battery: <span className="text-green-600 font-medium">100%</span> 🔌</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500 mb-1 font-semibold text-[10px] uppercase">Est. AQI</div>
                    <div className={`text-2xl font-bold ${
                      estAqi > 300 ? 'text-red-800' :
                      estAqi > 200 ? 'text-red-500' :
                      estAqi > 100 ? 'text-orange-500' :
                      estAqi > 50 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {estAqi}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IoTNodes;