module.exports = {
  // Simple heuristic forecast config (pre-ML)
  HEURISTIC: {
    BASELINE_REVERSION_RATE: 0.5, // How fast a spike returns to baseline (e.g., 24h forecast)
    
    // Weather impact modifiers for 1h/6h forecast
    MODIFIERS: {
      RAIN_IMPACT: -0.15, // Rain drops forecast by 15%
      HIGH_WIND_IMPACT: -0.10,
      INVERSION_IMPACT: 0.15,
      CONGESTION_IMPACT: 0.10
    }
  }
};
