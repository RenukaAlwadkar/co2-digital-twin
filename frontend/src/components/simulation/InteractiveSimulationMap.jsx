import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { MapContainer, TileLayer, Rectangle, Tooltip, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const INDIA_BOUNDS = [[6, 68], [37, 97]];

// CPCB AQI color scale
const getAqiColor = (aqi) => {
  if (!aqi || aqi <= 0) return '#e5e7eb';
  if (aqi <= 50) return '#22c55e';
  if (aqi <= 100) return '#84cc16';
  if (aqi <= 200) return '#eab308';
  if (aqi <= 300) return '#f97316';
  if (aqi <= 400) return '#ef4444';
  return '#991b1b';
};

const getAqiLabel = (aqi) => {
  if (!aqi) return 'No Data';
  if (aqi <= 50) return 'Good 😊';
  if (aqi <= 100) return 'Satisfactory 🙂';
  if (aqi <= 200) return 'Moderate 😐';
  if (aqi <= 300) return 'Poor 😟';
  if (aqi <= 400) return 'Very Poor 😷';
  return 'Severe ☠️';
};

// How much does this cell's pollutant concentration differ from neighbors?
// Used to visualize diffusion gradient — higher = this cell is a "source" spreading outward
const getDiffusionIntensity = (cell, gridState) => {
  if (!cell.neighbors || cell.neighbors.length === 0) return 0;
  const neighborCells = cell.neighbors.map(id => gridState.find(c => c.cellId === id)).filter(Boolean);
  if (neighborCells.length === 0) return 0;
  const avgNeighborPm25 = neighborCells.reduce((s, c) => s + (c.pollutants?.pm25 || 0), 0) / neighborCells.length;
  const myPm25 = cell.pollutants?.pm25 || 0;
  return Math.max(0, myPm25 - avgNeighborPm25); // positive = I'm a source diffusing to neighbors
};

const InteractiveSimulationMap = () => {
  const { gridState, activeLayers, setActiveLayers, aqiNodes, sensorNodes, selectedNode, selectNode, baselineConditions } = useSimulation();

  const LAYER_LABELS = {
    aqiHeatmap: 'AQI Grid',
    diffusion: 'Diffusion',
    traffic: 'Traffic',
    windVectors: 'Wind',
    vegetation: 'Vegetation',
  };

  // Active layers now includes diffusion
  const mapCenter = selectedNode?.location
    ? [selectedNode.location.lat || selectedNode.location.lat, selectedNode.location.lng || selectedNode.location.lon]
    : [22.5, 82];
  const mapZoom = selectedNode ? 9 : 5;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-full shadow-sm">

      {/* Map header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-gray-800">🗺️ Live Environmental Map</h2>
            <p className="text-xs text-gray-400">
              {selectedNode
                ? `Showing simulation grid around ${baselineConditions?.label}`
                : 'All monitoring stations across India — click any to select'}
            </p>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {Object.entries(LAYER_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  activeLayers[key]
                    ? 'bg-purple-100 border-purple-300 text-purple-700 font-semibold'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* AQI Legend */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">AQI Scale:</span>
          {[['≤50 Good','#22c55e'], ['≤100 Satisf.','#84cc16'], ['≤200 Mod.','#eab308'], ['≤300 Poor','#f97316'], ['≤400 V.Poor','#ef4444'], ['500+ Severe','#991b1b']].map(([l,c]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{backgroundColor: c}}/>
              <span className="text-xs text-gray-400">{l}</span>
            </div>
          ))}
          {activeLayers.diffusion && (
            <div className="flex items-center gap-1 ml-2 border-l border-gray-200 pl-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 opacity-60"/>
              <span className="text-xs text-orange-600 font-medium">Diffusion source</span>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1" style={{ minHeight: '360px' }}>
        <MapContainer
          center={mapCenter} zoom={mapZoom}
          maxBounds={INDIA_BOUNDS}
          style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          />

          {/* ── AQICN station markers ── */}
          {aqiNodes.map((node, i) => {
            const lat = node.location?.lat;
            const lon = node.location?.lon;
            if (!lat || !lon) return null;
            const isSelected = selectedNode?.city === node.city;
            return (
              <CircleMarker key={`aqi-${i}`} center={[lat, lon]}
                radius={isSelected ? 10 : 6}
                pathOptions={{
                  fillColor: getAqiColor(node.aqi), fillOpacity: isSelected ? 1 : 0.75,
                  color: isSelected ? '#7c3aed' : '#ffffff', weight: isSelected ? 3 : 1.5
                }}
                eventHandlers={{ click: () => selectNode(node, 'aqicn') }}>
                <Tooltip>
                  <div style={{ fontSize: '12px', lineHeight: '1.7' }}>
                    <strong>{node.city}</strong><br/>
                    <span style={{ color: getAqiColor(node.aqi) }}>AQI {node.aqi} — {getAqiLabel(node.aqi)}</span><br/>
                    PM2.5: <strong>{node.pollutants?.pm25 ?? '--'}</strong> µg/m³ &nbsp;|&nbsp; NO2: {node.pollutants?.no2 ?? '--'}<br/>
                    CO: {node.pollutants?.co ?? '--'} &nbsp;|&nbsp; O3: {node.pollutants?.o3 ?? '--'}<br/>
                    <span style={{ color: '#9ca3af' }}>📡 AQICN Station · Click to select as baseline</span>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* ── IoT hardware node markers ── */}
          {sensorNodes.map((node, i) => {
            const lat = node.location?.lat;
            const lon = node.location?.lng;
            if (!lat || !lon) return null;
            const isSelected = selectedNode?.nodeId === node.nodeId;
            return (
              <CircleMarker key={`iot-${i}`} center={[lat, lon]}
                radius={isSelected ? 14 : 10}
                pathOptions={{
                  fillColor: getAqiColor(node.estAqi), fillOpacity: 1,
                  color: isSelected ? '#7c3aed' : '#15803d',
                  weight: isSelected ? 3 : 2, dashArray: '4 2'
                }}
                eventHandlers={{ click: () => selectNode(node, 'iot') }}>
                <Tooltip>
                  <div style={{ fontSize: '12px', lineHeight: '1.7' }}>
                    <strong>📡 {node.city} ({node.nodeId})</strong><br/>
                    <span style={{ color: getAqiColor(node.estAqi) }}>Est. AQI {node.estAqi} — {getAqiLabel(node.estAqi)}</span><br/>
                    Temperature: {node.temperature}°C &nbsp;|&nbsp; Humidity: {node.humidity}%<br/>
                    CO (est.): {node.estPollutants?.co?.toFixed(1)} &nbsp;|&nbsp; NO2: {node.estPollutants?.no2?.toFixed(1)}<br/>
                    <span style={{ color: '#9ca3af' }}>Hardware IoT Node · Click to select as baseline</span>
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* ── Simulation Grid (anchored to selected node) ── */}
          {selectedNode && gridState.map(cell => {
            const latStep = 0.018;
            const lonStep = 0.024;
            const baseLat = selectedNode.location?.lat;
            const baseLon = selectedNode.location?.lon ?? selectedNode.location?.lng;
            if (!baseLat || !baseLon) return null;

            const row = parseInt(cell.cellId.split('_')[1]);
            const col = parseInt(cell.cellId.split('_')[2]);
            const cellLat = baseLat + (row - 4) * latStep;
            const cellLon = baseLon + (col - 4) * lonStep;

            const cellBounds = [
              [cellLat - latStep / 2, cellLon - lonStep / 2],
              [cellLat + latStep / 2, cellLon + lonStep / 2]
            ];

            // Diffusion intensity — how much is this cell a pollution source vs its neighbors?
            const diffIntensity = activeLayers.diffusion ? getDiffusionIntensity(cell, gridState) : 0;
            const isDiffusingOutward = diffIntensity > 5;

            return (
              <React.Fragment key={cell.cellId}>
                {/* Main AQI cell rectangle */}
                {activeLayers.aqiHeatmap && (
                  <Rectangle bounds={cellBounds}
                    pathOptions={{
                      fillColor: getAqiColor(cell.aqi),
                      fillOpacity: 0.4,
                      color: getAqiColor(cell.aqi),
                      weight: 0.6,
                      opacity: 0.5
                    }}>
                    <Tooltip sticky>
                      <div style={{ fontSize: '12px', lineHeight: '1.7' }}>
                        <strong>{cell.cellId}</strong> — AQI <strong style={{ color: getAqiColor(cell.aqi) }}>{Math.round(cell.aqi)}</strong><br/>
                        {getAqiLabel(cell.aqi)}<br/>
                        PM2.5: {cell.pollutants?.pm25?.toFixed(1)} µg/m³ &nbsp;|&nbsp; PM10: {cell.pollutants?.pm10?.toFixed(1)}<br/>
                        NO2: {cell.pollutants?.no2?.toFixed(1)} &nbsp;|&nbsp; CO: {cell.pollutants?.co?.toFixed(2)}<br/>
                        Wind: {cell.weather?.windSpeed} m/s @ {cell.weather?.windDirection}°<br/>
                        {activeLayers.diffusion && <span>Diffusion outflow: <strong>{diffIntensity.toFixed(1)}</strong> µg/m³</span>}
                      </div>
                    </Tooltip>
                  </Rectangle>
                )}

                {/* Diffusion layer — orange pulse circle on source cells */}
                {activeLayers.diffusion && isDiffusingOutward && (
                  <CircleMarker
                    center={[cellLat, cellLon]}
                    radius={Math.min(20, 6 + diffIntensity * 0.4)}
                    pathOptions={{
                      fillColor: '#f97316',
                      fillOpacity: 0.25,
                      color: '#f97316',
                      weight: 1,
                      opacity: 0.5
                    }}>
                    <Tooltip>
                      <div style={{ fontSize: '11px' }}>
                        <strong>Diffusion Source</strong><br/>
                        This cell is actively spreading pollution to neighbors.<br/>
                        Outflow: {diffIntensity.toFixed(1)} µg/m³ PM2.5
                      </div>
                    </Tooltip>
                  </CircleMarker>
                )}

                {/* Traffic layer */}
                {activeLayers.traffic && (
                  <Rectangle bounds={cellBounds}
                    pathOptions={{
                      fillColor: '#8b5cf6',
                      fillOpacity: (cell.trafficDensity || 0) / 300,
                      color: 'transparent', weight: 0
                    }}/>
                )}

                {/* Vegetation layer */}
                {activeLayers.vegetation && (
                  <Rectangle bounds={cellBounds}
                    pathOptions={{
                      fillColor: '#16a34a',
                      fillOpacity: (cell.greenCoverage || 0) / 200,
                      color: 'transparent', weight: 0
                    }}/>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default InteractiveSimulationMap;
