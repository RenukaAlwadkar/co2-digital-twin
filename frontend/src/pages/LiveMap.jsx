import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// ─── AQI Color & Label Logic ─────────────────────────────────────────────────
const getAQIColor = (aqi) => {
  if (!aqi || aqi <= 0) return '#94a3b8';
  if (aqi <= 50)  return '#22c55e';
  if (aqi <= 100) return '#eab308';
  if (aqi <= 200) return '#f97316';
  if (aqi <= 300) return '#ef4444';
  return '#7f1d1d';
};

const getAQILabel = (aqi) => {
  if (!aqi || aqi <= 0) return 'Unknown';
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
};

// ─── Marker icon factories ────────────────────────────────────────────────────
// Square = Official API source
const createApiMarker = (aqi, selected = false, isForecast = false) => L.divIcon({
  className: '',
  html: `<div style="
    width:${selected ? 44 : 34}px; height:${selected ? 44 : 34}px;
    background:${getAQIColor(aqi)};
    border:${selected ? '4px solid #1e40af' : (isForecast ? '3px dashed #a855f7' : '3px solid white')};
    border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    color:white; font-weight:bold; font-size:${selected ? 13 : 11}px;
    box-shadow: ${isForecast ? '0 0 15px rgba(168,85,247,0.8)' : `0 2px 10px rgba(0,0,0,${selected ? 0.5 : 0.3})`};
    transition: all 0.2s;
  ">${aqi ?? '?'}</div>`,
  iconSize: [selected ? 44 : 34, selected ? 44 : 34],
  iconAnchor: [selected ? 22 : 17, selected ? 22 : 17],
  popupAnchor: [0, -24],
});

// Circle + pulse = Wokwi IoT source
const createIoTMarker = (aqi, selected = false) => L.divIcon({
  className: '',
  html: `
    <div style="
      width:${selected ? 44 : 34}px; height:${selected ? 44 : 34}px;
      background:${getAQIColor(aqi)};
      border:${selected ? '4px solid #1e40af' : '3px solid white'};
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      color:white; font-weight:bold; font-size:${selected ? 13 : 11}px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.4);
    ">${aqi ?? '?'}</div>
    <style>@keyframes iot-pulse {
      0%   { box-shadow: 0 0 0 0 ${getAQIColor(aqi)}66; }
      70%  { box-shadow: 0 0 0 10px transparent; }
      100% { box-shadow: 0 0 0 0 transparent; }
    }</style>`,
  iconSize: [selected ? 44 : 34, selected ? 44 : 34],
  iconAnchor: [selected ? 22 : 17, selected ? 22 : 17],
  popupAnchor: [0, -24],
});

// ─── Map pan helper ───────────────────────────────────────────────────────────
const FlyTo = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 12, { duration: 1.2 });
  }, [center, map]);
  return null;
};

// Wokwi IoT node locations are now served from the backend (nodeRegistry.js)
// No hardcoded coordinates in frontend

// ─── Main Component ───────────────────────────────────────────────────────────
// ─── Filter definitions ──────────────────────────────────────────────────────
const SEVERITY_FILTERS = [
  { id: 'all',       label: 'All AQI',    fn: () => true },
  { id: 'good',      label: '🟢 Good',     fn: aqi => aqi <= 50 },
  { id: 'moderate',  label: '🟡 Moderate', fn: aqi => aqi > 50 && aqi <= 200 },
  { id: 'poor',      label: '🟠 Poor',     fn: aqi => aqi > 200 && aqi <= 300 },
  { id: 'severe',    label: '🔴 Severe',   fn: aqi => aqi > 300 },
];

