const mongoose = require('mongoose');

const simulationHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  cycleId: { type: String, required: true },
  
  // Array of simplified cell states to avoid massive document sizes, 
  // or store aggregated city-wide metrics if tracking per cell is too heavy.
  // We'll store per-cell data for heatmaps.
  cells: [{
    cellId: String,
    aqi: Number,
    pm25: Number,
    pm10: Number,
    temperature: Number,
    windSpeed: Number
  }],

  // City-wide averages
  averageAqi: { type: Number, default: 0 },
  averagePm25: { type: Number, default: 0 },
  
  notes: { type: String, default: 'Regular cycle' }
});

module.exports = mongoose.model('SimulationHistory', simulationHistorySchema);
