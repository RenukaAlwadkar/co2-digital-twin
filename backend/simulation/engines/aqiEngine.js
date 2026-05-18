const AQI_CONSTANTS = require('../constants/aqi');

class AqiEngine {
  /**
   * Calculates sub-index for a specific pollutant.
   * I = ((Ihi - Ilo) / (BPhi - BPlo)) * (C - BPlo) + Ilo
   */
  _calculateSubIndex(concentration, breakpoints) {
    for (let bp of breakpoints) {
      if (concentration >= bp.bpLow && concentration <= bp.bpHigh) {
        return Math.round(
          ((bp.iHigh - bp.iLow) / (bp.bpHigh - bp.bpLow)) * (concentration - bp.bpLow) + bp.iLow
        );
      }
    }
    // If exceeds highest breakpoint, extrapolate from the highest bucket
    const highestBp = breakpoints[breakpoints.length - 1];
    if (concentration > highestBp.bpHigh) {
      return Math.round(
        ((highestBp.iHigh - highestBp.iLow) / (highestBp.bpHigh - highestBp.bpLow)) * (concentration - highestBp.bpLow) + highestBp.iLow
      );
    }
    return 0; // Default or error
  }

  /**
   * Computes overall AQI and category for a cell.
   * AQI = MAX(subindices)
   * @param {Object} cell 
   */
  computeAQI(cell) {
    const { pm25, pm10, no2, so2, co } = cell.pollutants;
    
    const subIndices = {
      PM25: this._calculateSubIndex(pm25, AQI_CONSTANTS.BREAKPOINTS.PM25),
      PM10: this._calculateSubIndex(pm10, AQI_CONSTANTS.BREAKPOINTS.PM10),
      NO2: this._calculateSubIndex(no2, AQI_CONSTANTS.BREAKPOINTS.NO2),
      SO2: this._calculateSubIndex(so2, AQI_CONSTANTS.BREAKPOINTS.SO2),
      CO: this._calculateSubIndex(co, AQI_CONSTANTS.BREAKPOINTS.CO),
    };

    let maxAqi = -1;
    let dominant = 'None';

    for (const [pollutant, indexVal] of Object.entries(subIndices)) {
      if (indexVal > maxAqi) {
        maxAqi = indexVal;
        dominant = pollutant;
      }
    }

    cell.aqi = maxAqi;
    cell.dominantPollutant = dominant;
    cell.category = this._determineCategory(maxAqi);
  }

  _determineCategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  }
}

module.exports = new AqiEngine();