const LiveMap = () => {
  const [allCityAQI, setAllCityAQI] = useState([]);     // All API cities
  const [sensors, setSensors]       = useState([]);      // All IoT nodes
  const [selectedCity, setSelectedCity] = useState('All');
  const [loading, setLoading]       = useState(true);
  const [flyTarget, setFlyTarget]   = useState(null);
  // Filters
  const [showAPI, setShowAPI]         = useState(true);
  const [showIoT, setShowIoT]         = useState(true);
  const [severityFilter, setSeverity] = useState('all');
  const [staleHours, setStaleHours]   = useState(null); // null = show all
  const [filterOpen, setFilterOpen]   = useState(false);

  // AI Forecast Mode
  const [mapMode, setMapMode]       = useState('live'); // 'live' | 'forecast'
  const [forecasts, setForecasts]   = useState({});
  const [forecastLoading, setForecastLoading] = useState(false);

  const fetchForecasts = async () => {
    if (Object.keys(forecasts).length > 0) return; // Already fetched
    setForecastLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/aqi/forecast-all');
      setForecasts(res.data);
    } catch (error) {
      console.error("Failed to fetch forecasts", error);
    } finally {
      setForecastLoading(false);
    }
  };

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [aqiAllRes, sensorRes] = await Promise.all([
          axios.get('http://localhost:5000/api/aqi/all'),
          axios.get('http://localhost:5000/api/sensors/latest'),
        ]);
        setAllCityAQI(aqiAllRes.data);
        setSensors(sensorRes.data);
      } catch (err) {
        console.error('LiveMap fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Build city list for dropdown ────────────────────────────────────────────
  const cityOptions = useMemo(() => {
    const names = allCityAQI.map(c => c.city).filter(Boolean);
    // Deduplicate (API may return slightly different names)
    return ['All', ...new Set(names)].sort((a, b) => a === 'All' ? -1 : a.localeCompare(b));
  }, [allCityAQI]);

  // ── When city selected, fly there ───────────────────────────────────────────
  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
    if (cityName === 'All') { setFlyTarget(null); return; }

    // Check IoT registry first
    const iotMatch = sensors.find(s => s.city === cityName);
    if (iotMatch?.location) { setFlyTarget([iotMatch.location.lat, iotMatch.location.lng]); return; }

    // Else use API location
    const apiMatch = allCityAQI.find(c => c.city === cityName);
    if (apiMatch?.location?.lat) setFlyTarget([apiMatch.location.lat, apiMatch.location.lon]);
  };

  // ── Build IoT city map from backend data (location + estAqi from API) ────────
  const iotCityMap = useMemo(() => {
    const map = {};
    sensors.forEach(sensor => {
      if (sensor.city && sensor.location?.lat && sensor.location?.lng) {
        // Ensure only the most recently active node is displayed for this city
        const existing = map[sensor.city];
        if (!existing || new Date(sensor.timestamp) > new Date(existing.sensor.timestamp)) {
          map[sensor.city] = {
            sensor,
            estAqi: sensor.estAqi ?? 0,
            lat:    sensor.location.lat,
            lng:    sensor.location.lng,
          };
        }
      }
    });
    return map;
  }, [sensors]);

  // ── Apply all filters ────────────────────────────────────────────────────────
  const severityFn = SEVERITY_FILTERS.find(f => f.id === severityFilter)?.fn || (() => true);
  const isStale = (ts) => {
    if (!staleHours) return false;
    return (Date.now() - new Date(ts).getTime()) > staleHours * 3600000;
  };

  const displayedCities = useMemo(() => {
    let cities = selectedCity === 'All' ? allCityAQI : allCityAQI.filter(c => c.city === selectedCity);
    if (!showAPI) return [];
    cities = cities.filter(c => severityFn(c.aqi || 0));
    if (staleHours) cities = cities.filter(c => !isStale(c.timestamp));
    return cities;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCityAQI, selectedCity, showAPI, severityFilter, staleHours]);

  const displayedIoT = useMemo(() => {
    if (!showIoT) return {};
    return Object.fromEntries(
      Object.entries(iotCityMap).filter(([, { estAqi, sensor }]) => {
        if (!severityFn(estAqi)) return false;
        if (staleHours && isStale(sensor.timestamp)) return false;
        return true;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iotCityMap, showIoT, severityFilter, staleHours]);

  // ── Status banner ────────────────────────────────────────────────────────────
  const iotOnline = sensors.length > 0;
  const apiOnline = allCityAQI.length > 0;
  const banner = iotOnline && apiOnline
    ? { text: `🧠 Data Fusion Active — ${allCityAQI.length} API Cities + ${sensors.length} IoT Node(s)`, bg: 'bg-blue-600' }
    : iotOnline ? { text: '📡 IoT Only Mode', bg: 'bg-green-600' }
    : apiOnline  ? { text: `🌐 Official API — ${allCityAQI.length} Cities`, bg: 'bg-gray-600' }
    : { text: '⚠️ No Data Sources Connected', bg: 'bg-red-500' };

  const defaultCenter = [22.5937, 78.9629]; // Centre of India

  return (
    <div className="relative w-full h-screen bg-gray-50">

      {/* ── Fusion banner ─────────────────────────────────────────────────── */}
      <div className={`absolute top-0 left-0 right-0 z-[600] ${banner.bg} text-white text-xs font-semibold text-center py-1.5 tracking-wide`}>
        {banner.text}
      </div>

      {/* ── City Selector Dropdown ────────────────────────────────────────── */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[500] bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-2 flex items-center gap-3">
        <span className="text-gray-500 text-sm font-medium whitespace-nowrap">🏙️ City:</span>
        <select
          value={selectedCity}
          onChange={e => handleCitySelect(e.target.value)}
          className="text-sm font-semibold text-gray-800 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
        >
          {cityOptions.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        {selectedCity !== 'All' && (
          <button
            onClick={() => handleCitySelect('All')}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors font-medium"
          >✕ Clear</button>
        )}
      </div>

      {/* ── Time-Travel Toggle ────────────────────────────────────────────── */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] bg-white border border-gray-200 shadow-lg rounded-xl p-1.5 flex items-center gap-1">
        <button
          onClick={() => setMapMode('live')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mapMode === 'live' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
        >
          🟢 Live Data
        </button>
        <button
          onClick={() => {
            setMapMode('forecast');
            fetchForecasts();
          }}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mapMode === 'forecast' ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-300' : 'text-gray-500 hover:bg-purple-50'}`}
        >
          🔮 T+1h Forecast
          {forecastLoading && <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>}
        </button>
      </div>

      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 pt-7">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 animate-pulse text-lg">
            Loading India AQI data...
          </div>
        ) : (
          <MapContainer center={defaultCenter} zoom={5} className="w-full h-full" zoomControl={true}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {flyTarget && <FlyTo center={flyTarget} />}

            {/* ── Official API Markers (square) ── */}
            {displayedCities.map((cityData) => {
              if (!cityData?.location?.lat || !cityData?.location?.lon) return null;

              // If this city has a Wokwi IoT node, skip the API marker (IoT takes priority)
              if (iotCityMap[cityData.city]) return null;

              const isSelected = selectedCity === cityData.city;
              const hasForecast = forecasts[cityData.city] != null;
              const fAqi = hasForecast ? Math.round(forecasts[cityData.city]) : null;
              const displayAqi = mapMode === 'forecast' && hasForecast ? fAqi : cityData.aqi;
              const isForecastMode = mapMode === 'forecast' && hasForecast;

              return (
                <React.Fragment key={`api-${cityData._id || cityData.city}`}>
                  {/* Expanding Danger Radius behind the marker */}
                  {mapMode === 'live' && hasForecast && fAqi > cityData.aqi && (
                    <Circle 
                      center={[cityData.location.lat, cityData.location.lon]} 
                      radius={35000} 
                      pathOptions={{ color: getAQIColor(fAqi), fillColor: getAQIColor(fAqi), fillOpacity: 0.15, weight: 1, dashArray: "5,5" }} 
                    />
                  )}
                  
                  <Marker
                    position={[cityData.location.lat, cityData.location.lon]}
                    icon={createApiMarker(displayAqi, isSelected, isForecastMode)}
                  >
                    <Popup maxWidth={220}>
                      <div style={{ fontFamily: 'sans-serif' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{cityData.city}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>📍 Official Station</div>
                        
                        <div style={{ fontWeight: 800, fontSize: 26, color: getAQIColor(displayAqi), display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {displayAqi} 
                          {isForecastMode && <span style={{fontSize: 12, color: '#a855f7', fontWeight: 'bold'}} className="animate-pulse">🔮 T+1h Forecast</span>}
                        </div>
                        <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>{getAQILabel(displayAqi)}</div>
                        
                        {/* Predictive Popup Row */}
                        {mapMode === 'live' && hasForecast && (
                          <div style={{ fontSize: 11, fontWeight: 'bold', background: '#f3e8ff', padding: '6px', borderRadius: '6px', color: '#7e22ce', marginBottom: '8px' }}>
                            Current: {cityData.aqi} ➔ AI Forecast: {fAqi} {fAqi > cityData.aqi ? '📉' : '📈'}
                          </div>
                        )}

                        {cityData.pollutants && (
                          <div style={{ fontSize: 11, borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>
                            <div>PM2.5: <b>{cityData.pollutants.pm25 ?? 'N/A'}</b></div>
                            <div>PM10: <b>{cityData.pollutants.pm10 ?? 'N/A'}</b></div>
                            <div>NO₂: <b>{cityData.pollutants.no2 ?? 'N/A'}</b></div>
                            <div>NOx: <b>{cityData.pollutants.nox ?? 'N/A'}</b></div>
                            <div>NO: <b>{cityData.pollutants.no ?? 'N/A'}</b></div>
                            <div>NH₃: <b>{cityData.pollutants.nh3 ?? 'N/A'}</b></div>
                            <div>CO: <b>{cityData.pollutants.co ?? 'N/A'}</b></div>
                            <div>O₃: <b>{cityData.pollutants.o3 ?? 'N/A'}</b></div>
                          </div>
                        )}
                        <div style={{ marginTop: 6, fontSize: 10, color: '#9ca3af' }}>
                          🕐 {new Date(cityData.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}

            {/* ── Wokwi IoT Node Markers (circle + glow) ── */}
            {Object.entries(displayedIoT).map(([cityName, { sensor, estAqi, lat, lng }]) => {
              // Only show if city is selected or All is selected
              const shouldShow = selectedCity === 'All' || selectedCity === cityName;
              if (!shouldShow) return null;
              const isSelected = selectedCity === cityName;
              return (
                <Marker
                  key={`iot-${sensor.nodeId}`}
                  position={[lat, lng]}
                  icon={createIoTMarker(estAqi, isSelected)}
                >
                  <Popup maxWidth={210}>
                    <div style={{ fontFamily: 'sans-serif' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{cityName}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>🔌 Wokwi IoT Node · {sensor.nodeId}</div>
                      <div style={{ fontWeight: 800, fontSize: 26, color: getAQIColor(estAqi) }}>
                        {estAqi}
                      </div>
                      <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>{getAQILabel(estAqi)}</div>
                      <div style={{ fontSize: 11, borderTop: '1px solid #e5e7eb', paddingTop: 6 }}>
                        <div>🌡️ Temp: <b>{sensor.temperature ?? 'N/A'}°C</b></div>
                        <div>💧 Humidity: <b>{sensor.humidity ?? 'N/A'}%</b></div>
                        <div>🏭 MQ135: <b>{sensor.mq135 ?? 'N/A'}</b></div>
                        <div>💨 MQ7 (CO): <b>{sensor.mq7 ?? 'N/A'}</b></div>
                        <div>💡 Light: <b>{sensor.light ?? 'N/A'}%</b></div>
                        <div>🔵 Pressure: <b>{sensor.pressure ?? 'N/A'} hPa</b></div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 10, color: '#9ca3af' }}>
                        🕐 {new Date(sensor.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* ── Filter Panel Toggle Button ────────────────────────────────────── */}
      <button
        onClick={() => setFilterOpen(o => !o)}
        className={`absolute top-12 right-6 z-[500] flex items-center gap-2 px-4 py-2 rounded-xl shadow-md border text-sm font-semibold transition-all ${
          filterOpen ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
        }`}
      >
        <span>⚙️ Filters</span>
        {(severityFilter !== 'all' || !showAPI || !showIoT || staleHours) && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">!</span>
        )}
      </button>

      {/* ── Filter Panel ─────────────────────────────────────────────────── */}
      {filterOpen && (
        <div className="absolute top-24 right-6 z-[500] bg-white border border-gray-200 shadow-xl rounded-2xl p-5 w-64">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Map Filters</h3>
            <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
          </div>

          {/* Source filter */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data Source</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showAPI} onChange={e => setShowAPI(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="w-4 h-4 bg-blue-500 rounded-[3px] border border-white shadow-sm"></span>
                <span className="text-sm text-gray-700">Official API <span className="text-gray-400">({allCityAQI.length})</span></span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showIoT} onChange={e => setShowIoT(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded" />
                <span className="w-4 h-4 bg-green-500 rounded-full border border-white shadow-sm"></span>
                <span className="text-sm text-gray-700">IoT Nodes <span className="text-gray-400">({sensors.length})</span></span>
              </label>
            </div>
          </div>

          {/* Severity filter */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">AQI Severity</p>
            <div className="flex flex-wrap gap-1.5">
              {SEVERITY_FILTERS.map(f => (
                <button key={f.id} onClick={() => setSeverity(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                    severityFilter === f.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Staleness / time filter */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Data Freshness</p>
            <div className="flex flex-wrap gap-1.5">
              {[null, 1, 6, 24].map(h => (
                <button key={h ?? 'all'} onClick={() => setStaleHours(h)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                    staleHours === h
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}>
                  {h === null ? 'All time' : `< ${h}h`}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Hide nodes older than selected</p>
          </div>

          {/* Reset */}
          <button
            onClick={() => { setShowAPI(true); setShowIoT(true); setSeverity('all'); setStaleHours(null); }}
            className="w-full text-xs text-center text-red-500 hover:text-red-700 font-medium pt-2 border-t border-gray-200 transition-colors"
          >↺ Reset All Filters</button>
        </div>
      )}

      {/* ── AQI Legend (Bottom Right) ────────────────────────────────────── */}
      <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur border border-gray-200 p-4 rounded-xl shadow-md z-[400]">
        <h3 className="text-gray-800 font-semibold mb-3 text-sm border-b border-gray-200 pb-2">AQI Legend</h3>
        <div className="space-y-1.5 text-xs">
          {[
            ['#22c55e', '0–50', 'Good'],
            ['#eab308', '51–100', 'Satisfactory'],
            ['#f97316', '101–200', 'Moderate'],
            ['#ef4444', '201–300', 'Poor'],
            ['#7f1d1d', '301+', 'Very Poor / Severe'],
          ].map(([color, range, label]) => (
            <div key={range} className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: color }}></span>
              <span className="text-gray-700"><b>{range}</b> {label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats Bottom Left ────────────────────────────────────────────── */}
      <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur border border-gray-200 px-4 py-3 rounded-xl shadow-md z-[400] text-xs text-gray-600 space-y-1">
        <div>🗺️ Cities tracked: <b className="text-gray-900">{allCityAQI.length}</b></div>
        <div>📡 IoT nodes online: <b className="text-green-600">{sensors.length}</b></div>
        {allCityAQI.length > 0 && (
          <div>⬆️ Max AQI: <b className="text-red-500">{Math.max(...allCityAQI.map(c => c.aqi || 0))}</b></div>
        )}
      </div>
    </div>
  );
};

export default LiveMap;