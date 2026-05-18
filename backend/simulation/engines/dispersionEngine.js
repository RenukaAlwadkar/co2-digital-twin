const DISPERSION_CONSTANTS = require('../constants/dispersion');

class DispersionEngine {
  /**
   * Applies hybrid neighbor-based diffusion and wind advection.
   * 
   * @param {Array<Object>} cells All city grid cells from StateManager
   * @param {Object} stateManager Reference to get neighbors
   */
  applyDispersion(cells, stateManager) {
    // We calculate deltas first to avoid order-dependence
    const deltas = new Map();
    cells.forEach(c => deltas.set(c.cellId, { pm25: 0, pm10: 0, co: 0, no2: 0, so2: 0 }));

    const degToRad = (deg) => deg * (Math.PI / 180);

    for (let source of cells) {
      if (!source.neighbors || source.neighbors.length === 0) continue;

      const { windSpeed, windDirection } = source.weather;
      
      // 1. Isotropic Diffusion (Pollution naturally spreads to neighbors)
      // Diffusion coefficient based on stability (mocked, higher wind = more diffusion)
      const diffusionRate = 0.05 + (windSpeed * 0.01); 
      
      // 2. Wind Advection (Directional spread)
      const rad = degToRad(windDirection);
      const dx = -Math.sin(rad); // East-West
      const dy = -Math.cos(rad); // North-South
      
      const totalNeighbors = source.neighbors.length;
      
      for (let neighborId of source.neighbors) {
        const target = stateManager.getCell(neighborId);
        if (!target) continue;
        
        let transferFraction = diffusionRate / totalNeighbors;

        // Add advection bonus if neighbor is downwind
        // Simplified dot product for direction matching
        // Grid assumes: North = -dy in array, East = +dx, etc.
        // For simplicity, we just use the diffusion base for MVP, and amplify downwind slightly.
        const dLat = target.lat - source.lat;
        const dLon = target.lon - source.lon;
        // Normalize vector
        const dist = Math.sqrt(dLat*dLat + dLon*dLon);
        if (dist > 0) {
          const nx = dLon / dist;
          const ny = dLat / dist;
          
          // Dot product: if wind is blowing towards this neighbor, it's positive
          const dot = (nx * dx) + (ny * dy);
          if (dot > 0) {
            // Amplified by wind speed
            transferFraction += (dot * windSpeed * 0.02);
          }
        }

        // Cap transfer fraction
        transferFraction = Math.min(0.2, transferFraction);

        const sourceDeltas = deltas.get(source.cellId);
        const targetDeltas = deltas.get(neighborId);

        for (const p of ['pm25', 'pm10', 'co', 'no2', 'so2']) {
          const amount = source.pollutants[p] * transferFraction;
          sourceDeltas[p] -= amount;
          targetDeltas[p] += amount;
        }
      }
    }

    // Apply all deltas
    for (let cell of cells) {
      const cellDeltas = deltas.get(cell.cellId);
      for (const p in cellDeltas) {
        cell.pollutants[p] = Math.max(0, cell.pollutants[p] + cellDeltas[p]);
      }
    }
  }
}

module.exports = new DispersionEngine();
