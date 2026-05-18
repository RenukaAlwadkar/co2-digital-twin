import React from 'react';

const Alerts = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-red-600">Alert Monitoring Center</h1>
        <select className="bg-white border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option>All Severities</option>
          <option>Critical</option>
          <option>Warning</option>
          <option>Info</option>
        </select>
      </div>

      <div className="space-y-4">
        {/* Severe AQI Alert */}
        <div className="bg-white border-2 border-red-200 rounded-xl p-5 relative overflow-hidden shadow-sm animate-[pulse_3s_ease-in-out_infinite]">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded uppercase tracking-wider">Critical Alert</span>
                <span className="text-gray-500 text-sm">10 mins ago</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Severe AQI Detected in Industrial Park</h3>
              <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                <div><span className="text-gray-500 block">AQI Value</span><span className="font-bold text-red-600 text-lg">342</span></div>
                <div><span className="text-gray-500 block">City Zone</span><span>Industrial Park Sector 4</span></div>
                <div><span className="text-gray-500 block">Severity</span><span className="text-red-600 font-medium">Hazardous</span></div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-700 transition-colors">✕</button>
          </div>
        </div>

        {/* CO Warning Alert */}
        <div className="bg-white border border-orange-200 rounded-xl p-5 relative shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded uppercase tracking-wider">Warning</span>
                <span className="text-gray-500 text-sm">45 mins ago</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Elevated Carbon Monoxide Levels</h3>
              <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                <div><span className="text-gray-500 block">Node ID</span><span className="font-mono text-blue-600">NODE-045</span></div>
                <div><span className="text-gray-500 block">CO Level</span><span className="text-orange-600 font-bold">12.5 ppm</span></div>
                <div><span className="text-gray-500 block">Risk Level</span><span className="text-orange-600 font-medium">Moderate</span></div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-700 transition-colors">✕</button>
          </div>
        </div>

        {/* Sensor Failure Alert */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 relative shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-400"></div>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded uppercase tracking-wider">System Info</span>
                <span className="text-gray-500 text-sm">2 hours ago</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sensor Connection Lost</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                <div><span className="text-gray-500 block">Node ID</span><span className="font-mono text-blue-600">NODE-112</span></div>
                <div><span className="text-gray-500 block">Error Type</span><span>Timeout / Unreachable</span></div>
                <div className="col-span-2"><span className="text-gray-500 block">Last Online</span><span>2026-05-18 15:30:00</span></div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-700 transition-colors">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;