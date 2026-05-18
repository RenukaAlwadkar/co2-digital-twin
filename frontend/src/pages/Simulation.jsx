import React from 'react';

const Simulation = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-purple-600">Smart City Simulation Center</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 bg-white border border-gray-200 shadow-sm rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Environment Parameters</h2>
          
          <div className="space-y-6">
            <div>
              <label className="flex justify-between text-sm mb-2 text-gray-400">
                <span>Traffic Density</span> <span>75%</span>
              </label>
              <input type="range" className="w-full accent-purple-500" min="0" max="100" defaultValue="75" />
            </div>
            
            <div>
              <label className="flex justify-between text-sm mb-2 text-gray-400">
                <span>Factory Emission Level</span> <span>High</span>
              </label>
              <input type="range" className="w-full accent-orange-500" min="0" max="100" defaultValue="80" />
            </div>

            <div>
              <label className="flex justify-between text-sm mb-2 text-gray-400">
                <span>Tree Coverage (Green Zone)</span> <span>20%</span>
              </label>
              <input type="range" className="w-full accent-green-500" min="0" max="100" defaultValue="20" />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-600">Weather Effects</label>
              <select className="w-full bg-white border border-gray-300 text-gray-900 rounded p-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>Sunny</option>
                <option>Rainy (Reduces PM)</option>
                <option>Windy (Disperses Pollutants)</option>
                <option>Foggy (Traps Pollutants)</option>
              </select>
            </div>

            <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)]">
              Run Simulation
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Results */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl text-center">
              <h3 className="text-gray-500 text-sm mb-1 font-medium">Current AQI</h3>
              <p className="text-3xl font-bold text-yellow-500">85</p>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-red-50 animate-pulse"></div>
              <h3 className="text-gray-500 text-sm mb-1 font-medium relative z-10">Predicted AQI</h3>
              <p className="text-3xl font-bold text-red-600 relative z-10">142</p>
            </div>
            <div className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl text-center">
              <h3 className="text-gray-500 text-sm mb-1 font-medium">Impact Analysis</h3>
              <p className="text-lg font-bold text-red-500">+67% Pollution</p>
              <p className="text-xs text-red-600 mt-1 font-medium">High Risk Level</p>
            </div>
          </div>

          {/* Charts area */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 h-64 flex flex-col justify-center items-center">
            <h3 className="w-full text-left font-semibold text-gray-700 mb-4">Before vs After AQI Forecast</h3>
            <span className="text-gray-400 font-medium">[ Recharts: Combined Line/Bar Graph overlaying Current vs Simulated ]</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;