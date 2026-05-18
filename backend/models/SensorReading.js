const mongoose = require("mongoose");

const SensorReadingSchema = new mongoose.Schema({

  nodeId: { type: String, required: true },

  // Location from server-side registry (not hardcoded in frontend)
  city:  String,
  state: String,
  location: { lat: Number, lng: Number },

  // Raw sensor values from ESP32
  temperature: Number,
  humidity:    Number,
  mq135:       Number,
  mq7:         Number,
  light:       Number,
  pressure:    Number,

  // Calculated AQI (7-step backend engine)
  estAqi:            Number,
  dominantPollutant: String,
  estPollutants: {
    pm25: Number,
    pm10: Number,
    no2:  Number,
    co:   Number,
  },
  subIndices: {
    pm25: Number,
    pm10: Number,
    no2:  Number,
    co:   Number,
  },

  timestamp: { type: Date, required: true },

}, { timestamps: true });

module.exports = mongoose.model("SensorReading", SensorReadingSchema);