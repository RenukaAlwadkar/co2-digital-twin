import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Beaker, Car, Factory, Leaf, CloudRain, Wind, Thermometer, AlertCircle, Lock } from 'lucide-react';

const DeltaSlider = ({ label, icon, value, onChange, min, max, unit, positiveLabel, negativeLabel, disabled }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label className={`text-xs font-semibold flex items-center gap-1.5 ${disabled ? 'text-gray-300' : 'text-gray-600'}`}>
        {icon}{label}
      </label>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          value > 0 ? 'bg-red-50 text-red-600' : value < 0 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {value > 0 ? '+' : ''}{value}{unit}
          {value > 0 && positiveLabel ? ` (${positiveLabel})` : value < 0 && negativeLabel ? ` (${negativeLabel})` : ''}
        </span>
      </div>
    </div>
    <input type="range" min={min} max={max} value={value} disabled={disabled}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full outline-none cursor-pointer appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
      style={{accentColor: value > 0 ? '#dc2626' : value < 0 ? '#16a34a' : '#8b5cf6'}}
    />
    <div className="flex justify-between text-xs text-gray-300 mt-0.5">
      <span>{min}{unit}</span>
      <span className="text-gray-400">0 (baseline)</span>
      <span>+{max}{unit}</span>
    </div>
  </div>
);

const ScenarioPanel = () => {
  const { baselineConditions, runScenario, scenarioResult } = useSimulation();
  const [mods, setMods] = useState({ trafficDelta: 0, industryDelta: 0, greenDelta: 0, rainfallDelta: 0, windSpeedDelta: 0, tempDelta: 0 });
  const [running, setRunning] = useState(false);
  const disabled = !baselineConditions;

  const set = (key) => (val) => setMods(prev => ({ ...prev, [key]: val }));

  const PRESETS = [
    { name: '🚗 Traffic Surge', mods: { trafficDelta: 40, industryDelta: 10, greenDelta: 0, rainfallDelta: 0, windSpeedDelta: -2, tempDelta: 0 } },
    { name: '🏭 Industrial Peak', mods: { trafficDelta: 10, industryDelta: 45, greenDelta: 0, rainfallDelta: 0, windSpeedDelta: 0, tempDelta: 0 } },
    { name: '🌧️ Heavy Rain', mods: { trafficDelta: -10, industryDelta: -5, greenDelta: 0, rainfallDelta: 20, windSpeedDelta: 5, tempDelta: -5 } },
    { name: '🌿 Green Intervention', mods: { trafficDelta: -20, industryDelta: -15, greenDelta: 30, rainfallDelta: 3, windSpeedDelta: 2, tempDelta: 0 } },
    { name: '🌡️ Heat Inversion', mods: { trafficDelta: 20, industryDelta: 20, greenDelta: 0, rainfallDelta: 0, windSpeedDelta: -4, tempDelta: 10 } },
  ];

  const handleRun = async () => {
    setRunning(true);
    await runScenario(mods);
    setRunning(false);
  };

  const handleReset = () => setMods({ trafficDelta: 0, industryDelta: 0, greenDelta: 0, rainfallDelta: 0, windSpeedDelta: 0, tempDelta: 0 });

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Beaker size={15} className="text-purple-600"/> What-If Scenario Lab
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {disabled ? '⚠ Select a node first to unlock scenarios' : `Modifying: ${baselineConditions.label}`}
        </p>
      </div>

      {/* Quick presets */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Quick Scenarios</p>
        <div className="grid grid-cols-1 gap-1">
          {PRESETS.map(p => (
            <button key={p.name} disabled={disabled} onClick={() => setMods(p.mods)}
              className="text-left text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Delta sliders — all relative to real baseline */}
      <div className="px-4 py-3 space-y-5 flex-1">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Custom Δ Changes (relative to real baseline)</p>

        {disabled && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-400">
            <Lock size={12}/> Select a real monitoring node to enable scenario controls
          </div>
        )}

        <DeltaSlider label="Traffic" icon={<Car size={11} className="text-purple-500"/>}
          value={mods.trafficDelta} onChange={set('trafficDelta')}
          min={-50} max={50} unit="%" positiveLabel="more" negativeLabel="less" disabled={disabled}/>

        <DeltaSlider label="Industrial Load" icon={<Factory size={11} className="text-orange-500"/>}
          value={mods.industryDelta} onChange={set('industryDelta')}
          min={-40} max={40} unit="%" positiveLabel="heavier" negativeLabel="lighter" disabled={disabled}/>

        <DeltaSlider label="Green Coverage" icon={<Leaf size={11} className="text-green-500"/>}
          value={mods.greenDelta} onChange={set('greenDelta')}
          min={-20} max={40} unit="%" positiveLabel="added" negativeLabel="removed" disabled={disabled}/>

        <DeltaSlider label="Rainfall" icon={<CloudRain size={11} className="text-blue-500"/>}
          value={mods.rainfallDelta} onChange={set('rainfallDelta')}
          min={-5} max={30} unit=" mm/h" positiveLabel="heavier" negativeLabel="drier" disabled={disabled}/>

        <DeltaSlider label="Wind Speed" icon={<Wind size={11} className="text-teal-500"/>}
          value={mods.windSpeedDelta} onChange={set('windSpeedDelta')}
          min={-5} max={15} unit=" m/s" positiveLabel="faster" negativeLabel="calmer" disabled={disabled}/>

        <DeltaSlider label="Temperature" icon={<Thermometer size={11} className="text-red-500"/>}
          value={mods.tempDelta} onChange={set('tempDelta')}
          min={-10} max={15} unit="°C" positiveLabel="hotter" negativeLabel="cooler" disabled={disabled}/>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-2">
        <div className="flex gap-2">
          <button onClick={handleReset} disabled={disabled}
            className="flex-none px-4 py-2 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
            Reset Δ
          </button>
          <button onClick={handleRun} disabled={disabled || running}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-all">
            {running ? '⟳ Running simulation...' : '▶ Run Scenario'}
          </button>
        </div>

        {/* Result */}
        {scenarioResult && (
          <div className={`p-3 rounded-lg border text-xs ${
            scenarioResult.delta > 10 ? 'bg-red-50 border-red-200 text-red-700'
            : scenarioResult.delta < -10 ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0"/>
              <div>
                <p className="font-bold">Scenario vs Real Baseline</p>
                <p>Real AQI: <strong>{scenarioResult.baselineAqi}</strong> → Simulated: <strong>{scenarioResult.simulatedAqi}</strong></p>
                <p className="font-semibold mt-0.5">
                  {scenarioResult.delta > 0 ? `▲ +${scenarioResult.delta.toFixed(0)} AQI worse` : `▼ ${Math.abs(scenarioResult.delta).toFixed(0)} AQI better`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioPanel;
