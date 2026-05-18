const SensorReading    = require("../models/SensorReading");
const calculateIoTAQI  = require("../utils/iotAQICalculator");
const NODE_REGISTRY    = require("../config/nodeRegistry");
const getAQICategory   = require("../utils/aqiCategory");

const saveSensorReading = async (data) => {

  // ── 1. Look up node location from server-side registry ─────────────────────
  const nodeInfo = NODE_REGISTRY[data.nodeId] || {};

  // ── 2. Run 7-step AQI calculation ─────────────────────────────────────────
  const aqiResult = calculateIoTAQI({
    mq135:       data.sensors.mq135,
    mq7:         data.sensors.mq7,
    temperature: data.sensors.temperature,
    humidity:    data.sensors.humidity,
    pressure:    data.sensors.pressure,
  });

  // ── 3. Build enriched document and save ────────────────────────────────────
  const reading = new SensorReading({
    nodeId:   data.nodeId,
    city:     nodeInfo.city  || 'Unknown',
    state:    nodeInfo.state || 'Unknown',
    location: { lat: nodeInfo.lat, lng: nodeInfo.lng },

    // Raw readings
    temperature: data.sensors.temperature,
    humidity:    data.sensors.humidity,
    mq135:       data.sensors.mq135,
    mq7:         data.sensors.mq7,
    light:       data.sensors.light,
    pressure:    data.sensors.pressure,

    // Calculated AQI fields
    estAqi:            aqiResult.estAqi,
    dominantPollutant: aqiResult.dominantPollutant,
    estPollutants:     aqiResult.estPollutants,
    subIndices:        aqiResult.subIndices,

    timestamp: data.timestamp,
  });

  await reading.save();

  console.log(
    `[Sensor] ${data.nodeId} (${nodeInfo.city || '?'}) — Est. AQI: ${aqiResult.estAqi} (${getAQICategory(aqiResult.estAqi)}) | Dominant: ${aqiResult.dominantPollutant}`
  );
};

module.exports = saveSensorReading;