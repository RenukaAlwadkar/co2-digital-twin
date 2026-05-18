const mongoose = require("mongoose");

const NodeSchema = new mongoose.Schema({

  nodeId: {
    type: String,
    required: true,
    unique: true
  },

  city: {
    type: String,
    required: true
  },

  location: {
    lat: Number,
    lon: Number
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }

}, { timestamps: true });

module.exports = mongoose.model("Node", NodeSchema);