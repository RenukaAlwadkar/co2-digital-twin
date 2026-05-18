module.exports = {
  // COPERT Generic Baselines (g/km) per vehicle type
  EMISSION_FACTORS: {
    CAR_PETROL: { pm25: 0.003, pm10: 0.005, co: 1.2, no2: 0.04 },
    CAR_DIESEL: { pm25: 0.03,  pm10: 0.04,  co: 0.1, no2: 0.3  },
    HGV_DIESEL: { pm25: 0.15,  pm10: 0.20,  co: 0.5, no2: 2.0  }, // Trucks/Buses
    MOTORCYCLE: { pm25: 0.02,  pm10: 0.03,  co: 2.5, no2: 0.03 }
  },

  // Typical fleet composition in Indian cities (mock)
  FLEET_COMPOSITION: {
    CAR_PETROL: 0.30,
    CAR_DIESEL: 0.15,
    HGV_DIESEL: 0.05, // Heavy Goods Vehicles / Buses
    MOTORCYCLE: 0.50
  },

  // Speed-dependent emission curves (Emissions = base * multiplier)
  // Low speed (congestion) spikes emissions significantly.
  SPEED_MULTIPLIERS: {
    CONGESTION: { maxSpeedKmph: 15, multiplier: 2.5 },
    URBAN_SLOW: { maxSpeedKmph: 30, multiplier: 1.5 },
    URBAN_FLOW: { maxSpeedKmph: 50, multiplier: 1.0 },
    HIGHWAY:    { maxSpeedKmph: 80, multiplier: 0.8 }
  }
};
