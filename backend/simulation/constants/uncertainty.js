module.exports = {
  // Confidence weighting (0.0 to 1.0)
  WEIGHTS: {
    LIVE_SENSOR_TRUST: 0.9, // Trust real IoT sensors heavily
    SIMULATION_TRUST: 0.5,  // Trust mathematical models moderately when sensors are absent
    NEIGHBOR_INTERPOLATION_TRUST: 0.3 // Lowest trust for guessed intermediate points
  },
  
  // Forecast decay
  FORECAST_DECAY: {
    '1h': 0.8, // 80% confident in 1h prediction
    '6h': 0.5,
    '24h': 0.2
  }
};
