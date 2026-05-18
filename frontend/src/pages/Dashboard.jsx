import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// ── AQI Color Helpers ────────────────────────────────────────────────────────
const aqiColor = (aqi) => {
  if (!aqi || aqi === 'N/A') return 'text-gray-400';
  if (aqi <= 50)  return 'text-green-600';
  if (aqi <= 100) return 'text-yellow-500';
  if (aqi <= 200) return 'text-orange-500';
  if (aqi <= 300) return 'text-red-500';
  return 'text-red-800';
};

const aqiBg = (aqi) => {
  if (!aqi || aqi === 'N/A') return 'bg-gray-100';
  if (aqi <= 50)  return 'bg-green-50/50 border-green-200';
  if (aqi <= 100) return 'bg-yellow-50/50 border-yellow-200';
  if (aqi <= 200) return 'bg-orange-50/50 border-orange-200';
  if (aqi <= 300) return 'bg-red-50/50 border-red-200';
  return 'bg-red-100/50 border-red-300';
};

// ── Custom SVG Line Chart Component (Dynamic scaling & curved area gradient) ──
const SVGLineChart = ({ data, selectedNode }) => {
  if (!data || data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 font-medium">
        <p className="text-sm">📈 Telemetry trend line requires active stream...</p>
        <p className="text-[10px] text-gray-300 mt-1">Collecting subsequent MQTT signals</p>
      </div>
    );
  }

  const width = 500;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  // Find min/max boundaries
  const maxVal = Math.max(...data.map(d => d.aqi), 100);
  const minVal = Math.min(...data.map(d => d.aqi), 0);
  const valRange = maxVal - minVal || 1;

  // Calculate SVG point mapping
  const points = data.map((d, index) => {
    const x = paddingX + (index / (data.length - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((d.aqi - minVal) / valRange) * (height - 2 * paddingY);
    return { x, y, val: d.aqi, time: d.time };
  });

  const pathD = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="w-full h-full flex flex-col justify-between p-2">
      <div className="flex justify-between items-center mb-1.5 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
        <span>📈 AQI Trend - {selectedNode}</span>
        <span className="text-blue-500">Min: {minVal} · Max: {maxVal}</span>
      </div>
      <div className="relative flex-1 min-h-[110px]">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f3f4f6" strokeWidth="1" />
          <line x1={paddingX} y1={(height) / 2} x2={width - paddingX} y2={(height) / 2} stroke="#f3f4f6" strokeWidth="1" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* Line path */}
          {pathD && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Data nodes */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="3.5" className="fill-white stroke-blue-500 stroke-2 hover:r-5 hover:fill-blue-500 transition-all" />
              <title>{`AQI: ${p.val}\nTime: ${p.time}`}</title>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 font-bold px-1 mt-1">
        <span>{points[0]?.time || '—'}</span>
        <span>{points[Math.floor(points.length / 2)]?.time || '—'}</span>
        <span>{points[points.length - 1]?.time || '—'}</span>
      </div>
    </div>
  );
};

