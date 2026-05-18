const SimulationHistory = require('../models/SimulationHistory');
const stateManager = require('./stateManager');

const trafficEngine = require('../engines/trafficEngine');
const industrialEngine = require('../engines/industrialEngine');
const dispersionEngine = require('../engines/dispersionEngine');
const weatherEngine = require('../engines/weatherEngine');
const vegetationEngine = require('../engines/vegetationEngine');
const aqiEngine = require('../engines/aqiEngine');
const interpolationEngine = require('../engines/interpolationEngine');
const forecastEngine = require('../engines/forecastEngine');
const assimilationEngine = require('../engines/assimilationEngine');

class SimulationPipeline {
  constructor() {
    this.isRunning = false;
    this.fastIntervalId = null;
    this.slowIntervalId = null;
    this.persistIntervalId = null;
  }

  /**
   * Starts the hybrid event-driven and periodic simulation loops.
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    console.log(`[Simulation] Initializing State Manager...`);
    await stateManager.loadGrid();
    
    console.log(`[Simulation] Starting multi-frequency digital twin simulation`);

    // 1. Fast Loop (Local generation, diffusion, AQI update) - Every 10 seconds
    this.fastIntervalId = setInterval(() => {
      this.runFastTick();
    }, 10000);

    // 2. Slow Loop (Weather, Vegetation, IDW interpolation, Forecast) - Every 1 minute
    this.slowIntervalId = setInterval(() => {
      this.runSlowTick();
    }, 60000);

    // 3. Global Rebalance & Persist - Every 5 minutes
    this.persistIntervalId = setInterval(() => {
      this.runGlobalPersist();
    }, 300000);
  }

  stop() {
    if (this.fastIntervalId) clearInterval(this.fastIntervalId);
    if (this.slowIntervalId) clearInterval(this.slowIntervalId);
    if (this.persistIntervalId) clearInterval(this.persistIntervalId);
    this.isRunning = false;
    console.log('[Simulation] Stopped.');
  }

  /**
   * Fast tick: Local propagation, traffic emissions, advection, AQI compute.
   */
  runFastTick() {
    const cells = stateManager.getAllCells();
    if (cells.length === 0) return;

    // CPCB background (clean ambient) concentration reference levels (µg/m³)
    const BACKGROUND = { pm25: 20, pm10: 40, co: 0.5, no2: 10, so2: 5 };
    // Natural dilution/decay rate per tick (atmospheric mixing removes ~15% above background)
    const DECAY_RATE = 0.15;

    cells.forEach(cell => {
      // 1. Apply emission sources
      trafficEngine.applyEmissions(cell);
      industrialEngine.applyEmissions(cell);

      // 2. Apply natural atmospheric decay toward background levels (prevents unbounded accumulation)
      // ΔC = -DECAY_RATE * (C - C_background)  →  C(t+1) = C_bg + (C(t) - C_bg) * (1 - DECAY_RATE)
      const p = cell.pollutants;
      p.pm25 = BACKGROUND.pm25 + (p.pm25 - BACKGROUND.pm25) * (1 - DECAY_RATE);
      p.pm10 = BACKGROUND.pm10 + (p.pm10 - BACKGROUND.pm10) * (1 - DECAY_RATE);
      p.co   = BACKGROUND.co   + (p.co   - BACKGROUND.co)   * (1 - DECAY_RATE);
      p.no2  = BACKGROUND.no2  + (p.no2  - BACKGROUND.no2)  * (1 - DECAY_RATE);
      p.so2  = BACKGROUND.so2  + (p.so2  - BACKGROUND.so2)  * (1 - DECAY_RATE);

      // Clamp to physical minimums
      p.pm25 = Math.max(BACKGROUND.pm25 * 0.5, p.pm25);
      p.pm10 = Math.max(BACKGROUND.pm10 * 0.5, p.pm10);
      p.co   = Math.max(BACKGROUND.co   * 0.5, p.co);
      p.no2  = Math.max(BACKGROUND.no2  * 0.5, p.no2);
      p.so2  = Math.max(BACKGROUND.so2  * 0.5, p.so2);
    });

    dispersionEngine.applyDispersion(cells, stateManager);

    cells.forEach(cell => {
      aqiEngine.computeAQI(cell);
    });
  }

  /**
   * Slow tick: Weather changes, vegetation sinks, spatial smoothing, forecast.
   */
  runSlowTick() {
    const cells = stateManager.getAllCells();
    if (cells.length === 0) return;

    cells.forEach(cell => {
      weatherEngine.applyWeatherEffects(cell);
      vegetationEngine.applyVegetationSink(cell);
    });

    interpolationEngine.applyIDW(cells);

    cells.forEach(cell => {
      forecastEngine.generateForecast(cell);
    });
    
    console.log(`[Simulation] Slow tick completed. Grid state smoothed and forecasted.`);
  }

  /**
   * Global persist: Save to DB and log history.
   */
  async runGlobalPersist() {
    console.log(`[Simulation] Running global persist cycle...`);
    await stateManager.persistToDatabase();
    
    const cells = stateManager.getAllCells();
    if (cells.length > 0) {
      const cycleId = `CYC-${Date.now()}`;
      await this._recordHistory(cycleId, cells);
    }
  }

  async _recordHistory(cycleId, cells) {
    let totalAqi = 0;
    let totalPm25 = 0;
    
    const historyCells = cells.map(c => {
      totalAqi += c.aqi;
      totalPm25 += c.pollutants.pm25;
      
      return {
        cellId: c.cellId,
        aqi: c.aqi,
        pm25: c.pollutants.pm25,
        pm10: c.pollutants.pm10,
        temperature: c.weather.temperature,
        windSpeed: c.weather.windSpeed
      };
    });

    const averageAqi = totalAqi / cells.length;
    const averagePm25 = totalPm25 / cells.length;

    const historyRecord = new SimulationHistory({
      cycleId,
      cells: historyCells,
      averageAqi,
      averagePm25
    });

    await historyRecord.save();
  }
}

module.exports = new SimulationPipeline();
