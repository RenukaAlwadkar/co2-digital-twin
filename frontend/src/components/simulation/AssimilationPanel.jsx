import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Database, AlertTriangle, CheckCircle, List } from 'lucide-react';

const LOG_COLORS = {
  info: 'text-gray-500',
  success: 'text-green-600',
  error: 'text-red-600',
  scenario: 'text-purple-600',
  tick: 'text-blue-500'
};

const AssimilationPanel = () => {
  const { simulationLog, baselineConditions, gridState, lastSync, latencyMs } = useSimulation();

  const centerCell = gridState.find(c => c.cellId === 'CELL_4_4');
  const simulatedAqi = Math.round(centerCell?.aqi || 0);
  const realAqi = baselineConditions?.aqi;

  // Only show comparison if a node is selected AND simulation has run
  const hasComparison = !!realAqi && simulatedAqi > 0;
  const drift = hasComparison ? Math.abs(simulatedAqi - realAqi) : null;
  // Divergence ratio — not a "confidence score", just how far off the simulation is from real
  const divergencePct = hasComparison ? ((drift / realAqi) * 100).toFixed(1) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <Database size={15} className="text-teal-600"/>
        <div>
          <h2 className="text-sm font-bold text-gray-800">Simulation Synchronization</h2>
          <p className="text-xs text-gray-400">Comparing simulated output vs real measured data</p>
        </div>
      </div>

      {/* Real vs Simulated comparison */}
      {hasComparison ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-teal-100 bg-teal-50 rounded-xl p-3">
              <p className="text-xs text-teal-600 font-semibold">Real Station AQI</p>
              <p className="text-2xl font-bold text-teal-700 mt-1">{realAqi}</p>
              <p className="text-xs text-teal-500 mt-0.5 truncate">{baselineConditions.source}</p>
            </div>
            <div className="border border-purple-100 bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-purple-600 font-semibold">Simulated AQI</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">{simulatedAqi}</p>
              <p className="text-xs text-purple-500 mt-0.5">Grid center (CELL_4_4)</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Absolute drift from real</span>
              <span className={`font-semibold ${drift < 30 ? 'text-green-600' : drift < 70 ? 'text-amber-600' : 'text-red-600'}`}>
                {drift > 0 ? '+' : ''}{simulatedAqi - realAqi} AQI ({divergencePct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${drift < 30 ? 'bg-green-400' : drift < 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${Math.min(100, divergencePct)}%` }}/>
            </div>

            {drift > 70 && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0"/>
                <p>Large divergence detected. Check scenario parameters — simulation may need re-anchoring to real data.</p>
              </div>
            )}
            {drift <= 30 && (
              <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                <CheckCircle size={13} className="mt-0.5 flex-shrink-0"/>
                <p>Simulation closely matches real station data. Environmental models are well-aligned.</p>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400 flex justify-between">
            <span>Last sync: {lastSync ? lastSync.toLocaleTimeString() : '--'}</span>
            <span>Latency: {latencyMs}ms</span>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <Database size={28} className="mx-auto text-gray-200 mb-2"/>
          <p className="text-xs text-gray-400">Select a real node and run a scenario to compare simulation output against measured environmental data.</p>
        </div>
      )}

      {/* Event Log */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
          <List size={11}/> Simulation Event Log
        </p>
        <div className="space-y-1 max-h-[130px] overflow-y-auto pr-1">
          {simulationLog.length === 0
            ? <p className="text-xs text-gray-300 italic">No events yet...</p>
            : simulationLog.map((entry, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="text-gray-300 flex-shrink-0 font-mono w-16">{entry.time}</span>
                <span className={LOG_COLORS[entry.type] || 'text-gray-500'}>{entry.msg}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default AssimilationPanel;
