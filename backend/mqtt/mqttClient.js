const mqtt = require("mqtt");
const validatePayload  = require("../utils/validator");
const saveSensorReading = require("../services/sensorService");

const client = mqtt.connect(process.env.MQTT_BROKER);

client.on("connect", () => {
  console.log("MQTT Connected");
  client.subscribe(process.env.MQTT_TOPIC, (err) => {
    if (err) {
      console.error("Subscription Error:", err);
    } else {
      console.log("Subscribed:", process.env.MQTT_TOPIC);
    }
  });
});

client.on("message", async (topic, message) => {
  try {
    console.log("Topic:", topic);

    const raw = JSON.parse(message.toString());
    console.log("Raw Payload:", raw);

    // ── Normalize payload ────────────────────────────────────────────────────
    // Wokwi sends a FLAT payload: { temperature, humidity, mq135, mq7, ... }
    // nodeId is derived from the MQTT topic: city/pune/demo_node_001 → last segment
    // We normalize it into the expected shape: { nodeId, sensors: {...}, timestamp }
    let data;
    if (raw.sensors) {
      // Already in structured format — use as-is
      data = raw;
    } else {
      // Flat Wokwi format — normalize it
      const topicParts = topic.split("/");
      const nodeId = raw.nodeId || topicParts[topicParts.length - 1];

      data = {
        nodeId,
        sensors: {
          temperature: raw.temperature,
          humidity:    raw.humidity,
          pressure:    raw.pressure,
          mq135:       raw.mq135,
          mq7:         raw.mq7,
          light:       raw.light,
        },
        timestamp: new Date(), // Always use server time — Wokwi firmware may send hardcoded timestamps
      };
    }

    console.log("Normalized:", JSON.stringify(data));

    const validationError = validatePayload(data);
    if (validationError) {
      console.error("Validation Error:", validationError);
      return;
    }

    await saveSensorReading(data);

  } catch (error) {
    console.error("MQTT Processing Error:", error.message);
  }
});

module.exports = client;