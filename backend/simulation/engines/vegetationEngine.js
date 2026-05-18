const VEG_CONSTANTS = require('../constants/vegetation');

class VegetationEngine {
  /**
   * Applies dry deposition model: Fd = vd * C
   * Vegetation acts as a sink for pollutants, especially PM.
   * @param {Object} cell 
   */
  applyVegetationSink(cell) {
    const coverage = cell.greenCoverage; // 0-100%
    if (coverage === 0) return;

    // Fd = vd * C
    // Convert % coverage to an effective surface area fraction (mock calculation)
    const effectiveFraction = coverage / 100;
    
    // Simulate discrete time step reduction (C_new = C_old - Fd * delta_t / H)
    // Simplified: reduce concentration proportionally to coverage and deposition velocity
    const vd_pm25 = VEG_CONSTANTS.DEPOSITION_VELOCITIES.PM25;
    const vd_pm10 = VEG_CONSTANTS.DEPOSITION_VELOCITIES.PM10;

    // Reduction multipliers (e.g., higher coverage -> closer to 0 multiplier)
    // 1 - (vd * coverageFraction * time_scale_constant)
    const timeScale = 10; // arbitrary constant to make reduction noticeable per cycle
    
    const pm25Reduction = Math.max(0, 1 - (vd_pm25 * effectiveFraction * timeScale));
    const pm10Reduction = Math.max(0, 1 - (vd_pm10 * effectiveFraction * timeScale));
    
    // Vegetation primarily reduces PM, slight reduction for gases
    cell.pollutants.pm25 *= pm25Reduction;
    cell.pollutants.pm10 *= pm10Reduction;
    cell.pollutants.no2 *= Math.max(0, 1 - (vd_pm25 * 0.5 * effectiveFraction * timeScale)); // less effect on NO2
  }
}

module.exports = new VegetationEngine();
