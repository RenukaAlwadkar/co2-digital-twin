const FORECAST_CONSTANTS = require('../constants/forecasting');

class ForecastEngine {
  /**
   * Generates basic heuristic forecasts (ARIMA-lite placeholder).
   * Predicts 1h, 6h, 24h AQI based on current trends and weather.
   * @param {Object} cell 
   */
  generateForecast(cell) {
    const { aqi } = cell;
    const { temperature, windSpeed, rainfall } = cell.weather;

    // Simple heuristic: 
    // - Rain in forecast -> AQI drops
    // - High wind -> AQI drops
    // - High temp inversion (low temp) -> AQI rises

    // Calculate trend modifier (-0.2 to +0.2)
    let modifier = 0;
    
    if (rainfall > 0) modifier -= 0.15;
    if (windSpeed > 10) modifier -= 0.1;
    if (temperature < 15) modifier += 0.15; // Inversion
    if (cell.trafficDensity > 70) modifier += 0.1;

    // 1h forecast
    cell.forecast['1h'] = Math.round(aqi * (1 + modifier));

    // 6h forecast (trends revert slightly to mean or amplify if extreme)
    cell.forecast['6h'] = Math.round(aqi * (1 + (modifier * 2)));

    // 24h forecast (assuming diurnal cycle, might be similar to current if same time tomorrow)
    // For now, smooth it back towards a baseline
    const baseline = 100;
    cell.forecast['24h'] = Math.round((aqi + baseline) / 2);

    // Prevent negative AQI
    cell.forecast['1h'] = Math.max(0, cell.forecast['1h']);
    cell.forecast['6h'] = Math.max(0, cell.forecast['6h']);
    cell.forecast['24h'] = Math.max(0, cell.forecast['24h']);
  }
}

module.exports = new ForecastEngine();
