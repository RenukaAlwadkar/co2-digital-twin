class AssimilationEngine {
  /**
   * Corrects simulation state using live IoT sensor data.
   * Simple Ensemble Kalman Filter logic (Weighted average based on confidence).
   * 
   * @param {Object} cell The simulation cell
   * @param {Object} sensorData Real data from an IoT sensor in this cell (if any)
   */
  assimilateData(cell, sensorData) {
    if (!sensorData) return; // No live data for this cell

    // Kalmain gain heuristic: 
    // 0 = trust simulation entirely, 1 = trust sensor entirely.
    // Usually, sensor is highly trusted. Let's say 0.8
    const K = 0.8;

    if (sensorData.pm25) {
      cell.pollutants.pm25 = cell.pollutants.pm25 + K * (sensorData.pm25 - cell.pollutants.pm25);
    }
    if (sensorData.pm10) {
      cell.pollutants.pm10 = cell.pollutants.pm10 + K * (sensorData.pm10 - cell.pollutants.pm10);
    }
    if (sensorData.temperature) {
      cell.weather.temperature = cell.weather.temperature + K * (sensorData.temperature - cell.weather.temperature);
    }
    if (sensorData.humidity) {
      cell.weather.humidity = cell.weather.humidity + K * (sensorData.humidity - cell.weather.humidity);
    }
  }
}

module.exports = new AssimilationEngine();
