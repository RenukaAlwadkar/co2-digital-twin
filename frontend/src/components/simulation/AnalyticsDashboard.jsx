import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const getAqiColor = (aqi) => {
  if (!aqi) return '#9ca3af';
  if (aqi <= 50) return '#16a34a';
  if (aqi <= 100) return '#65a30d';
  if (aqi <= 200) return '#ca8a04';
  if (aqi <= 300) return '#ea580c';
  if (aqi <= 400) return '#dc2626';
  return '#7f1d1d';
};

const TABS = ['AQI Timeline', 'Pollutants', 'Forecast'];

const AnalyticsDashboard = () => {
  const { gridState, aqiHistory, baselineConditions, scenarioResult } = useSimulation();
  const [tab, setTab] = useState('AQI Timeline');

  const centerCell = gridState.find(c => c.cellId === 'CELL_4_4') || gridState[0];
  const avgAqi = gridState.length > 0 ? Math.round(gridState.reduce((s, c) => s + c.aqi, 0) / gridState.length) : 0;
  const maxAqi = gridState.length > 0 ? Math.round(Math.max(...gridState.map(c => c.aqi))) : 0;

  // Pollutant bar data — from real baseline or center cell, whichever is available
  const source = baselineConditions?.pollutants || centerCell?.pollutants;
  const pollutantData = source ? [
    { name: 'PM2.5', val: Math.round(source.pm25 || 0), safe: 30 },
    { name: 'PM10',  val: Math.round(source.pm10 || 0), safe: 50 },
    { name: 'NO2',   val: Math.round(source.no2 || 0),  safe: 40 },
    { name: 'SO2',   val: Math.round(source.so2 || 0),  safe: 40 },
    { name: 'CO',    val: parseFloat((source.co || 0).toFixed(1)), safe: 1.0 },
  ] : [];

  // Forecast data from center cell
  const forecastData = centerCell ? [
    { time: 'Now',  AQI: Math.round(centerCell.aqi) },
    { time: '+1h',  AQI: centerCell.forecast?.['1h'] || Math.round(centerCell.aqi * 0.95) },
    { time: '+6h',  AQI: centerCell.forecast?.['6h'] || Math.round(centerCell.aqi * 0.85) },
    { time: '+24h', AQI: centerCell.forecast?.['24h'] || Math.round(centerCell.aqi * 0.75) },
  ] : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col gap-3 p-4 h-full">
      {/* Stats row */}
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
        <TrendingUp size={15} className="text-indigo-600"/>
        <h2 className="text-sm font-bold text-gray-800">Simulation Analytics</h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="border border-gray-100 rounded-lg p-2.5 bg-gray-50">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Avg City AQI</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: getAqiColor(avgAqi) }}>{avgAqi || '--'}</p>
        </div>
        <div className="border border-gray-100 rounded-lg p-2.5 bg-gray-50">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Peak AQI</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: getAqiColor(maxAqi) }}>{maxAqi || '--'}</p>
        </div>
        <div className="border border-gray-100 rounded-lg p-2.5 bg-gray-50">
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            {baselineConditions ? 'Baseline AQI' : 'Dominant'}
          </p>
          <p className="text-xl font-bold mt-0.5 text-orange-500">
            {baselineConditions ? baselineConditions.aqi : (centerCell?.dominantPollutant || '--')}
          </p>
        </div>
      </div>

      {/* Scenario comparison banner */}
      {scenarioResult && (
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border ${
          scenarioResult.delta > 10 ? 'bg-red-50 border-red-200 text-red-700'
          : scenarioResult.delta < -10 ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
          <span>Baseline: <strong>{scenarioResult.baselineAqi}</strong></span>
          <span>→</span>
          <span>Simulated: <strong>{scenarioResult.simulatedAqi}</strong></span>
          <span className="font-bold">Δ {scenarioResult.delta > 0 ? '+' : ''}{scenarioResult.delta.toFixed(0)}</span>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex border border-gray-200 rounded-lg p-0.5 gap-0.5">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${tab === t ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[180px]">
        {tab === 'AQI Timeline' && (
          aqiHistory.length === 0
            ? <div className="h-full flex items-center justify-center text-xs text-gray-400">Start the engine to record AQI history</div>
            : <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aqiHistory} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="aqiG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#9ca3af' }} interval="preserveStartEnd"/>
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }}/>
                <Tooltip contentStyle={{ fontSize: '11px', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                <Area type="monotone" dataKey="centerAqi" name="Sim AQI" stroke="#8b5cf6" fill="url(#aqiG)" strokeWidth={2}/>
                {baselineConditions && (
                  <Area type="monotone" dataKey={() => baselineConditions.aqi} name="Real Baseline" stroke="#94a3b8" fill="none" strokeWidth={1.5} strokeDasharray="5 3"/>
                )}
              </AreaChart>
            </ResponsiveContainer>
        )}

        {tab === 'Pollutants' && (
          pollutantData.length === 0
            ? <div className="h-full flex items-center justify-center text-xs text-gray-400">Select a node to see pollutants</div>
            : <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pollutantData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }}/>
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }}/>
                <Tooltip contentStyle={{ fontSize: '11px', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                <Legend wrapperStyle={{ fontSize: '10px' }}/>
                <Bar dataKey="val" name="Real Value" fill="#8b5cf6" radius={[4, 4, 0, 0]}/>
                <Bar dataKey="safe" name="Safe Limit (CPCB)" fill="#86efac" radius={[4, 4, 0, 0]} opacity={0.6}/>
              </BarChart>
            </ResponsiveContainer>
        )}

        {tab === 'Forecast' && (
          forecastData.length === 0
            ? <div className="h-full flex items-center justify-center text-xs text-gray-400">Start engine to generate forecast</div>
            : <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }}/>
                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }}/>
                <Tooltip contentStyle={{ fontSize: '11px', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                <Bar dataKey="AQI" fill="#6366f1" radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fill: '#6b7280', fontSize: 10 }}/>
              </BarChart>
            </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
