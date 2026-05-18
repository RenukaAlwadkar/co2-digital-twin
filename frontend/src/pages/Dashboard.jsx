import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Info, HelpCircle, Wind, AlertCircle, ShieldAlert, Leaf, CloudRain, Radio, Landmark, Compass, Award, ArrowUpRight, TrendingUp, Search } from 'lucide-react';

// ── AQI Color Helpers ────────────────────────────────────────────────────────
const aqiColor = (aqi) => {
  if (!aqi || aqi === 'N/A') return 'text-gray-400';
  if (aqi <= 50)  return 'text-green-600';
  if (aqi <= 100) return 'text-yellow-600';
  if (aqi <= 200) return 'text-orange-500';
  if (aqi <= 300) return 'text-red-500';
  return 'text-red-800';
};

const aqiBg = (aqi) => {
  if (!aqi || aqi === 'N/A') return 'bg-gray-100';
  if (aqi <= 50)  return 'bg-green-50/60 border-green-200';
  if (aqi <= 100) return 'bg-yellow-50/60 border-yellow-200';
  if (aqi <= 200) return 'bg-orange-50/60 border-orange-200';
  if (aqi <= 300) return 'bg-red-50/60 border-red-200';
  return 'bg-red-100/60 border-red-300';
};

// ── Custom SVG Line Chart Component (Dynamic scaling & curved area gradient) ──
const SVGLineChart = ({ data, selectedNode }) => {
  if (!data || data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 font-medium py-10">
        <p className="text-sm">📈 Telemetry trend line starting up...</p>
        <p className="text-[10px] text-gray-300 mt-1">Collecting signals from MQTT server...</p>
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
        <span className="flex items-center gap-1">📈 AQI Trend — {selectedNode}</span>
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

      const startRad = (accumulatedAngle - 90) * Math.PI / 180;
      const startX = cx + radius * Math.cos(startRad);
      const startY = cy + radius * Math.sin(startRad);

      accumulatedAngle += angle;

      const endRad = (accumulatedAngle - 90) * Math.PI / 180;
      const endX = cx + radius * Math.cos(endRad);
      const endY = cy + radius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

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
        <p className="text-sm">🍩 Pollutant inventory starting up...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-between p-2">
      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
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

// ── Interactive Grid Cell Diffusion Explanation Component ──────────────────────────
const GridDiffusionExplainer = () => {
  const [selectedCell, setSelectedCell] = useState(4); // Center cell selected by default
  const [windDir, setWindDir] = useState(135); // SE wind by default
  const [windSpeed, setWindSpeed] = useState(5); // m/s

  // Compute mock diffusion values based on selected source cell + wind advection
  const cells = useMemo(() => {
    const defaultVals = [10, 10, 10, 10, 100, 10, 10, 10, 10]; // Center cell starts with 100
    
    // Wind vector mapping
    const rad = windDir * (Math.PI / 180);
    const dx = -Math.sin(rad);
    const dy = -Math.cos(rad);

    // Grid coordinates: [col, row]
    const coords = [
      [0,0], [1,0], [2,0],
      [0,1], [1,1], [2,1],
      [0,2], [1,2], [2,2]
    ];

    const sourceCol = coords[selectedCell][0];
    const sourceRow = coords[selectedCell][1];

    const diffusionRate = 0.15; // 15% spreads out

    return coords.map((c, i) => {
      if (i === selectedCell) {
        // Source cell loses pollution to neighbors
        return 100 - (100 * diffusionRate);
      }

      const dCol = c[0] - sourceCol;
      const dRow = c[1] - sourceRow;
      const dist = Math.sqrt(dCol*dCol + dRow*dRow);

      if (dist === 0) return 10;

      // Base isotropic diffusion (shares equally to neighbor)
      let share = (100 * diffusionRate) / 8;

      // Add wind advection (directional bonus)
      const nx = dCol / dist;
      const ny = dRow / dist;
      const dot = (nx * dx) + (ny * dy);

      if (dot > 0) {
        share += (dot * windSpeed * 1.5);
      }

      return Math.round(10 + share);
    });
  }, [selectedCell, windDir, windSpeed]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2.5">
        <Wind className="text-purple-600" size={18}/>
        <div>
          <h2 className="text-sm font-bold text-gray-800">💨 How Grid Cell Diffusion Works</h2>
          <p className="text-xs text-gray-400">Interactive visual demonstration of physical atmospheric dispersion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
        {/* Left side: Interactive simulator */}
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Click any cell in the 3×3 grid below to make it the <strong>pollution source [100]</strong>. 
            Adjust the wind sliders to watch the dispersion engine blow the pollutants downwind.
          </p>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase flex justify-between">
                <span>Wind Direction</span>
                <span className="text-purple-600">{windDir}°</span>
              </label>
              <input type="range" min="0" max="360" step="45" value={windDir} onChange={e => setWindDir(Number(e.target.value))} className="w-full accent-purple-600 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase flex justify-between">
                <span>Wind Speed</span>
                <span className="text-purple-600">{windSpeed} m/s</span>
              </label>
              <input type="range" min="0" max="15" step="1" value={windSpeed} onChange={e => setWindSpeed(Number(e.target.value))} className="w-full accent-purple-600 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
            {cells.map((val, i) => {
              const isSource = i === selectedCell;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedCell(i)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center border font-bold text-xs transition-all relative ${
                    isSource 
                      ? 'bg-purple-600 border-purple-700 text-white shadow-md scale-105 z-10' 
                      : 'bg-purple-50/40 border-purple-100 text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <span className="text-[9px] text-gray-400 font-medium absolute top-1 left-1">#{i+1}</span>
                  <span className="text-sm mt-1">{val}</span>
                  <span className="text-[8px] opacity-75 font-normal">µg/m³</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Explanatory physics concepts */}
        <div className="space-y-3.5 border-l border-gray-100 pl-4">
          <h3 className="text-xs font-black uppercase text-purple-700 tracking-wider">🔬 Mathematical Rules</h3>
          
          <div className="space-y-2.5 text-xs text-gray-600">
            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-bold text-gray-800">Isotropic Diffusion (Natural Leakage)</p>
                <p className="text-gray-400 mt-0.5">Pollutants naturally disperse from high concentration to low concentration areas, sharing pollution equally to all 8 surrounding neighbor cells.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
              <div>
                <p className="font-bold text-gray-800">Wind Advection (Directional Push)</p>
                <p className="text-gray-400 mt-0.5">Wind applies a dot product projection. Surrounding cells that sit directly downwind receive a major concentration boost proportional to the wind speed.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-bold text-gray-800">Atmospheric Cleaning (Decay)</p>
                <p className="text-gray-400 mt-0.5">Wet rain scavenging (wet cleansing) and vegetation absorption (dry deposition) work continuously to keep the air from building up unbounded pollution.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const [sensors, setSensors]       = useState([]);     // Deployed IoT nodes
  const [apiCities, setApiCities]   = useState([]);     // External API stations
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  const [selectedSource, setSelectedSource] = useState('all'); 
  const [activeTableTab, setActiveTableTab] = useState('iot');
  const [tableSearch, setTableSearch] = useState('');

  const [iotHistory, setIotHistory] = useState([]);
  const [apiHistory, setApiHistory] = useState([]);
  const [showGlossary, setShowGlossary] = useState(false);

  // ── 1. Fetch historical buffers on mount ──────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [iotHistoryRes, apiHistoryRes] = await Promise.all([
          axios.get('http://localhost:5000/api/sensors/history'),
          axios.get('http://localhost:5000/api/aqi/history')
        ]);
        setIotHistory(iotHistoryRes.data || []);
        setApiHistory(apiHistoryRes.data || []);
      } catch (error) {
        console.error("Error fetching historical charts data:", error);
      }
    };
    fetchHistory();
  }, []);

  // ── 2. Real-time poll loop (2s) ───────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorRes, apiRes] = await Promise.all([
          axios.get('http://localhost:5000/api/sensors/latest'),
          axios.get('http://localhost:5000/api/aqi/all')
        ]);
        setSensors(sensorRes.data || []);
        setApiCities(apiRes.data || []);
        setLastRefresh(new Date());

        if (sensorRes.data?.length > 0) {
          setIotHistory(prev => {
            const next = [...prev];
            sensorRes.data.forEach(node => {
              const exists = next.some(x => x.nodeId === node.nodeId && new Date(x.createdAt).getTime() === new Date(node.createdAt).getTime());
              if (!exists) next.push(node);
            });
            return next.slice(-60);
          });
        }

        if (apiRes.data?.length > 0) {
          setApiHistory(prev => {
            const next = [...prev];
            apiRes.data.forEach(city => {
              const exists = next.some(x => x.city === city.city && new Date(x.timestamp).getTime() === new Date(city.timestamp).getTime());
              if (!exists) next.push(city);
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
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const chartData = useMemo(() => {
    if (!currentDisplay) return [];
    if (currentDisplay.isIoT) {
      const filtered = iotHistory.filter(h => h.nodeId === currentDisplay.nodeId);
      return filtered.map(h => ({
        aqi: h.estAqi ?? 0,
        time: new Date(h.createdAt || h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      })).slice(-15);
    } else {
      const filtered = apiHistory.filter(h => h.city === currentDisplay.city);
      return filtered.map(h => ({
        aqi: h.aqi ?? 0,
        time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).slice(-15);
    }
  }, [currentDisplay, iotHistory, apiHistory]);

  // Filters for bottom tables
  const filteredIot = useMemo(() => {
    return sensors.filter(n => 
      (n.nodeId || '').toLowerCase().includes(tableSearch.toLowerCase()) ||
      (n.city || '').toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [sensors, tableSearch]);

  const filteredApi = useMemo(() => {
    return apiCities.filter(c => 
      (c.city || '').toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [apiCities, tableSearch]);

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen text-gray-900 font-sans space-y-5 max-w-[1600px] mx-auto">
      
      {/* ── Welcome & Digital Twin Onboarding Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
          <Compass size={300} />
        </div>
        
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider flex items-center gap-1">
              <Award size={12}/> Environmental Digital Twin
            </span>
            {lastRefresh && (
              <span className="text-xs text-blue-200 font-medium">
                ● Live Syncing · Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight">
            EcoTwin Command Center
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed max-w-2xl">
            This dashboard integrates physical IoT hardware telemetries and real-world CPCB air quality feeds. It represents a real-time virtual replica (Digital Twin) designed to let urban planners model microclimates, study weather impacts, and run What-If dispersion scenarios.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <button 
              onClick={() => setShowGlossary(!showGlossary)}
              className="px-4 py-1.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5"
            >
              <HelpCircle size={13}/> {showGlossary ? 'Hide Glossary' : 'Beginner Guide & Glossary'}
            </button>
            <a 
              href="/simulation"
              className="px-4 py-1.5 bg-white/10 text-white hover:bg-white/20 text-xs font-bold rounded-lg transition-all border border-white/10 flex items-center gap-1"
            >
              Open Simulation Lab <ArrowUpRight size={13}/>
            </a>
          </div>
        </div>
      </div>

      {/* ── Onboarding Glossary Section ── */}
      {showGlossary && (
        <div className="bg-white border border-blue-200 rounded-xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
          <div>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5 border-b pb-2 mb-2">
              <Radio size={14} className="text-blue-600"/> Deployed IoT Nodes
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              These are physical micro-controller nodes (simulated in real-time) deployed in the field. They measure actual gases using <strong>MQ135</strong> (multi-gas sensor) and <strong>MQ7</strong> (carbon monoxide sensor), alongside local temperature, humidity, and barometric pressure.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5 border-b pb-2 mb-2">
              <Landmark size={14} className="text-purple-600"/> Official API Stations
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              These represent live government air monitoring stations. They report audited, high-precision values for fine particles (<strong>PM2.5 / PM10</strong>), toxic gases (<strong>NO₂ / SO₂ / O₃</strong>), and official regulatory Air Quality Index (AQI) tiers.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5 border-b pb-2 mb-2">
              <AlertCircle size={14} className="text-orange-500"/> Pollutant Definitions
            </h3>
            <ul className="text-xs text-gray-500 space-y-1">
              <li><strong>PM2.5/PM10:</strong> Microscopic particles that enter lungs.</li>
              <li><strong>NO₂:</strong> Toxic gas released by internal combustion engines.</li>
              <li><strong>CO:</strong> Carbon Monoxide, an odorless gas from incomplete combustion.</li>
              <li><strong>AQI:</strong> 0-500 index. Above 100 becomes hazardous.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Active Selection Selector Row ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"/>
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Baseline Stream Node Selector</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-400">Selected Focus:</span>
          <select
            value={selectedSource}
            onChange={e => {
              setSelectedSource(e.target.value);
              if (e.target.value.startsWith('iot')) setActiveTableTab('iot');
              if (e.target.value.startsWith('api')) setActiveTableTab('api');
            }}
            className="text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[200px]"
          >
            <option value="all">🇮🇳 All Deployed Stations (Overview)</option>
            {sensors.length > 0 && (
              <optgroup label="📡 Deployed IoT Nodes">
                {sensors.map(s => (
                  <option key={`iot:${s.nodeId}`} value={`iot:${s.nodeId}`}>
                    📡 {s.nodeId} ({s.city})
                  </option>
                ))}
              </optgroup>
            )}
            {apiCities.length > 0 && (
              <optgroup label="🏢 Official API Stations">
                {apiCities.map(c => (
                  <option key={`api:${c.city}`} value={`api:${c.city}`}>
                    🏢 {c.city} (AQI: {c.aqi})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          {selectedSource !== 'all' && (
            <button
              onClick={() => setSelectedSource('all')}
              className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-100 rounded px-2 py-1"
            >✕ Reset</button>
          )}
        </div>
      </div>

      {/* ── Top Stats Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1: Dynamic Current AQI */}
        <div className={`bg-white p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all duration-300 ${aqiBg(displayAqi)}`}>
          {currentDisplay?.isIoT ? (
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-black px-2.5 py-1 rounded-bl-lg">LIVE IOT</div>
          ) : (
            <div className="absolute top-0 right-0 bg-purple-500 text-white text-[9px] font-black px-2.5 py-1 rounded-bl-lg">OFFICIAL API</div>
          )}
          <h3 className="text-gray-400 mb-2 font-bold text-[10px] uppercase tracking-wider">
            {selectedSource === 'all' ? 'Active Focus AQI' : `AQI — ${displayCity}`}
          </h3>
          {loading ? (
            <div className="text-gray-400 animate-pulse font-medium text-xs">Synchronizing feeds...</div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${aqiColor(displayAqi)}`}>{displayAqi}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${aqiBg(displayAqi)}`} style={{color: aqiColor(displayAqi)}}>
                  {displayCategory}
                </span>
              </div>
              <div className="text-[10px] text-gray-400 font-medium mt-2">
                Last sync: {displayTime}
              </div>
              <div className="text-xs text-blue-600 mt-2 font-bold flex items-center gap-1">
                📍 {displayCity}
                {currentDisplay?.dominantPollutant && currentDisplay.dominantPollutant !== 'N/A' && (
                  <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ml-1">
                    ↑ {currentDisplay.dominantPollutant}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Card 2: IoT Active Nodes */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-bl-lg">ONLINE</div>
          <div>
            <h3 className="text-gray-400 mb-2 font-bold text-[10px] uppercase tracking-wider">IoT Hardware Nodes</h3>
            <div className="text-3xl font-black text-gray-900">{sensors.length} Deployed</div>
            <p className="text-[10px] text-gray-400 font-medium">Real-time telemetries connected</p>
          </div>
          <div className="flex justify-between text-[10px] font-bold bg-gray-50 p-2 rounded-lg border border-gray-100 mt-3">
            <span className="text-green-600">● {sensors.length} Active Nodes</span>
            <span className="text-gray-400">0 Offline</span>
          </div>
        </div>

        {/* Card 3: Dynamic Environment readouts */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <h3 className="text-gray-400 mb-2 font-bold text-[10px] uppercase tracking-wider">
            {currentDisplay?.isIoT ? `Telemetry — ${displayCity}` : 'Weather Parameters'}
          </h3>
          {currentDisplay?.isIoT ? (
            <div className="space-y-1.5 text-xs font-bold">
              <div className="flex justify-between text-gray-600 border-b border-gray-50 pb-0.5">
                <span>🌡️ Temperature</span>
                <span className="text-orange-500">{currentDisplay.temperature != null ? `${currentDisplay.temperature}°C` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-gray-600 border-b border-gray-50 pb-0.5">
                <span>💧 Humidity</span>
                <span className="text-blue-500">{currentDisplay.humidity != null ? `${currentDisplay.humidity}%` : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>🔵 Air Pressure</span>
                <span className="text-gray-700">{currentDisplay.pressure != null ? `${currentDisplay.pressure} hPa` : 'N/A'}</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-[11px] py-4 text-center border border-dashed border-gray-200 rounded-xl">
              ☁️ Microclimate weather sensors are exclusive to IoT hardware units.
            </div>
          )}
        </div>

        {/* Card 4: Dynamic Pollutant Estimations */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <h3 className="text-gray-400 mb-2 font-bold text-[10px] uppercase tracking-wider">Pollutant Inventory</h3>
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

      {/* ── Sub-index AQI Breakdown (IoT nodes only) ── */}
      {currentDisplay?.isIoT && currentDisplay?.subIndices && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800">
              🧮 CPCB AQI Sub-Indices — {currentDisplay.nodeId}
            </h3>
            <span className="text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded uppercase">
              Dominant: {currentDisplay.dominantPollutant}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'PM2.5', value: currentDisplay.subIndices.pm25, color: '#f97316' },
              { label: 'PM10',  value: currentDisplay.subIndices.pm10, color: '#eab308' },
              { label: 'NO₂',   value: currentDisplay.subIndices.no2,  color: '#ef4444' },
              { label: 'CO',    value: currentDisplay.subIndices.co,   color: '#3b82f6' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 flex flex-col items-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase mb-1">{label}</span>
                <span className="text-xl font-black text-gray-800">{value ?? 'N/A'}</span>
                <div className="w-full mt-2 bg-gray-200 rounded-full h-1">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, ((value ?? 0) / 500) * 100)}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SVG Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white p-4 border border-gray-200 rounded-xl shadow-sm min-h-[220px]">
          <SVGLineChart data={chartData} selectedNode={displayCity} />
        </div>
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm min-h-[220px]">
          <SVGDoughnutChart pollutants={currentDisplay?.pollutants} title={displayCity} />
        </div>
      </div>

      {/* ── Visual Grid Diffusion Explainer Widget ── */}
      <GridDiffusionExplainer />

      {/* ── Telemetry Stations Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-sm font-bold text-gray-800">Station Inventories</h3>
            <div className="flex bg-gray-200/60 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setActiveTableTab('iot')}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all ${
                  activeTableTab === 'iot' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                📡 IoT Hardware ({sensors.length})
              </button>
              <button
                onClick={() => setActiveTableTab('api')}
                className={`text-xs px-3 py-1.5 rounded-md font-bold transition-all ${
                  activeTableTab === 'api' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                🏢 Official Stations ({apiCities.length})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Search station or city..."
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 w-[180px] lg:w-[220px]"
            />
          </div>
        </div>

        {/* TAB 1: IoT Stations Table */}
        {activeTableTab === 'iot' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[9px] text-gray-400 font-black tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-bold">Node ID</th>
                  <th className="px-5 py-3 font-bold">Location</th>
                  <th className="px-5 py-3 font-bold">🌡️ Temp</th>
                  <th className="px-5 py-3 font-bold">💧 Hum</th>
                  <th className="px-5 py-3 font-bold">Pressure</th>
                  <th className="px-5 py-3 font-bold">Sub-indices (Gas MQ135 / MQ7)</th>
                  <th className="px-5 py-3 font-bold">Calculated AQI</th>
                  <th className="px-5 py-3 font-bold">Sync Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredIot.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-gray-400 font-semibold">
                      {loading ? 'Initializing IoT streams...' : 'No matching active IoT nodes online'}
                    </td>
                  </tr>
                ) : (
                  filteredIot.map(node => {
                    const isSelected = selectedSource === `iot:${node.nodeId}`;
                    return (
                      <tr
                        key={node.nodeId}
                        onClick={() => setSelectedSource(isSelected ? 'all' : `iot:${node.nodeId}`)}
                        className={`hover:bg-blue-50/20 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/40 font-semibold' : ''}`}
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-blue-600">{node.nodeId}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-800">📍 {node.city || 'Unknown'}</td>
                        <td className="px-5 py-3.5 text-orange-500 font-bold">{node.temperature != null ? `${node.temperature}°C` : 'N/A'}</td>
                        <td className="px-5 py-3.5 text-blue-500 font-bold">{node.humidity != null ? `${node.humidity}%` : 'N/A'}</td>
                        <td className="px-5 py-3.5 text-gray-500 font-medium">{node.pressure != null ? `${node.pressure} hPa` : 'N/A'}</td>
                        <td className="px-5 py-3.5 font-mono text-gray-500">{node.mq135} / {node.mq7}</td>
                        <td className={`px-5 py-3.5 font-black text-sm ${aqiColor(node.estAqi)}`}>
                          {node.estAqi ?? 'N/A'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-[10px]">
                          {new Date(node.createdAt || node.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Official Stations Table */}
        {activeTableTab === 'api' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 uppercase text-[9px] text-gray-400 font-black tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-bold">Official Station</th>
                  <th className="px-5 py-3 font-bold">AQI Value</th>
                  <th className="px-5 py-3 font-bold">Tiers</th>
                  <th className="px-5 py-3 font-bold">PM2.5</th>
                  <th className="px-5 py-3 font-bold">PM10</th>
                  <th className="px-5 py-3 font-bold">NO₂</th>
                  <th className="px-5 py-3 font-bold">CO</th>
                  <th className="px-5 py-3 font-bold">SO₂</th>
                  <th className="px-5 py-3 font-bold">O₃</th>
                  <th className="px-5 py-3 font-bold">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApi.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-10 text-gray-400 font-semibold">
                      {loading ? 'Initializing government feeds...' : 'No matching official station found'}
                    </td>
                  </tr>
                ) : (
                  filteredApi.map(city => {
                    const isSelected = selectedSource === `api:${city.city}`;
                    return (
                      <tr
                        key={city.city}
                        onClick={() => setSelectedSource(isSelected ? 'all' : `api:${city.city}`)}
                        className={`hover:bg-blue-50/20 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/40 font-semibold' : ''}`}
                      >
                        <td className="px-5 py-3.5 font-bold text-gray-800">🏢 {city.city}</td>
                        <td className={`px-5 py-3.5 font-black text-sm ${aqiColor(city.aqi)}`}>
                          {city.aqi}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${aqiBg(city.aqi)}`} style={{color: aqiColor(city.aqi)}}>
                            {city.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-orange-500">{city.pollutants?.pm25 ?? '—'}</td>
                        <td className="px-5 py-3.5 font-bold text-yellow-600">{city.pollutants?.pm10 ?? '—'}</td>
                        <td className="px-5 py-3.5 font-bold text-red-500">{city.pollutants?.no2 ?? '—'}</td>
                        <td className="px-5 py-3.5 font-bold text-blue-500">{city.pollutants?.co ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-500">{city.pollutants?.so2 ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-500">{city.pollutants?.o3 ?? '—'}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-[10px]">
                          {new Date(city.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })
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