module.exports = {
  // Industrial Source Templates
  TEMPLATES: {
    THERMAL_PLANT: {
      stackHeightMeters: 120,
      stackDiameterMeters: 5,
      exhaustTempCelsius: 150,
      baseEmissions: { pm25: 5.0, pm10: 8.0, so2: 12.0, no2: 6.0 } // Arbitrary units for simulation scale
    },
    CEMENT_FACTORY: {
      stackHeightMeters: 80,
      stackDiameterMeters: 3,
      exhaustTempCelsius: 110,
      baseEmissions: { pm25: 10.0, pm10: 15.0, so2: 3.0, no2: 2.0 }
    },
    CONSTRUCTION_SITE: {
      stackHeightMeters: 0, // Ground level
      stackDiameterMeters: 0,
      exhaustTempCelsius: 30, // Ambient
      baseEmissions: { pm25: 12.0, pm10: 25.0, so2: 0.1, no2: 1.0 } // Highly localized dust
    },
    TRAFFIC_HUB: { // e.g., bus depot
      stackHeightMeters: 2,
      stackDiameterMeters: 0.5,
      exhaustTempCelsius: 40,
      baseEmissions: { pm25: 2.0, pm10: 3.0, so2: 0.5, no2: 5.0 }
    }
  }
};
