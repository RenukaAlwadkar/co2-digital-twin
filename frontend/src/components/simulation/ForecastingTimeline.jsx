import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Clock } from 'lucide-react';

const STEPS = [
  { key: 'now',  label: 'Now',     desc: 'Current simulated state' },
  { key: '1h',   label: '+1 Hour', desc: 'Short-term forecast' },
  { key: '6h',   label: '+6 Hours',desc: 'Mid-term forecast' },
  { key: '24h',  label: '+24 Hours',desc: 'Long-term forecast' },
];

const ForecastingTimeline = () => {
  const { gridState, baselineConditions } = useSimulation();
  const [selected, setSelected] = useState('now');
  const centerCell = gridState.find(c => c.cellId === 'CELL_4_4');

  const getValue = (key) => {
    if (!centerCell) return '--';
    if (key === 'now') return Math.round(centerCell.aqi);
    return centerCell.forecast?.[key] || '--';
  };

  const getColor = (aqi) => {
    if (!aqi || aqi === '--') return '#9ca3af';
    if (aqi <= 50) return '#16a34a'; if (aqi <= 100) return '#65a30d';
    if (aqi <= 200) return '#ca8a04'; if (aqi <= 300) return '#ea580c';
    if (aqi <= 400) return '#dc2626'; return '#7f1d1d';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mt-2 flex items-center gap-4 shadow-sm">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Clock size={14} className="text-purple-600"/>
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Forecast</span>
      </div>

      <div className="flex-1 flex gap-2">
        {STEPS.map(step => {
          const val = getValue(step.key);
          const isActive = selected === step.key;
          return (
            <button key={step.key} onClick={() => setSelected(step.key)}
              className={`flex-1 flex flex-col items-center py-2 px-2 rounded-xl border transition-all text-center ${
                isActive ? 'bg-purple-50 border-purple-300 shadow-sm' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}>
              <span className={`text-xs ${isActive ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>{step.label}</span>
              <span className="text-base font-bold mt-0.5" style={{ color: getColor(val) }}>{val}</span>
              <span className="text-xs text-gray-400">AQI</span>
            </button>
          );
        })}
      </div>

      {/* Real baseline reference */}
      {baselineConditions && (
        <div className="flex-shrink-0 text-center border-l border-gray-200 pl-4">
          <p className="text-xs text-gray-400">Real Baseline</p>
          <p className="text-base font-bold" style={{ color: getColor(baselineConditions.aqi) }}>{baselineConditions.aqi}</p>
          <p className="text-xs text-gray-300 truncate max-w-[100px]">{baselineConditions.label}</p>
        </div>
      )}

      <div className="text-xs text-gray-400 flex-shrink-0 hidden lg:block">
        {STEPS.find(s => s.key === selected)?.desc}
      </div>
    </div>
  );
};

export default ForecastingTimeline;
