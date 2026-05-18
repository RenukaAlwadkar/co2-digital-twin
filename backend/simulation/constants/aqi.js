module.exports = {
  // CPCB AQI Breakpoints
  BREAKPOINTS: {
    PM25: [
      { bpLow: 0, bpHigh: 30, iLow: 0, iHigh: 50, category: 'Good' },
      { bpLow: 31, bpHigh: 60, iLow: 51, iHigh: 100, category: 'Satisfactory' },
      { bpLow: 61, bpHigh: 90, iLow: 101, iHigh: 200, category: 'Moderate' },
      { bpLow: 91, bpHigh: 120, iLow: 201, iHigh: 300, category: 'Poor' },
      { bpLow: 121, bpHigh: 250, iLow: 301, iHigh: 400, category: 'Very Poor' },
      { bpLow: 251, bpHigh: 1000, iLow: 401, iHigh: 500, category: 'Severe' }
    ],
    PM10: [
      { bpLow: 0, bpHigh: 50, iLow: 0, iHigh: 50, category: 'Good' },
      { bpLow: 51, bpHigh: 100, iLow: 51, iHigh: 100, category: 'Satisfactory' },
      { bpLow: 101, bpHigh: 250, iLow: 101, iHigh: 200, category: 'Moderate' },
      { bpLow: 251, bpHigh: 350, iLow: 201, iHigh: 300, category: 'Poor' },
      { bpLow: 351, bpHigh: 430, iLow: 301, iHigh: 400, category: 'Very Poor' },
      { bpLow: 431, bpHigh: 1000, iLow: 401, iHigh: 500, category: 'Severe' }
    ],
    NO2: [
      { bpLow: 0, bpHigh: 40, iLow: 0, iHigh: 50 },
      { bpLow: 41, bpHigh: 80, iLow: 51, iHigh: 100 },
      { bpLow: 81, bpHigh: 180, iLow: 101, iHigh: 200 },
      { bpLow: 181, bpHigh: 280, iLow: 201, iHigh: 300 },
      { bpLow: 281, bpHigh: 400, iLow: 301, iHigh: 400 },
      { bpLow: 401, bpHigh: 1000, iLow: 401, iHigh: 500 }
    ],
    SO2: [
        { bpLow: 0, bpHigh: 40, iLow: 0, iHigh: 50 },
        { bpLow: 41, bpHigh: 80, iLow: 51, iHigh: 100 },
        { bpLow: 81, bpHigh: 380, iLow: 101, iHigh: 200 },
        { bpLow: 381, bpHigh: 800, iLow: 201, iHigh: 300 },
        { bpLow: 801, bpHigh: 1600, iLow: 301, iHigh: 400 },
        { bpLow: 1601, bpHigh: 3000, iLow: 401, iHigh: 500 }
    ],
    CO: [
        { bpLow: 0, bpHigh: 1.0, iLow: 0, iHigh: 50 }, // mg/m3
        { bpLow: 1.1, bpHigh: 2.0, iLow: 51, iHigh: 100 },
        { bpLow: 2.1, bpHigh: 10, iLow: 101, iHigh: 200 },
        { bpLow: 10.1, bpHigh: 17, iLow: 201, iHigh: 300 },
        { bpLow: 17.1, bpHigh: 34, iLow: 301, iHigh: 400 },
        { bpLow: 34.1, bpHigh: 100, iLow: 401, iHigh: 500 }
    ]
  },

  CATEGORIES: {
    GOOD: { min: 0, max: 50, color: '#00B050' },
    SATISFACTORY: { min: 51, max: 100, color: '#92D050' },
    MODERATE: { min: 101, max: 200, color: '#FFFF00' },
    POOR: { min: 201, max: 300, color: '#FF9900' },
    VERY_POOR: { min: 301, max: 400, color: '#FF0000' },
    SEVERE: { min: 401, max: 500, color: '#C00000' }
  }
};
