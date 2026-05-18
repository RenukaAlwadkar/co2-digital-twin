const INDUSTRY_CONSTANTS = require('../constants/industry');

class IndustrialEngine {
  /**
   * Calculates industrial emissions.
   * Q = C_exit * FlowRate
   * @param {Object} cell 
   */
  applyEmissions(cell) {
    const intensity = cell.industrialIntensity; // 0-100
    if (intensity === 0) return;

    // Mock calculations based on intensity
    // Higher intensity -> more emissions
    // Industries emit mostly PM2.5, PM10, SO2, NO2
    
    // Scale factor to convert arbitrary intensity to concentration addition (µg/m³)
    const scale = 0.5;

    cell.pollutants.pm25 += intensity * 0.4 * scale;
    cell.pollutants.pm10 += intensity * 0.6 * scale;
    cell.pollutants.so2 += intensity * 0.8 * scale;
    cell.pollutants.no2 += intensity * 0.5 * scale;
  }
}

module.exports = new IndustrialEngine();
