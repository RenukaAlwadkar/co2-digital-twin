module.exports = {
  // Rain Scavenging Coefficients (Λ) - higher means rain washes it out faster
  SCAVENGING_COEFFICIENTS: {
    PM25: 0.0003,
    PM10: 0.0005, // Larger particles wash out slightly faster
    NO2: 0.0001,
    SO2: 0.0002,
    CO: 0.0000 // Insoluble, minimal washout
  },

  // Atmospheric thresholds
  INVERSION_TEMP_THRESHOLD_CELSIUS: 15,
  INVERSION_TRAP_MULTIPLIER: 1.25, // Pollution accumulates 25% faster during strong inversion
  
  HUMIDITY_PM_GROWTH_THRESHOLD: 70, // %
  HUMIDITY_GROWTH_MAX_MULTIPLIER: 1.15,

  // Boundary Layer Height defaults (meters)
  MIXING_HEIGHT_DAY: 1500,
  MIXING_HEIGHT_NIGHT: 300 // Much lower at night, trapping pollution
};
