class InterpolationEngine {
  /**
   * Applies Inverse Distance Weighting (IDW) to smooth the pollution field.
   * C(x0) = Sum(wi * Ci) / Sum(wi)
   * wi = 1 / di^p
   * @param {Array<Object>} cells 
   */
  applyIDW(cells) {
    const power = 2; // IDW power parameter
    
    // Create a snapshot of current concentrations to prevent cascading updates during loop
    const snapshot = cells.map(c => ({
      id: c.cellId,
      lat: c.lat,
      lon: c.lon,
      pollutants: { ...c.pollutants }
    }));

    for (let i = 0; i < cells.length; i++) {
      const target = cells[i];
      let sumWeights = 0;
      
      const weightedSums = { pm25: 0, pm10: 0, co: 0, no2: 0, so2: 0 };
      
      for (let j = 0; j < snapshot.length; j++) {
        const source = snapshot[j];
        
        // Calculate distance (simple Euclidean for local grid)
        const d = Math.sqrt(
          Math.pow(target.lat - source.lat, 2) + 
          Math.pow(target.lon - source.lon, 2)
        );

        if (d === 0) {
          // Self node, high weight or handle separately (we usually don't self-weight in standard IDW, 
          // but we can just skip or add a small epsilon to avoid divide by zero).
          // If d=0, we can just use the exact value, but since we are smoothing the entire grid:
          const weight = 1 / Math.pow(0.0001, power);
          sumWeights += weight;
          for (const p in weightedSums) weightedSums[p] += source.pollutants[p] * weight;
        } else if (d < 0.005) { // Only consider nearby cells (e.g. ~500m radius)
          const weight = 1 / Math.pow(d, power);
          sumWeights += weight;
          for (const p in weightedSums) {
            weightedSums[p] += source.pollutants[p] * weight;
          }
        }
      }

      // Apply smoothed values
      if (sumWeights > 0) {
        // Blend original with smoothed (e.g., 50% original, 50% smoothed) to preserve local peaks
        const alpha = 0.5;
        for (const p in target.pollutants) {
          const smoothedValue = weightedSums[p] / sumWeights;
          target.pollutants[p] = (alpha * target.pollutants[p]) + ((1 - alpha) * smoothedValue);
        }
      }
    }
  }
}

module.exports = new InterpolationEngine();