// ── Custom SVG Doughnut Chart Component (Real pollutant distribution) ────────
const SVGDoughnutChart = ({ pollutants, title }) => {
  const values = useMemo(() => [
    { label: 'PM2.5', value: pollutants?.pm25 || 0, color: '#f97316' },
    { label: 'PM10',  value: pollutants?.pm10 || 0, color: '#eab308' },
    { label: 'NO₂',   value: pollutants?.no2 || 0,  color: '#ef4444' },
    { label: 'CO',    value: pollutants?.co || 0,   color: '#3b82f6' }
  ], [pollutants]);

  const total = useMemo(() => values.reduce((sum, item) => sum + item.value, 0), [values]);

  const slices = useMemo(() => {
    if (total === 0) return [];
    let accumulatedAngle = 0;
    const radius = 50;
    const cx = 70;
    const cy = 70;

    return values.map(item => {
      if (item.value === 0) return null;
      const percentage = item.value / total;
      const angle = percentage * 360;

      // Start coordinates
      const startRad = (accumulatedAngle - 90) * Math.PI / 180;
      const startX = cx + radius * Math.cos(startRad);
      const startY = cy + radius * Math.sin(startRad);

      accumulatedAngle += angle;

      // End coordinates
      const endRad = (accumulatedAngle - 90) * Math.PI / 180;
      const endX = cx + radius * Math.cos(endRad);
      const endY = cy + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      // Sector slice SVG path
      const d = `
        M ${cx} ${cy}
        L ${startX} ${startY}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
        Z
      `;

      return { ...item, d, percentage };
    }).filter(Boolean);
  }, [values, total]);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 font-semibold p-4">
        <p className="text-sm">🍩 Pollutant inventory empty...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-between p-2">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 140 140">
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.d}
              fill={slice.color}
              className="hover:opacity-90 transition-opacity cursor-pointer stroke-white stroke-2"
            >
              <title>{`${slice.label}: ${slice.value.toFixed(1)} (${(slice.percentage * 100).toFixed(0)}%)`}</title>
            </path>
          ))}
          {/* Standard central masking circle to create a modern hollow ring */}
          <circle cx="70" cy="70" r="32" fill="white" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-[8px] font-black text-gray-400 uppercase leading-none">Total</span>
          <span className="text-xs font-black text-gray-800 leading-none mt-0.5">{total.toFixed(0)}</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1 ml-4 justify-center">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">🍩 Distribution ({title})</h4>
        {values.map(item => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.label} className="flex justify-between items-center text-[10px] font-bold">
              <div className="flex items-center gap-1.5 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                <span>{item.label}</span>
              </div>
              <span className="text-gray-900 font-extrabold">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const [sensors, setSensors]       = useState([]);     // Latest IoT sensors
  const [apiCities, setApiCities]   = useState([]);     // Latest API cities
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Selected Source State
  const [selectedSource, setSelectedSource] = useState('all'); // 'all', 'iot:nodeId', 'api:cityName'
  const [activeTableTab, setActiveTableTab] = useState('iot');

  // Historical state buffer for chart plotting
  const [iotHistory, setIotHistory] = useState([]);
  const [apiHistory, setApiHistory] = useState([]);

  // ── 1. Fetch initial values and history logs on Mount ─────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [iotHistoryRes, apiHistoryRes] = await Promise.all([
          axios.get('http://localhost:5000/api/sensors/history'),
          axios.get('http://localhost:5000/api/aqi/history')
        ]);
        setIotHistory(iotHistoryRes.data);
        setApiHistory(apiHistoryRes.data);
      } catch (error) {
        console.error("Error fetching historical charts data:", error);
      }
    };
    fetchHistory();
  }, []);

  // ── 2. Run active live polling and update history buffers dynamically ──────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorRes, apiRes] = await Promise.all([
          axios.get('http://localhost:5000/api/sensors/latest'),
          axios.get('http://localhost:5000/api/aqi/all')
        ]);
        setSensors(sensorRes.data);
        setApiCities(apiRes.data);
        setLastRefresh(new Date());

        // Dynamic streaming updates to history buffers to keep line charts alive in real-time
        if (sensorRes.data && sensorRes.data.length > 0) {
          setIotHistory(prev => {
            const next = [...prev];
            // Push each newest reading
            sensorRes.data.forEach(latestNode => {
              // Ensure we don't insert exact duplicates based on timestamp
              const exists = next.some(x => x.nodeId === latestNode.nodeId && new Date(x.createdAt).getTime() === new Date(latestNode.createdAt).getTime());
              if (!exists) {
                next.push(latestNode);
              }
            });
            // Keep buffer capped to the last 60 records
            return next.slice(-60);
          });
        }

        if (apiRes.data && apiRes.data.length > 0) {
          setApiHistory(prev => {
            const next = [...prev];
            apiRes.data.forEach(latestCity => {
              const exists = next.some(x => x.city === latestCity.city && new Date(x.timestamp).getTime() === new Date(latestCity.timestamp).getTime());
              if (!exists) {
                next.push(latestCity);
              }
            });
            return next.slice(-100);
          });
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); // Live poll every 2s
    return () => clearInterval(interval);
  }, []);

  // ── Parse Selected Source ──────────────────────────────────────────────────
  const activeSelection = useMemo(() => {
    if (selectedSource === 'all') return null;
    const [type, id] = selectedSource.split(':');
    if (type === 'iot') {
      const node = sensors.find(s => s.nodeId === id);
      return node ? { ...node, isIoT: true } : null;
    } else {
      const city = apiCities.find(c => c.city === id);
      return city ? { ...city, isIoT: false } : null;
    }
  }, [sensors, apiCities, selectedSource]);

  const iotCount = sensors.length;
  const apiCount = apiCities.length;

  const currentDisplay = useMemo(() => {
    if (activeSelection) return activeSelection;
    if (sensors.length > 0) return { ...sensors[0], isIoT: true };
    if (apiCities.length > 0) return { ...apiCities[0], isIoT: false };
    return null;
  }, [activeSelection, sensors, apiCities]);

  const displayAqi      = currentDisplay?.isIoT ? (currentDisplay.estAqi ?? 'N/A') : (currentDisplay?.aqi ?? 'N/A');
  const displayCategory = currentDisplay?.isIoT ? (currentDisplay.category ?? 'Unknown') : (currentDisplay?.category ?? 'Unknown');
  const displayCity     = currentDisplay?.city ?? 'All Nodes';
  const displayTime     = currentDisplay ? new Date(currentDisplay.createdAt || currentDisplay.timestamp).toLocaleTimeString() : 'N/A';

  // ── Filter and Format Historical Telemetry for selected station ───────────
  const chartData = useMemo(() => {
    if (!currentDisplay) return [];

    if (currentDisplay.isIoT) {
      // Filter iotHistory matching current display nodeId
      const filtered = iotHistory.filter(h => h.nodeId === currentDisplay.nodeId);
      return filtered.map(h => ({
        aqi: h.estAqi ?? 0,
        time: new Date(h.createdAt || h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      })).slice(-15); // Show last 15 ticks for readability
    } else {
      // Filter apiHistory matching current display city
      const filtered = apiHistory.filter(h => h.city === currentDisplay.city);
      return filtered.map(h => ({
        aqi: h.aqi ?? 0,
        time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).slice(-15);
    }
  }, [currentDisplay, iotHistory, apiHistory]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900 font-sans">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 border-b border-gray-200 pb-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">Overview Dashboard</h1>
          {lastRefresh && (
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Syncing (2s) · Updated {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Categories Optgroup Selector */}
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 shadow-sm rounded-xl px-4 py-2">
          <span className="text-gray-500 text-sm font-semibold whitespace-nowrap">📡 Select Location:</span>
          <select
            value={selectedSource}
            onChange={e => {
              setSelectedSource(e.target.value);
              if (e.target.value.startsWith('iot')) setActiveTableTab('iot');
              if (e.target.value.startsWith('api')) setActiveTableTab('api');
            }}
            className="text-sm font-bold text-gray-800 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]"
          >
            <option value="all">All Locations Overview</option>
            {sensors.length > 0 && (
              <optgroup label="📡 Deployed IoT Nodes">
                {sensors.map(s => (
                  <option key={`iot:${s.nodeId}`} value={`iot:${s.nodeId}`}>
                    {s.nodeId} ({s.city})
                  </option>
                ))}
              </optgroup>
            )}
            {apiCities.length > 0 && (
              <optgroup label="🏢 Official API Stations">
                {apiCities.map(c => (
                  <option key={`api:${c.city}`} value={`api:${c.city}`}>
                    {c.city} (AQI: {c.aqi})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {selectedSource !== 'all' && (
            <button
              onClick={() => setSelectedSource('all')}
              className="text-xs text-red-500 hover:text-red-700 transition-colors font-bold"
            >✕ Reset</button>
          )}
        </div>
      </div>

      {/* ── Top Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        {/* Card 1: Dynamic Current AQI */}
        <div className={`bg-white p-5 rounded-xl border shadow-sm relative overflow-hidden transition-all duration-300 ${aqiBg(displayAqi)}`}>
          {currentDisplay?.isIoT ? (
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg">LIVE IOT</div>
          ) : (
            <div className="absolute top-0 right-0 bg-gray-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg">OFFICIAL API</div>
          )}
          <h3 className="text-gray-500 mb-2 font-semibold text-xs uppercase tracking-wider">
            {selectedSource === 'all' ? 'Active Station AQI' : `AQI - ${displayCity}`}
          </h3>
          {loading ? (
            <div className="text-gray-400 animate-pulse font-medium">Loading live data...</div>
          ) : (
            <>
              <div className={`text-4xl font-black mb-1.5 ${aqiColor(displayAqi)}`}>
                {displayAqi} <span className="text-sm font-semibold text-gray-500">{displayCategory}</span>
              </div>
              <div className="text-xs text-gray-400 font-medium">
                ⏱️ Synchronized: {displayTime}
              </div>
              <div className="text-xs text-blue-500 mt-2 font-bold flex items-center gap-1">
                📍 {displayCity}
                {currentDisplay?.dominantPollutant && currentDisplay.dominantPollutant !== 'N/A' && (
                  <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">
                    ↑ {currentDisplay.dominantPollutant}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Card 2: IoT Active Nodes */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-lg">SYSTEM</div>
          <h3 className="text-gray-500 mb-2 font-semibold text-xs uppercase tracking-wider">Online Nodes</h3>
          <div className="text-3xl font-black text-gray-900 mb-1">{iotCount} Node(s)</div>
          <p className="text-xs text-gray-400 font-medium mb-3">Hardware Sensor Simulation</p>
          <div className="flex justify-between text-xs font-semibold bg-gray-50 p-2 rounded-lg border border-gray-100">
            <span className="text-green-600">● {iotCount} Online</span>
            <span className="text-gray-400">0 Offline</span>
          </div>
        </div>

        {/* Card 3: Dynamic Environment readouts */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 mb-2 font-semibold text-xs uppercase tracking-wider">
            {currentDisplay?.isIoT ? `Telemetry - ${displayCity}` : 'Official Weather'}
          </h3>
          {currentDisplay?.isIoT ? (
            <div className="space-y-2 text-sm font-semibold">
              <div className="flex justify-between text-gray-600 border-b border-gray-50 pb-1">
                <span>🌡️ Temp</span>
                <span className="text-orange-500">{currentDisplay.temperature != null ? `${currentDisplay.temperature}°C` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-gray-600 border-b border-gray-50 pb-1">
                <span>💧 Humidity</span>
                <span className="text-blue-500">{currentDisplay.humidity != null ? `${currentDisplay.humidity}%` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>🔵 Pressure</span>
                <span className="text-gray-700">{currentDisplay.pressure != null ? `${currentDisplay.pressure} hPa` : 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-xs font-medium py-3 text-center border border-dashed border-gray-200 rounded-xl">
              ☁️ Weather Telemetry is only available for IoT hardware stations.
            </div>
          )}
        </div>

        {/* Card 4: Dynamic Pollutant Estimations */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 mb-2 font-semibold text-xs uppercase tracking-wider">Pollutant Inventory</h3>
          {currentDisplay?.pollutants ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs font-bold text-gray-700">
              <div>PM2.5: <span className="text-orange-500 font-extrabold">{currentDisplay.pollutants.pm25 ?? 'N/A'}</span></div>
              <div>PM10: <span className="text-yellow-600 font-extrabold">{currentDisplay.pollutants.pm10 ?? 'N/A'}</span></div>
              <div>NO₂: <span className="text-red-500 font-extrabold">{currentDisplay.pollutants.no2 ?? 'N/A'}</span></div>
              <div>CO: <span className="text-blue-500 font-extrabold">{currentDisplay.pollutants.co ?? 'N/A'}</span></div>
            </div>
          ) : (
            <div className="text-gray-400 text-xs py-4 text-center">No pollutant breakdown available</div>
          )}
        </div>
      </div>

      {/* ── Sub-index AQI Breakdown (only when IoT source selected) ─────────── */}
      {currentDisplay?.isIoT && currentDisplay?.subIndices && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
          <h3 className="text-gray-800 font-bold mb-4 text-sm flex items-center justify-between">
            <span>🧮 CPCB AQI Sub-Indices — {currentDisplay.nodeId || currentDisplay.name}</span>
            <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
              dominant pollutant: <b className="text-orange-500 uppercase">{currentDisplay.dominantPollutant}</b>
            </span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'PM2.5', value: currentDisplay.subIndices.pm25, color: 'orange' },
              { label: 'PM10',  value: currentDisplay.subIndices.pm10, color: 'yellow' },
              { label: 'NO₂',   value: currentDisplay.subIndices.no2,  color: 'red'    },
              { label: 'CO',    value: currentDisplay.subIndices.co,   color: 'blue'   },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <span className="text-xs text-gray-500 font-bold uppercase mb-2">{label}</span>
                <span className={`text-2xl font-black text-${color}-600`}>{value ?? 'N/A'}</span>
                <div className="w-full mt-3 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`bg-${color}-500 h-1.5 rounded-full transition-all`}
                    style={{ width: `${Math.min(100, ((value ?? 0) / 500) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Real Data & Logic Interactive Charts Row ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Line Chart Grid item */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm min-h-[220px]">
          <SVGLineChart data={chartData} selectedNode={displayCity} />
        </div>
        {/* Doughnut Chart Grid item */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm min-h-[220px]">
          <SVGDoughnutChart pollutants={currentDisplay?.pollutants} title={displayCity} />
        </div>
      </div>

      {/* ── Dynamic Tabbed Activity Tables (IoT & API Separation) ────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-gray-800">Telemetry Stations</h3>
            <div className="flex bg-gray-200 p-0.5 rounded-lg border border-gray-300">
              <button
                onClick={() => setActiveTableTab('iot')}
                className={`text-xs px-3.5 py-1.5 rounded-md font-bold transition-all ${
                  activeTableTab === 'iot'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📡 Deployed IoT Nodes ({iotCount})
              </button>
              <button
                onClick={() => setActiveTableTab('api')}
                className={`text-xs px-3.5 py-1.5 rounded-md font-bold transition-all ${
                  activeTableTab === 'api'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🏢 Official API Stations ({apiCount})
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
            <span className="text-xs text-green-600 font-bold">Auto-Syncing</span>
          </div>
        </div>

        {/* TAB 1: DEPLOYED IOT NODES TABLE */}
        {activeTableTab === 'iot' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Node ID</th>
                  <th className="px-5 py-3.5 font-bold">Location</th>
                  <th className="px-5 py-3.5 font-bold">🌡️ Temp</th>
                  <th className="px-5 py-3.5 font-bold">💧 Hum</th>
                  <th className="px-5 py-3.5 font-bold">🔵 Pressure</th>
                  <th className="px-5 py-3.5 font-bold">Gas (MQ135 / MQ7)</th>
                  <th className="px-5 py-3.5 font-bold">Calculated AQI</th>
                  <th className="px-5 py-3.5 font-bold">Dominant</th>
                  <th className="px-5 py-3.5 font-bold">Sync Time</th>
                </tr>
              </thead>
              <tbody>
                {sensors.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-12 text-gray-400 font-semibold">
                      {loading ? 'Initializing IoT telemetry...' : 'No active IoT nodes online'}
                    </td>
                  </tr>
                ) : (
                  sensors.map(node => (
                    <tr
                      key={node.nodeId}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${selectedSource === `iot:${node.nodeId}` ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setSelectedSource(selectedSource === `iot:${node.nodeId}` ? 'all' : `iot:${node.nodeId}`)}
                    >
                      <td className="px-5 py-4 font-mono font-bold text-blue-600">{node.nodeId}</td>
                      <td className="px-5 py-4 font-semibold text-gray-800">📍 {node.city ?? 'Unknown'}</td>
                      <td className="px-5 py-4 font-semibold text-orange-500">{node.temperature != null ? `${node.temperature}°C` : 'N/A'}</td>
                      <td className="px-5 py-4 font-semibold text-blue-500">{node.humidity != null ? `${node.humidity}%` : 'N/A'}</td>
                      <td className="px-5 py-4 font-medium text-gray-600">{node.pressure != null ? `${node.pressure} hPa` : 'N/A'}</td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-600">{node.mq135} / {node.mq7}</td>
                      <td className={`px-5 py-4 font-black text-base ${aqiColor(node.estAqi)}`}>
                        {node.estAqi ?? 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold uppercase text-orange-600">
                        {node.dominantPollutant ?? 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs font-medium">
                        {new Date(node.createdAt || node.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: OFFICIAL API STATIONS TABLE */}
        {activeTableTab === 'api' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Official Station / City</th>
                  <th className="px-5 py-3.5 font-bold">AQI</th>
                  <th className="px-5 py-3.5 font-bold">Category</th>
                  <th className="px-5 py-3.5 font-bold">PM2.5</th>
                  <th className="px-5 py-3.5 font-bold">PM10</th>
                  <th className="px-5 py-3.5 font-bold">NO₂</th>
                  <th className="px-5 py-3.5 font-bold">CO</th>
                  <th className="px-5 py-3.5 font-bold">SO₂</th>
                  <th className="px-5 py-3.5 font-bold">O₃</th>
                  <th className="px-5 py-3.5 font-bold">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {apiCities.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-gray-400 font-semibold">
                      {loading ? 'Fetching official stations...' : 'No official station data in database'}
                    </td>
                  </tr>
                ) : (
                  apiCities.map(city => (
                    <tr
                      key={city.city}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${selectedSource === `api:${city.city}` ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setSelectedSource(selectedSource === `api:${city.city}` ? 'all' : `api:${city.city}`)}
                    >
                      <td className="px-5 py-4 font-bold text-gray-800">🏢 {city.city}</td>
                      <td className={`px-5 py-4 font-black text-base ${aqiColor(city.aqi)}`}>
                        {city.aqi}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${aqiBg(city.aqi)}`}>
                          {city.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-orange-500">{city.pollutants?.pm25 ?? '—'}</td>
                      <td className="px-5 py-4 font-bold text-yellow-600">{city.pollutants?.pm10 ?? '—'}</td>
                      <td className="px-5 py-4 font-bold text-red-500">{city.pollutants?.no2 ?? '—'}</td>
                      <td className="px-5 py-4 font-bold text-blue-500">{city.pollutants?.co ?? '—'}</td>
                      <td className="px-5 py-4 font-semibold text-gray-500">{city.pollutants?.so2 ?? '—'}</td>
                      <td className="px-5 py-4 font-semibold text-gray-500">{city.pollutants?.o3 ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs font-medium">
                        {new Date(city.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;