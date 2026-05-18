import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { MapPin, Radio, Satellite, ChevronRight, Info } from 'lucide-react';

const getAqiColor = (aqi) => {
  if (!aqi) return '#9ca3af';
  if (aqi <= 50) return '#16a34a';
  if (aqi <= 100) return '#65a30d';
  if (aqi <= 200) return '#ca8a04';
  if (aqi <= 300) return '#ea580c';
  if (aqi <= 400) return '#dc2626';
  return '#7f1d1d';
};

const getAqiBg = (aqi) => {
  if (!aqi) return 'bg-gray-50';
  if (aqi <= 50) return 'bg-green-50';
  if (aqi <= 100) return 'bg-lime-50';
  if (aqi <= 200) return 'bg-yellow-50';
  if (aqi <= 300) return 'bg-orange-50';
  if (aqi <= 400) return 'bg-red-50';
  return 'bg-red-100';
};

const NodeSelector = () => {
  const { aqiNodes, sensorNodes, selectedNode, selectNode, baselineConditions } = useSimulation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('aqicn');

  const filteredAqi = aqiNodes.filter(n =>
    (n.city || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSensors = sensorNodes.filter(n =>
    (n.city || n.nodeId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <MapPin size={15} className="text-purple-600"/> Select Monitoring Node
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Simulation will use this node's real live data as baseline</p>
      </div>

      {/* Tab */}
      <div className="flex border-b border-gray-100">
        <button onClick={() => setActiveTab('aqicn')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === 'aqicn' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-400'}`}>
          <Satellite size={12}/> AQICN Stations ({aqiNodes.length})
        </button>
        <button onClick={() => setActiveTab('iot')}
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === 'iot' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-400'}`}>
          <Radio size={12}/> IoT Nodes ({sensorNodes.length})
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search city or node..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'aqicn' && (
          <div className="divide-y divide-gray-50">
            {filteredAqi.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">No stations found</p>
            )}
            {filteredAqi.map((node, i) => {
              const isSelected = selectedNode?.city === node.city;
              return (
                <button key={i} onClick={() => selectNode(node, 'aqicn')}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-all ${isSelected ? 'bg-purple-50 border-l-2 border-purple-500' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{node.city}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold" style={{color: getAqiColor(node.aqi)}}>AQI {node.aqi}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getAqiBg(node.aqi)}`}
                        style={{color: getAqiColor(node.aqi)}}>{node.category}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      PM2.5: {node.pollutants?.pm25 || '--'} · NO2: {node.pollutants?.no2 || '--'}
                    </p>
                  </div>
                  {isSelected
                    ? <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"/>
                    : <ChevronRight size={12} className="text-gray-300 flex-shrink-0"/>}
                </button>
              );
            })}
          </div>
        )}

        {activeTab === 'iot' && (
          <div className="divide-y divide-gray-50">
            {filteredSensors.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">No IoT nodes found</p>
            )}
            {filteredSensors.map((node, i) => {
              const isSelected = selectedNode?.nodeId === node.nodeId;
              return (
                <button key={i} onClick={() => selectNode(node, 'iot')}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-all ${isSelected ? 'bg-purple-50 border-l-2 border-purple-500' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Radio size={11} className="text-green-500 flex-shrink-0"/>
                      <p className="text-xs font-semibold text-gray-800 truncate">{node.city || node.nodeId}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{node.nodeId} · {node.state}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold" style={{color: getAqiColor(node.estAqi)}}>AQI {node.estAqi}</span>
                      <span className="text-xs text-gray-400">T: {node.temperature}°C · H: {node.humidity}%</span>
                    </div>
                  </div>
                  {isSelected
                    ? <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"/>
                    : <ChevronRight size={12} className="text-gray-300 flex-shrink-0"/>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected baseline summary */}
      {baselineConditions && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 rounded-b-xl">
          <div className="flex items-start gap-2">
            <Info size={13} className="text-blue-400 mt-0.5 flex-shrink-0"/>
            <div className="text-xs text-gray-600">
              <p className="font-semibold text-gray-800">{baselineConditions.label}</p>
              <p className="mt-0.5">Real baseline: AQI <span className="font-bold" style={{color: getAqiColor(baselineConditions.aqi)}}>{baselineConditions.aqi}</span> · PM2.5 {baselineConditions.pollutants.pm25} · NO2 {baselineConditions.pollutants.no2}</p>
              <p className="text-gray-400 mt-0.5">{baselineConditions.source}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeSelector;
