import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Play, Pause, RotateCcw, Zap, Clock, Radio, Cpu } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/simulation';

const SimulationControlPanel = () => {
  const { isSimulating, setIsSimulating, lastSync, latencyMs, tickCount,
    tickInterval, setTickInterval, fetchGridState, addLog, selectedNode } = useSimulation();

  const handleReset = async () => {
    try {
      await axios.delete(`${API_BASE}/reset`);
      await axios.post(`${API_BASE}/init`);
      await fetchGridState();
      addLog('Grid reset to baseline.', 'success');
    } catch (err) {
      addLog('Reset failed: ' + err.message, 'error');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
      {/* Title */}
      <div className="flex-shrink-0">
        <h1 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <span className="text-purple-600">🌍</span> Environmental Digital Twin
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {selectedNode ? `Baseline: ${selectedNode.city || selectedNode.nodeId}` : 'Select a monitoring node to begin'}
        </p>
      </div>

      {/* Tick speed */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Tick speed:</label>
        <select value={tickInterval} onChange={e => setTickInterval(Number(e.target.value))}
          className="text-xs border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400">
          <option value={3000}>3s</option>
          <option value={5000}>5s</option>
          <option value={10000}>10s</option>
        </select>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
            isSimulating
              ? 'bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}>
          {isSimulating ? <><Pause size={15}/> Pause</> : <><Play size={15}/> Start Engine</>}
        </button>
        <button onClick={handleReset} title="Reset Grid"
          className="p-2 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 rounded-lg transition">
          <RotateCcw size={15}/>
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}/>
          {isSimulating ? <span className="text-green-600 font-medium">Running</span> : 'Idle'}
        </div>
        <div className="flex items-center gap-1">
          <Zap size={12} className="text-yellow-500"/> {latencyMs}ms
        </div>
        <div className="flex items-center gap-1">
          <Cpu size={12} className="text-purple-400"/> Tick #{tickCount}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-blue-400"/> {lastSync ? lastSync.toLocaleTimeString() : '--:--'}
        </div>
        <div className="flex items-center gap-1">
          <Radio size={12} className="text-green-500"/> Grid 10×10
        </div>
      </div>
    </div>
  );
};

export default SimulationControlPanel;
