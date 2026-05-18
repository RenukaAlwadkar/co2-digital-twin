const mongoose = require('mongoose');

const cityCellSchema = new mongoose.Schema({
  cellId: {
    type: String,
    required: true,
    unique: true
  },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  
  // Computed output
  aqi: { type: Number, default: 0 },
  category: { type: String, default: 'Good' },
  dominantPollutant: { type: String, default: 'None' },

  // Current pollutant concentrations (µg/m³)
  pollutants: {
    pm25: { type: Number, default: 0 },
    pm10: { type: Number, default: 0 },
    co: { type: Number, default: 0 }, // in mg/m³ for standard AQI, but we'll stick to a common unit or convert
    no2: { type: Number, default: 0 },
    so2: { type: Number, default: 0 },
  },

  // Environmental and source factors
  trafficDensity: { type: Number, default: 0 }, // Scale 0-100
  industrialIntensity: { type: Number, default: 0 }, // Scale 0-100
  greenCoverage: { type: Number, default: 0 }, // Percentage 0-100
  
  // Weather conditions
  weather: {
    temperature: { type: Number, default: 25 }, // Celsius
    humidity: { type: Number, default: 50 }, // Percentage
    windSpeed: { type: Number, default: 5 }, // m/s
    windDirection: { type: Number, default: 0 }, // Degrees (0-360)
    rainfall: { type: Number, default: 0 }, // mm/h
  },

  // Optional forecast fields
  forecast: {
    '1h': { type: Number, default: 0 },
    '6h': { type: Number, default: 0 },
    '24h': { type: Number, default: 0 },
  },

  lastUpdated: { type: Date, default: Date.now }
});

// Update the lastUpdated field on save
cityCellSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('CityCell', cityCellSchema);
