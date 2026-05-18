const WEATHER_CONSTANTS = require('../constants/weather');

class WeatherEngine {
  /**
   * Applies weather corrections: rain scavenging, humidity growth, temperature inversion
   * @param {Object} cell 
   */
  applyWeatherEffects(cell) {
    const { temperature, humidity, rainfall } = cell.weather;
    
    const SCAVENGING_COEFFICIENT = WEATHER_CONSTANTS.SCAVENGING_COEFFICIENTS.PM25; 
    const HUMIDITY_GROWTH_FACTOR = WEATHER_CONSTANTS.HUMIDITY_GROWTH_MAX_MULTIPLIER;
    const INVERSION_TEMP_THRESHOLD = WEATHER_CONSTANTS.INVERSION_TEMP_THRESHOLD_CELSIUS;

    // 1. Rain Scavenging: dC/dt = -ΛC => C(t) = C0 * exp(-Λ * t)
    // t is arbitrary time step, say 1 unit
    if (rainfall > 0) {
      // Scavenging is stronger with heavier rain
      const lambda = SCAVENGING_COEFFICIENT * rainfall;
      const reductionFactor = Math.exp(-lambda); // Between 0 and 1
      
      cell.pollutants.pm25 *= reductionFactor;
      cell.pollutants.pm10 *= reductionFactor;
      cell.pollutants.no2 *= reductionFactor;
      cell.pollutants.so2 *= reductionFactor;
      // CO is less affected by rain washout
    }

    // 2. Humidity: High humidity increases PM mass (hygroscopic growth)
    if (humidity > 70) {
      // Add a slight multiplier based on how far above 70% it is
      const excessHumidity = humidity - 70;
      const growthMultiplier = 1 + ((excessHumidity / 30) * (HUMIDITY_GROWTH_FACTOR - 1));
      
      cell.pollutants.pm25 *= growthMultiplier;
      cell.pollutants.pm10 *= growthMultiplier;
    }

    // 3. Temperature Inversion (Simulated localized trap)
    // If temp is very low, pollution gets trapped (AQI spikes)
    if (temperature < INVERSION_TEMP_THRESHOLD) {
      // Increase concentrations to simulate trapped volume reduction
      const inversionMultiplier = 1.1; 
      cell.pollutants.pm25 *= inversionMultiplier;
      cell.pollutants.pm10 *= inversionMultiplier;
      cell.pollutants.no2 *= inversionMultiplier;
      cell.pollutants.so2 *= inversionMultiplier;
      cell.pollutants.co *= inversionMultiplier;
    }
  }
}

module.exports = new WeatherEngine();
