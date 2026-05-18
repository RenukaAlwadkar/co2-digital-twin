module.exports = {
  // Statistical anomaly bounds for raw sensor inputs
  THRESHOLDS: {
    PM25: { min: 0, max: 2000, maxJumpPerHour: 300 }, // Over 2000 is likely hardware error
    PM10: { min: 0, max: 2500, maxJumpPerHour: 400 },
    NO2: { min: 0, max: 1500, maxJumpPerHour: 200 },
    SO2: { min: 0, max: 1500, maxJumpPerHour: 200 },
    CO: { min: 0, max: 200, maxJumpPerHour: 50 },
    TEMPERATURE: { min: -10, max: 60, maxJumpPerHour: 15 }
  }
};
