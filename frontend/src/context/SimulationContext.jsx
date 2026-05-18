import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const SimulationContext = createContext(null);
const API_BASE = 'http://localhost:5000/api/simulation';
const AQI_API = 'http://localhost:5000/api/aqi';
const SENSOR_API = 'http://localhost:5000/api/sensors';

export const SimulationProvider = ({ children }) => {
  // --- Real data sources ---
  const [aqiNodes, setAqiNodes] = useState([]);        // AQICN city stations
  const [sensorNodes, setSensorNodes] = useState([]);  // IoT hardware nodes
  const [selectedNode, setSelectedNode] = useState(null); // The currently selected baseline node
  const [baselineConditions, setBaselineConditions] = useState(null); // Real env data from selected node

  // --- Simulation state ---
  const [gridState, setGridState] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [latencyMs, setLatencyMs] = useState(0);
  const [tickCount, setTickCount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [tickInterval, setTickInterval] = useState(5000);
  const [simulationLog, setSimulationLog] = useState([]);
  const [aqiHistory, setAqiHistory] = useState([]);    // Time-series for charts
  const [scenarioResult, setScenarioResult] = useState(null);
  const [scenarioModifiers, setScenarioModifiers] = useState({}); // deltas applied on top of baseline

  const [activeLayers, setActiveLayers] = useState({
    aqiHeatmap: true, diffusion: false, traffic: false, windVectors: false, vegetation: false,
  });

  const intervalRef = useRef(null);

  const addLog = useCallback((msg, type = 'info') => {
    setSimulationLog(prev => [
      { time: new Date().toLocaleTimeString(), msg, type },
      ...prev
    ].slice(0, 40));
  }, []);

  // --- Load real node list on mount ---
  useEffect(() => {
    const loadNodes = async () => {
      try {
        const [aqiRes, sensorRes] = await Promise.all([
          axios.get(`${AQI_API}/all`),
          axios.get(`${SENSOR_API}/latest`)
        ]);
        setAqiNodes(aqiRes.data || []);
        setSensorNodes(sensorRes.data || []);
        addLog(`Loaded ${aqiRes.data.length} AQICN stations + ${sensorRes.data.length} IoT node(s).`, 'success');
      } catch (err) {
        addLog('Failed to load node list: ' + err.message, 'error');
      }
    };
    loadNodes();
  }, [addLog]);

  // --- When a node is selected, pull its live data as baseline ---
  const selectNode = useCallback(async (node, sourceType) => {
    setSelectedNode({ ...node, sourceType });
    setScenarioResult(null);
    setScenarioModifiers({});
    addLog(`Selected node: ${node.city || node.nodeId} as simulation baseline.`, 'info');

    let baseline;
    if (sourceType === 'iot') {
      baseline = {
        label: node.city || node.nodeId,
        lat: node.location?.lat,
        lon: node.location?.lng,
        aqi: node.estAqi,
        category: node.category,
        dominantPollutant: node.dominantPollutant,
        pollutants: {
          pm25: node.estPollutants?.pm25 || 0,
          pm10: node.estPollutants?.pm10 || 0,
          no2: node.estPollutants?.no2 || 0,
          co: node.estPollutants?.co || 0,
          so2: 0,
          o3: 0,
        },
        weather: {
          temperature: node.temperature || 30,
          humidity: node.humidity || 50,
          windSpeed: 5,       // IoT node doesn't have wind sensor — use a neutral default
          windDirection: 135,
          rainfall: 0,
        },
        source: `IoT Node: ${node.nodeId}`
      };
    } else {
      baseline = {
        label: node.city,
        lat: node.location?.lat,
        lon: node.location?.lon,
        aqi: node.aqi,
        category: node.category,
        dominantPollutant: null,
        pollutants: {
          pm25: node.pollutants?.pm25 || 0,
          pm10: node.pollutants?.pm10 || 0,
          no2: node.pollutants?.no2 || 0,
          so2: node.pollutants?.so2 || 0,
          co: node.pollutants?.co || 0,
          o3: node.pollutants?.o3 || 0,
        },
        weather: {
          temperature: 30,    // AQICN doesn't provide weather — use neutral default
          humidity: 50,
          windSpeed: 5,
          windDirection: 135,
          rainfall: 0,
        },
        source: `AQICN Station: ${node.city}`
      };
    }

    setBaselineConditions(baseline);

    // Initialize the scenario modifiers at ZERO (no change from real baseline)
    setScenarioModifiers({
      trafficDelta: 0,       // % increase/decrease
      industryDelta: 0,
      greenDelta: 0,
      rainfallDelta: 0,      // mm/h added
      windSpeedDelta: 0,     // m/s change
      tempDelta: 0,
    });

    addLog(`Baseline loaded from ${baseline.source}. AQI: ${baseline.aqi} (${baseline.category}).`, 'success');
  }, [addLog]);

  // --- Simulation grid fetch ---
  const fetchGridState = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await axios.get(`${API_BASE}/state`);
      const cells = res.data;
      setGridState(cells);
      setLastSync(new Date());
      setLatencyMs(Date.now() - start);

      const avgAqi = cells.length > 0
        ? Math.round(cells.reduce((s, c) => s + c.aqi, 0) / cells.length)
        : 0;
      const centerCell = cells.find(c => c.cellId === 'CELL_4_4');

      setAqiHistory(prev => [...prev, {
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        avgAqi,
        centerAqi: centerCell?.aqi || 0,
        pm25: Math.round(centerCell?.pollutants?.pm25 || 0),
        no2: Math.round(centerCell?.pollutants?.no2 || 0),
        co: parseFloat((centerCell?.pollutants?.co || 0).toFixed(2)),
      }].slice(-20));
    } catch (err) {
      addLog('Grid fetch failed: ' + err.message, 'error');
    }
  }, [addLog]);

  // Initialize grid
  useEffect(() => {
    axios.post(`${API_BASE}/init`)
      .then(fetchGridState)
      .catch(e => addLog('Grid init failed: ' + e.message, 'error'));
  }, [fetchGridState, addLog]);

  // Simulation loop
  useEffect(() => {
    if (isSimulating) {
      intervalRef.current = setInterval(async () => {
        try {
          await axios.post(`${API_BASE}/trigger`);
          await fetchGridState();
          setTickCount(t => t + 1);
          addLog('Simulation tick complete.', 'tick');
        } catch (err) {
          addLog('Tick failed: ' + err.message, 'error');
        }
      }, tickInterval);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isSimulating, tickInterval, fetchGridState, addLog]);

  // --- Run a what-if scenario on top of the selected node's baseline ---
  const runScenario = useCallback(async (modifiers) => {
    if (!baselineConditions) {
      addLog('No node selected. Please select a real node first.', 'error');
      return;
    }

    setScenarioModifiers(modifiers);
    addLog(`Running scenario on: ${baselineConditions.label}`, 'scenario');

    // Compute modified conditions from real baseline + user deltas
    const modified = {
      // Pollutants already come from real data — traffic/industry modify them via simulation engine
      // We pass the traffic/industrial intensity as relative modifiers (0–100 scale from baseline % change)
      trafficDensity: Math.min(100, Math.max(0, 50 + modifiers.trafficDelta)),
      industrialIntensity: Math.min(100, Math.max(0, 40 + modifiers.industryDelta)),
      greenCoverage: Math.min(100, Math.max(0, 25 + modifiers.greenDelta)),
      weather: {
        temperature: baselineConditions.weather.temperature + modifiers.tempDelta,
        humidity: baselineConditions.weather.humidity,
        windSpeed: Math.max(0, baselineConditions.weather.windSpeed + modifiers.windSpeedDelta),
        windDirection: baselineConditions.weather.windDirection,
        rainfall: Math.max(0, baselineConditions.weather.rainfall + modifiers.rainfallDelta),
      }
    };

    try {
      // Patch ALL cells with baseline real pollutant concentrations + modified drivers
      const patches = gridState.map(cell =>
        axios.patch(`${API_BASE}/cell/${cell.cellId}`, {
          ...modified,
          // Seed each cell's pollutants from real baseline data
          pollutants: { ...baselineConditions.pollutants }
        })
      );
      await Promise.all(patches);
      await axios.post(`${API_BASE}/trigger`);
      await fetchGridState();

      const afterCell = gridState.find(c => c.cellId === 'CELL_4_4');
      const afterAqi = afterCell?.aqi || 0;

      setScenarioResult({
        baselineAqi: baselineConditions.aqi,
        simulatedAqi: afterAqi,
        delta: afterAqi - baselineConditions.aqi,
        appliedModifiers: modifiers
      });

      const delta = afterAqi - baselineConditions.aqi;
      addLog(`Scenario complete. Δ AQI: ${delta > 0 ? '+' : ''}${delta.toFixed(0)} from real baseline of ${baselineConditions.aqi}.`, 'success');
    } catch (err) {
      addLog('Scenario failed: ' + err.message, 'error');
    }
  }, [baselineConditions, gridState, fetchGridState, addLog]);

  const value = {
    aqiNodes, sensorNodes, selectedNode, selectNode,
    baselineConditions, scenarioModifiers,
    gridState, lastSync, latencyMs, tickCount,
    isSimulating, setIsSimulating, tickInterval, setTickInterval,
    activeLayers, setActiveLayers,
    simulationLog, aqiHistory, scenarioResult, addLog,
    runScenario, fetchGridState,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);
