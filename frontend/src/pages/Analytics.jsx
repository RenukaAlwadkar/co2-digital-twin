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
  if (aqi <= 50)  return 'bg-green-50 border-green-200';
  if (aqi <= 100) return 'bg-yellow-50 border-yellow-200';
  if (aqi <= 200) return 'bg-orange-50 border-orange-200';
  if (aqi <= 300) return 'bg-red-50 border-red-200';
  return 'bg-red-100 border-red-300';
};

// ── 1. DUAL TREND LINE CHART (AQI & CO₂ ppm Over Time) ────────────────────────
const SVGAnalyticsLineChart = ({ data }) => {
  if (!data || data.length < 2) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 font-semibold text-xs border border-dashed border-gray-200 rounded-xl h-[150px]">
        📈 Select location with historical telemetry logs...
      </div>
    );
  }

  const width = 500;
  const height = 150; // Constrained height
  const paddingX = 45;
  const paddingY = 20;

  // AQI limits
  const maxAqi = Math.max(...data.map(d => d.aqi), 100);
  const minAqi = Math.min(...data.map(d => d.aqi), 0);
  const aqiRange = maxAqi - minAqi || 1;

  // CO2 limits (MQ135 ppm or simulated equivalent)
  const maxCo2 = Math.max(...data.map(d => d.co2), 600);
  const minCo2 = Math.min(...data.map(d => d.co2), 350);
  const co2Range = maxCo2 - minCo2 || 1;

  // Map coordinate points
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - 2 * paddingX);
    const yAqi = height - paddingY - ((d.aqi - minAqi) / aqiRange) * (height - 2 * paddingY);
    const yCo2 = height - paddingY - ((d.co2 - minCo2) / co2Range) * (height - 2 * paddingY);
    return { x, yAqi, yCo2, aqi: d.aqi, co2: d.co2, time: d.timeLabel };
  });

  const pathAqi = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.yAqi}` : `${acc} L ${p.x} ${p.yAqi}`;
  }, '');

  const pathCo2 = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.yCo2}` : `${acc} L ${p.x} ${p.yCo2}`;
  }, '');

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="flex justify-between items-center text-[10px] font-bold mb-1">
        <span className="text-blue-600">● AQI Trend (Min: {minAqi} · Max: {maxAqi})</span>
        <span className="text-emerald-600">● CO₂ Proxy ppm (Min: {minCo2.toFixed(0)} · Max: {maxCo2.toFixed(0)})</span>
      </div>
      <div className="relative flex-1 min-h-[120px] overflow-hidden">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Gridlines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#f3f4f6" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#f3f4f6" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e5e7eb" strokeWidth="1.5" />

          {/* AQI Trendline (Blue) */}
          {pathAqi && <path d={pathAqi} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
          
          {/* CO2 Trendline (Green) */}
          {pathCo2 && <path d={pathCo2} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Coordinate Circles */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.yAqi} r="3" className="fill-white stroke-blue-500 stroke-2 hover:r-4 hover:fill-blue-600 transition-all cursor-pointer" />
              <circle cx={p.x} cy={p.yCo2} r="2.5" className="fill-white stroke-emerald-500 stroke-2 hover:r-4 hover:fill-emerald-600 transition-all cursor-pointer" />
              <title>{`Time: ${p.time}\nAQI: ${p.aqi}\nCO2: ${p.co2.toFixed(0)} ppm`}</title>
            </g>
          ))}

          {/* Perfectly pixel-aligned Text Labels */}
          {points.length > 0 && (
            <>
              <text x={paddingX} y={height - 4} textAnchor="start" className="text-[9px] font-bold fill-gray-400 font-sans">
                {points[0].time}
              </text>
              <text x={width / 2} y={height - 4} textAnchor="middle" className="text-[9px] font-bold fill-gray-400 font-sans">
                {points[Math.floor(points.length / 2)]?.time}
              </text>
              <text x={width - paddingX} y={height - 4} textAnchor="end" className="text-[9px] font-bold fill-gray-400 font-sans">
                {points[points.length - 1].time}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

// ── 2. SVG BAR CHART WITH CPCB LIMITS (Regulatory study tool) ───────────────
const SVGAnalyticsBarChart = ({ pollutants }) => {
  const bars = useMemo(() => [
    { label: 'PM2.5', value: pollutants?.pm25 || 0, limit: 60, unit: 'µg/m³', color: '#f97316' },
    { label: 'PM10',  value: pollutants?.pm10 || 0, limit: 100, unit: 'µg/m³', color: '#eab308' },
    { label: 'NO₂',   value: pollutants?.no2 || 0,  limit: 80, unit: 'µg/m³', color: '#ef4444' },
    { label: 'CO',    value: pollutants?.co || 0,   limit: 2, unit: 'mg/m³', color: '#3b82f6' }
  ], [pollutants]);

  const maxVal = Math.max(...bars.map(b => Math.max(b.value, b.limit)), 50);

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="text-[10px] font-bold text-gray-500 mb-2 flex justify-between">
        <span>📊 Current Reading</span>
        <span className="text-red-500">❌ Dashed line represents CPCB Safe Limits</span>
      </div>
      <div className="flex justify-around items-end h-[120px] border-b border-gray-200 pb-2 relative overflow-hidden">
        {bars.map((bar, i) => {
          const heightPct = (bar.value / maxVal) * 100;
          const limitPct = (bar.limit / maxVal) * 100;
          const isViolating = bar.value > bar.limit;

          return (
            <div key={i} className="flex flex-col items-center w-16 group relative">
              {/* Tooltip detail */}
              <div className="absolute -top-10 bg-gray-800 text-white text-[8px] font-bold px-1.5 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center min-w-[70px]">
                <div>Read: {bar.value.toFixed(1)}</div>
                <div className="border-t border-gray-600 mt-0.5 pt-0.5">Limit: {bar.limit}</div>
              </div>

              {/* Bar Container */}
              <div className="w-9 h-24 flex items-end relative bg-gray-50 rounded-t-md">
                {/* Safe limits dashed line indicator inside bar channel */}
                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-red-500/80 z-10"
                  style={{ bottom: `${limitPct}%` }}
                ></div>

                {/* Actual value bar */}
                <div
                  className="w-full rounded-t transition-all duration-500 cursor-pointer shadow-sm"
                  style={{
                    height: `${Math.max(5, heightPct)}%`,
                    backgroundColor: isViolating ? '#ef4444' : bar.color
                  }}
                ></div>
              </div>

              <span className="text-[9px] font-black text-gray-500 mt-2 block">{bar.label}</span>
              <span className={`text-[8px] font-bold ${isViolating ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                {isViolating ? 'Violating' : 'Safe'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── 3. CORRELATION SCATTER CHART WITH REGRESSION FIT ─────────────────────────
const SVGAnalyticsScatterChart = ({ data }) => {
  const points = useMemo(() => {
    return data.filter(d => d.temperature != null).map(d => ({
      x: d.temperature,
      y: d.aqi
    }));
  }, [data]);

  // Linear Regression Calculation: y = mx + c
  const regression = useMemo(() => {
    if (points.length < 3) return null;
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    points.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    const c = (sumY - m * sumX) / n;

    // Determine correlation strength
    const rStatus = m > 0.5 ? 'Strong Positive' : m > 0.1 ? 'Weak Positive' : m < -0.5 ? 'Strong Negative' : m < -0.1 ? 'Weak Negative' : 'Neutral';

    return { m, c, rStatus };
  }, [points]);

  if (points.length < 3) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 font-semibold text-xs border border-dashed border-gray-200 rounded-xl h-[150px]">
        🌡️ Accumulating active IoT logs to analyze thermal correlation...
      </div>
    );
  }

  const width = 300;
  const height = 150;
  const pad = 25;

  const temps = points.map(p => p.x);
  const aqis  = points.map(p => p.y);

  const maxT = Math.max(...temps, 40);
  const minT = Math.min(...temps, 15);
  const maxA = Math.max(...aqis, 250);
  const minA = Math.min(...aqis, 0);

  const tRange = maxT - minT || 1;
  const aRange = maxA - minA || 1;

  // Convert points to SVG coordinates
  const plotted = points.map(p => ({
    cx: pad + ((p.x - minT) / tRange) * (width - 2 * pad),
    cy: height - pad - ((p.y - minA) / aRange) * (height - 2 * pad),
    t: p.x,
    a: p.y
  }));

  // Generate regression line endpoints
  let regLine = null;
  if (regression) {
    const x1Val = minT;
    const y1Val = regression.m * x1Val + regression.c;
    const x2Val = maxT;
    const y2Val = regression.m * x2Val + regression.c;

    regLine = {
      x1: pad + ((x1Val - minT) / tRange) * (width - 2 * pad),
      y1: height - pad - ((Math.max(minA, Math.min(maxA, y1Val)) - minA) / aRange) * (height - 2 * pad),
      x2: pad + ((x2Val - minT) / tRange) * (width - 2 * pad),
      y2: height - pad - ((Math.max(minA, Math.min(maxA, y2Val)) - minA) / aRange) * (height - 2 * pad),
    };
  }

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="text-[9px] font-bold text-gray-500 mb-1 flex justify-between">
        <span>🔥 Thermal Correlation Analysis</span>
        <span className="text-blue-600 font-extrabold uppercase">{regression?.rStatus} FIT</span>
      </div>
      <div className="relative flex-1 min-h-[110px] overflow-hidden">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
          {/* Axis borders */}
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#e5e7eb" strokeWidth="1.5" />
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e5e7eb" strokeWidth="1.5" />

          {/* Grid channels */}
          <line x1={width / 2} y1={pad} x2={width / 2} y2={height - pad} stroke="#f9fafb" />
          <line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke="#f9fafb" />

          {/* Regression Line */}
          {regLine && (
            <line
              x1={regLine.x1}
              y1={regLine.y1}
              x2={regLine.x2}
              y2={regLine.y2}
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}

          {/* Plot Data Circles */}
          {plotted.map((p, i) => (
            <circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r="4.5"
              className="fill-blue-500/80 stroke-white stroke-1 hover:scale-125 transition-transform cursor-pointer"
            >
              <title>{`Temp: ${p.t.toFixed(1)}°C\nAQI: ${p.a}`}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-widest px-4 mt-1">
        <span>🌡️ Temp ({minT.toFixed(0)}°C)</span>
        <span>Temp ({maxT.toFixed(0)}°C)</span>
      </div>
    </div>
  );
};

// ── 4. Normalized Radar Chart (Plotting scaled CPCB Sub-indices) ─────────────
const SVGAnalyticsRadarChart = ({ subIndices }) => {
  const metrics = useMemo(() => [
    { label: 'PM2.5 Subindex', value: subIndices?.pm25 || 0, max: 500 },
    { label: 'PM10 Subindex',  value: subIndices?.pm10 || 0, max: 500 },
    { label: 'NO₂ Subindex',   value: subIndices?.no2 || 0,  max: 500 },
    { label: 'CO Subindex',    value: subIndices?.co || 0,   max: 500 }
  ], [subIndices]);

  const maxTotal = metrics.reduce((sum, m) => sum + m.value, 0);

  const cx = 100;
  const cy = 70; // Positioned safely to stay centered
  const maxRadius = 38; // Radius fits perfectly inside card

  // Polar coordinate vectors
  const points = useMemo(() => {
    return metrics.map((m, index) => {
      const angleRad = (index * 90 - 90) * Math.PI / 180;
      const ratio = Math.min(1.0, m.value / m.max) || 0.05;
      const r = ratio * maxRadius;

      const x = cx + r * Math.cos(angleRad);
      const y = cy + r * Math.sin(angleRad);

      let lblX = cx + (maxRadius + 12) * Math.cos(angleRad);
      let lblY = cy + (maxRadius + 8) * Math.sin(angleRad);
      let anchor = 'middle';

      if (index === 0) { // Top
        lblY = cy - maxRadius - 6;
      } else if (index === 1) { // Right
        lblX = cx + maxRadius + 4;
        lblY = cy + 3;
        anchor = 'start';
      } else if (index === 2) { // Bottom
        lblY = cy + maxRadius + 10;
      } else if (index === 3) { // Left
        lblX = cx - maxRadius - 4;
        lblY = cy + 3;
        anchor = 'end';
      }

      return { x, y, lblX, lblY, anchor, label: m.label.split(' ')[0], val: m.value };
    });
  }, [metrics]);

  const polygonPath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '') + ' Z';
  }, [points]);

  if (maxTotal === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 font-semibold text-xs border border-dashed border-gray-200 rounded-xl h-[150px]">
        🕸️ Needs calculated sub-index readings to plot radar...
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center h-[140px] overflow-hidden">
      <svg className="h-full w-auto" viewBox="0 0 200 150">
        {/* Radar concentric circular grid */}
        <circle cx={cx} cy={cy} r={maxRadius} fill="none" stroke="#f3f4f6" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={maxRadius * 0.66} fill="none" stroke="#f3f4f6" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={maxRadius * 0.33} fill="none" stroke="#f3f4f6" strokeWidth="1" />

        {/* Diagonal axis spanners */}
        <line x1={cx} y1={cy - maxRadius} x2={cx} y2={cy + maxRadius} stroke="#f3f4f6" strokeWidth="1" />
        <line x1={cx - maxRadius} y1={cy} x2={cx + maxRadius} y2={cy} stroke="#f3f4f6" strokeWidth="1" />

        {/* Scaled Polygon Overlay */}
        <path d={polygonPath} fill="#3b82f6" fillOpacity="0.25" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />

        {/* Node points and text labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1" />
            <text
              x={p.lblX}
              y={p.lblY}
              textAnchor={p.anchor}
              className="text-[9px] font-black fill-gray-600 font-sans"
            >
              {p.label} ({p.val.toFixed(0)})
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ── MAIN ANALYTICS SCREEN ────────────────────────────────────────────────────
const Analytics = () => {
  const [sensors, setSensors]       = useState([]);     // Latest IoT sensors
  const [apiCities, setApiCities]   = useState([]);     // Latest API cities
  const [loading, setLoading]       = useState(true);

  // Selected Location Selector
  const [selectedSource, setSelectedSource] = useState('all');

  // Database History Log state
  const [iotHistory, setIotHistory] = useState([]);
  const [apiHistory, setApiHistory] = useState([]);

  // Search parameter for historical database log table
  const [searchQuery, setSearchQuery] = useState('');

  // ── Fetch Telemetry & DB log registries ───────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorRes, apiRes, iotHistoryRes, apiHistoryRes] = await Promise.all([
          axios.get('http://localhost:5000/api/sensors/latest'),
          axios.get('http://localhost:5000/api/aqi/all'),
          axios.get('http://localhost:5000/api/sensors/history'),
          axios.get('http://localhost:5000/api/aqi/history')
        ]);
        setSensors(sensorRes.data);
        setApiCities(apiRes.data);
        setIotHistory(iotHistoryRes.data);
        setApiHistory(apiHistoryRes.data);
      } catch (error) {
        console.error("Error fetching analytical logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); // 2s live refresh interval
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

  const currentDisplay = useMemo(() => {
    if (activeSelection) return activeSelection;
    if (sensors.length > 0) return { ...sensors[0], isIoT: true };
    if (apiCities.length > 0) return { ...apiCities[0], isIoT: false };
    return null;
  }, [activeSelection, sensors, apiCities]);

  // ── Unified Chronological History log mapping ──────────────────────────────
  const locationHistory = useMemo(() => {
    if (!currentDisplay) return [];

    if (currentDisplay.isIoT) {
      const filtered = iotHistory.filter(h => h.nodeId === currentDisplay.nodeId);
      return filtered.map(h => ({
        aqi: h.estAqi ?? 0,
        co2: h.mq135 ? parseFloat(h.mq135) : 400, // CO2 raw simulation proxy
        temperature: h.temperature,
        humidity: h.humidity,
        timeLabel: new Date(h.createdAt || h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      })).slice(-20);
    } else {
      const filtered = apiHistory.filter(h => h.city === currentDisplay.city);
      return filtered.map(h => ({
        aqi: h.aqi ?? 0,
        co2: h.pollutants?.co ? parseFloat(h.pollutants.co) * 1000 : 400, // Normalized official gas
        temperature: h.temperature || null,
        humidity: h.humidity || null,
        timeLabel: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })).slice(-20);
    }
  }, [currentDisplay, iotHistory, apiHistory]);

  // ── Unified Ingestion Records database mapper ─────────────────────────────
  const unifiedHistoryTable = useMemo(() => {
    const iotItems = iotHistory.map(h => ({
      id: h._id,
      timestamp: new Date(h.createdAt || h.timestamp).toLocaleString(),
      sourceType: 'iot',
      nodeId: h.nodeId,
      city: h.city || 'Unknown',
      aqi: h.estAqi ?? 0,
      pm25: h.estPollutants?.pm25 ?? '—',
      pm10: h.estPollutants?.pm10 ?? '—',
      co: h.estPollutants?.co ?? '—',
      category: h.category || 'Unknown'
    }));

    const apiItems = apiHistory.map(h => ({
      id: h._id,
      timestamp: new Date(h.timestamp).toLocaleString(),
      sourceType: 'api',
      nodeId: 'API Station',
      city: h.city,
      aqi: h.aqi,
      pm25: h.pollutants?.pm25 ?? '—',
      pm10: h.pollutants?.pm10 ?? '—',
      co: h.pollutants?.co ?? '—',
      category: h.category
    }));

    return [...iotItems, ...apiItems].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [iotHistory, apiHistory]);

  // Search filter applied to unified database rows
  const filteredTableList = useMemo(() => {
    if (!searchQuery) return unifiedHistoryTable;
    const query = searchQuery.toLowerCase();
    return unifiedHistoryTable.filter(item => {
      return (
        item.nodeId.toLowerCase().includes(query) ||
        item.city.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [unifiedHistoryTable, searchQuery]);

  // Browser-based CSV compilation and download
  const exportToCSV = () => {
    if (filteredTableList.length === 0) return;
    const headers = 'Timestamp,Source,NodeID,City,AQI,PM2.5,PM10,CO,Category\n';
    const rows = filteredTableList.map(item => (
      `"${item.timestamp}","${item.sourceType.toUpperCase()}","${item.nodeId}","${item.city}",${item.aqi},${item.pm25},${item.pm10},${item.co},"${item.category}"`
    )).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `EcoTwin_Historical_Data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900 font-sans">

      {/* ── Header + Navigation Controls ──────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">Advanced Analytics</h1>
          <p className="text-xs text-gray-400 mt-1">🔬 Deep environmental analysis and CPCB regulatory compliance studies</p>
        </div>

        {/* Location selector dropdown */}
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
          <span className="text-gray-500 text-sm font-semibold whitespace-nowrap">📍 Analytical Node:</span>
          <select
            value={selectedSource}
            onChange={e => setSelectedSource(e.target.value)}
            className="text-sm font-bold text-gray-800 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]"
          >
            <option value="all">All Stations (Default Focus)</option>
            {sensors.length > 0 && (
              <optgroup label="📡 IoT Node Locations">
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
                    {c.city}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* ── Interactive SVG Analytics Chart Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* CHART 1: LINE CHART (AQI vs CO2) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-72 flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="text-sm font-extrabold text-gray-800 tracking-tight uppercase text-gray-500 text-[11px] mb-1">
              📈 AQI & CO₂ Dual Trend
            </h3>
            <p className="text-xs text-gray-400 font-semibold mb-3">Chronological study of general AQI levels corresponding to active CO₂ proxy peaks</p>
          </div>
          <div className="flex-1 flex overflow-hidden">
            <SVGAnalyticsLineChart data={locationHistory} />
          </div>
        </div>
        
        {/* CHART 2: BAR CHART (Regulatory Compliance Study) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-72 flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="text-sm font-extrabold text-gray-800 tracking-tight uppercase text-gray-500 text-[11px] mb-1">
              📊 Regulatory Standards Compliance
            </h3>
            <p className="text-xs text-gray-400 font-semibold mb-3">Comparing real-time concentrations against CPCB statutory 24-hr safe levels</p>
          </div>
          <div className="flex-1 flex overflow-hidden">
            <SVGAnalyticsBarChart pollutants={currentDisplay?.pollutants} />
          </div>
        </div>

        {/* CHART 3: SCATTER CHART (Thermal Regression analysis) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-72 flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="text-sm font-extrabold text-gray-800 tracking-tight uppercase text-gray-500 text-[11px] mb-1">
              🌡️ Thermal Regression Fit
            </h3>
            <p className="text-xs text-gray-400 font-semibold mb-3">Mathematical linear fit (y = mx + c) analyzing how ambient heat impacts total AQI</p>
          </div>
          <div className="flex-1 flex overflow-hidden">
            <SVGAnalyticsScatterChart data={locationHistory} />
          </div>
        </div>

        {/* CHART 4: RADAR CHART (Normalized comparative sub-indices) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-72 flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="text-sm font-extrabold text-gray-800 tracking-tight uppercase text-gray-500 text-[11px] mb-1">
              🕸️ CPCB Sub-Index Radar
            </h3>
            <p className="text-xs text-gray-400 font-semibold mb-3">Comparative normalized severity of each pollutant segment on the identical 0-500 CPCB scale</p>
          </div>
          <div className="flex-1 flex overflow-hidden">
            {currentDisplay?.isIoT ? (
              <SVGAnalyticsRadarChart subIndices={currentDisplay?.subIndices} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 font-semibold text-xs border border-dashed border-gray-200 rounded-xl h-[150px]">
                🕸️ CPCB sub-index breakdown radar is only generated for Deployed IoT nodes.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Database Records Table ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap justify-between items-center mb-5 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Historical Database logs</h3>
            <p className="text-xs text-gray-400 mt-0.5">Showing live database activity logs stored in MongoDB</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search city, node or index..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            />
            <button
              onClick={exportToCSV}
              className="bg-blue-600 text-white font-bold rounded-lg px-4.5 py-1.5 text-xs hover:bg-blue-700 transition-colors shadow-sm active:scale-95"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs uppercase bg-gray-50 border-b border-gray-200 text-gray-500 font-bold sticky top-0">
              <tr>
                <th className="px-5 py-3 font-bold">Timestamp</th>
                <th className="px-5 py-3 font-bold">Source</th>
                <th className="px-5 py-3 font-bold">Node ID</th>
                <th className="px-5 py-3 font-bold">City</th>
                <th className="px-5 py-3 font-bold text-gray-900">Calculated AQI</th>
                <th className="px-5 py-3 font-bold">PM2.5</th>
                <th className="px-5 py-3 font-bold">PM10</th>
                <th className="px-5 py-3 font-bold">CO</th>
                <th className="px-5 py-3 font-bold">Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableList.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-400 font-bold">
                    {loading ? 'Initializing historical logs...' : 'No historical logs match your query'}
                  </td>
                </tr>
              ) : (
                filteredTableList.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-400 text-xs">{item.timestamp}</td>
                    <td className="px-5 py-3.5">
                      {item.sourceType === 'iot' ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-black uppercase">📡 IoT Node</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[9px] font-black uppercase">🏢 API Station</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-800 text-xs">{item.nodeId}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-700">{item.city}</td>
                    <td className={`px-5 py-3.5 font-black text-sm ${aqiColor(item.aqi)}`}>{item.aqi}</td>
                    <td className="px-5 py-3.5 font-bold text-orange-500 text-xs">{item.pm25}</td>
                    <td className="px-5 py-3.5 font-bold text-yellow-600 text-xs">{item.pm10}</td>
                    <td className="px-5 py-3.5 font-bold text-blue-500 text-xs">{item.co}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${aqiBg(item.aqi)}`}>
                        {item.category}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;