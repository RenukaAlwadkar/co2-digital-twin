const TRAFFIC_CONSTANTS = require('../constants/traffic');
const GRID_CONSTANTS = require('../constants/grid');

class TrafficEngine {
  /**
   * Calculates traffic emissions based on COPERT-style models.
   * E = VehicleCount * Distance * EF(v)
   * 
   * @param {Object} cell The grid cell to update
   * @returns {Object} Pollutants emitted from traffic in this cell
   */
  calculateEmissions(cell) {
    // Basic heuristics: density correlates to vehicle count
    // Speed correlates inversely to density (high density = traffic jam = low speed)
    const density = cell.trafficDensity; // 0-100
    if (density === 0) return { pm25: 0, pm10: 0, co: 0, no2: 0 };

    // Simulated average speed (km/h): e.g., density 100 -> 10km/h, density 10 -> 60km/h
    const averageSpeed = Math.max(10, 70 - (density * 0.6));
    
    // EF(v) = a0 + a1*v + a2*v²
    const speedFactor = 1.0; // Mock: could look up SPEED_MULTIPLIERS based on averageSpeed
    const vehicleCount = density * 10; 
    const distance = GRID_CONSTANTS.GRID.CELL_SIZE_METERS / 1000;

    const baseEf = TRAFFIC_CONSTANTS.EMISSION_FACTORS.CAR_PETROL;

    // E = A * EF
    // We'll normalize this to an addition to the concentration (µg/m³) for simplicity of the model
    // In reality, this would be a mass flux that gets mixed into the cell volume.
    const volumeMixingFactor = 1 / 10; 

    return {
      pm25: vehicleCount * distance * baseEf.pm25 * speedFactor * volumeMixingFactor,
      pm10: vehicleCount * distance * baseEf.pm10 * speedFactor * volumeMixingFactor,
      co: vehicleCount * distance * baseEf.co * speedFactor * volumeMixingFactor,
      no2: vehicleCount * distance * baseEf.no2 * speedFactor * volumeMixingFactor,
    };
  }

  applyEmissions(cell) {
    const emitted = this.calculateEmissions(cell);
    cell.pollutants.pm25 += emitted.pm25;
    cell.pollutants.pm10 += emitted.pm10;
    cell.pollutants.co += emitted.co;
    cell.pollutants.no2 += emitted.no2;
  }
}

module.exports = new TrafficEngine();
