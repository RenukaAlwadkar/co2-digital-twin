/**
 * Utility for standardizing pollutant units before AQI computation.
 */
class UnitConversion {
  /**
   * Convert ppm to µg/m³
   * @param {number} ppm 
   * @param {number} molecularWeight (g/mol)
   * @param {number} tempCelsius
   */
  ppmToMicrogramsPerCubicMeter(ppm, molecularWeight, tempCelsius = 25) {
    // Formula: µg/m³ = ppm * (molecularWeight / 24.45) * 1000
    // 24.45 is the volume of a mole of gas at 1 atm and 25C.
    const tempKelvin = tempCelsius + 273.15;
    const molarVolume = 22.41 * (tempKelvin / 273.15); 
    return (ppm * molecularWeight / molarVolume) * 1000;
  }

  /**
   * Standardize based on the pollutant type
   * CO needs to be mg/m³ for CPCB AQI.
   */
  standardize(pollutantType, value, fromUnit) {
    // Basic stub for the MVP: assuming DB values are mostly already correct,
    // but enforcing unit bounds if necessary.
    
    // If we had MQ sensor inputs in ppm:
    if (fromUnit === 'ppm') {
      const MW = {
        'CO': 28.01,
        'NO2': 46.005,
        'SO2': 64.066
      };
      
      const ugm3 = this.ppmToMicrogramsPerCubicMeter(value, MW[pollutantType]);
      
      if (pollutantType === 'CO') {
        return ugm3 / 1000; // Convert to mg/m³
      }
      return ugm3;
    }
    
    return value; // Assume it's already in the target unit (µg/m³ or mg/m³)
  }
}

module.exports = new UnitConversion();
