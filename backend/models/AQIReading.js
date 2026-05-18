const mongoose = require("mongoose");

const AQIReadingSchema = new mongoose.Schema({

  city: {
    type: String,
    required: true
  },

  location: {
    lat: Number,
    lon: Number
  },

  aqi: {
    type: Number,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  pollutants: {

    pm25: Number,
    pm10: Number,

    no2: Number,
    so2: Number,

    co: Number,
    o3: Number
  },

  source: {
    type: String,
    default: "AQICN"
  },

  timestamp: {
    type: Date,
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model(
  "AQIReading",
  AQIReadingSchema
);