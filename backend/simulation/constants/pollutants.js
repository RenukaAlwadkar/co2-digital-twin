module.exports = {
  // Registry of supported pollutants and their metadata
  POLLUTANTS: {
    PM25: {
      symbol: 'PM2.5',
      unit: 'µg/m³',
      averagingPeriodHours: 24,
      aqiApplicable: true,
      description: 'Particulate matter < 2.5 microns'
    },
    PM10: {
      symbol: 'PM10',
      unit: 'µg/m³',
      averagingPeriodHours: 24,
      aqiApplicable: true,
      description: 'Particulate matter < 10 microns'
    },
    NO2: {
      symbol: 'NO2',
      unit: 'µg/m³',
      averagingPeriodHours: 24, // Note: EPA also uses 1h, but we'll standardize to 24h for simple CPCB logic
      aqiApplicable: true,
      description: 'Nitrogen Dioxide'
    },
    SO2: {
      symbol: 'SO2',
      unit: 'µg/m³',
      averagingPeriodHours: 24,
      aqiApplicable: true,
      description: 'Sulfur Dioxide'
    },
    CO: {
      symbol: 'CO',
      unit: 'mg/m³', // Important: CO is usually in mg, not µg
      averagingPeriodHours: 8,
      aqiApplicable: true,
      description: 'Carbon Monoxide'
    },
    O3: {
      symbol: 'O3',
      unit: 'µg/m³',
      averagingPeriodHours: 8,
      aqiApplicable: true,
      description: 'Ozone'
    }
  }
};
