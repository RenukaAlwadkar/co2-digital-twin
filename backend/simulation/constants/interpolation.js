module.exports = {
  // Inverse Distance Weighting parameters
  IDW: {
    POWER: 2, // Standard square decay
    MAX_RADIUS_DEG: 0.05, // Only consider points within roughly 5km
    BLENDING_ALPHA: 0.5 // 50% true local value, 50% smoothed field
  }
};
