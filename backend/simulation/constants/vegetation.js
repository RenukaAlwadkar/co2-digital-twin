module.exports = {
  // Dry Deposition Velocities (vd) in m/s
  DEPOSITION_VELOCITIES: {
    PM25: 0.001,
    PM10: 0.003, // Settles faster
    NO2: 0.0015,
    SO2: 0.001,
    CO: 0.0001 // Minimal uptake
  },

  // Vegetation Types & Leaf Area Index (LAI) modifiers
  TYPES: {
    DECIDUOUS_FOREST: { laiMultiplier: 1.2 }, // High leaf area, good sink
    CONIFEROUS_FOREST: { laiMultiplier: 1.5 }, // Pine needles trap PM very well
    URBAN_PARK: { laiMultiplier: 0.8 },
    GRASSLAND: { laiMultiplier: 0.3 }
  }
};
