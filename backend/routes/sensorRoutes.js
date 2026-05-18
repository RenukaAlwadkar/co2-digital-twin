const express    = require("express");
const router     = express.Router();
const SensorReading    = require("../models/SensorReading");
const calculateIoTAQI  = require("../utils/iotAQICalculator");
const NODE_REGISTRY    = require("../config/nodeRegistry");
const getAQICategory   = require("../utils/aqiCategory");

// GET latest reading per node — enriched with AQI
router.get("/latest", async (req, res) => {
  try {
    const latestReadings = await SensorReading.aggregate([
      { $sort: { createdAt: -1 } },  // Sort by MongoDB insert time, not Wokwi's timestamp
      {
        $group: {
          _id:               "$nodeId",
          nodeId:            { $first: "$nodeId"            },
          city:              { $first: "$city"              },
          state:             { $first: "$state"             },
          location:          { $first: "$location"          },
          temperature:       { $first: "$temperature"       },
          humidity:          { $first: "$humidity"          },
          mq135:             { $first: "$mq135"             },
          mq7:               { $first: "$mq7"               },
          light:             { $first: "$light"             },
          pressure:          { $first: "$pressure"          },
          estAqi:            { $first: "$estAqi"            },
          dominantPollutant: { $first: "$dominantPollutant" },
          estPollutants:     { $first: "$estPollutants"     },
          subIndices:        { $first: "$subIndices"        },
          timestamp:         { $first: "$timestamp"         },
        }
      }
    ]);

    // Fallback: for readings saved before the AQI calculator existed,
    // compute estAqi + enrich location on-the-fly from the backend engine
    const enriched = latestReadings.map(reading => {
      // Patch missing location/city from node registry
      if (!reading.city || !reading.location?.lat) {
        const reg = NODE_REGISTRY[reading.nodeId];
        if (reg) {
          reading.city     = reg.city;
          reading.state    = reg.state;
          reading.location = { lat: reg.lat, lng: reg.lng };
        }
      }

      // Patch missing estAqi using calculator
      if (reading.estAqi == null) {
        const result = calculateIoTAQI({
          mq135:       reading.mq135,
          mq7:         reading.mq7,
          temperature: reading.temperature,
          humidity:    reading.humidity,
          pressure:    reading.pressure,
        });
        reading.estAqi            = result.estAqi;
        reading.dominantPollutant = result.dominantPollutant;
        reading.estPollutants     = result.estPollutants;
        reading.subIndices        = result.subIndices;
      }

      // Always attach category
      reading.category = getAQICategory(reading.estAqi);

      return reading;
    });

    res.json(enriched);
  } catch (error) {
    console.error("Error fetching latest sensor readings:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

// GET historical readings (last 30) for charts
router.get("/history", async (req, res) => {
  try {
    const readings = await SensorReading.find()
      .sort({ createdAt: -1 })
      .limit(100); // Grab a good buffer

    // Enrich missing properties on older records just like /latest
    const enriched = readings.map(reading => {
      let r = reading.toObject();
      if (!r.city || !r.location?.lat) {
        const reg = NODE_REGISTRY[r.nodeId];
        if (reg) {
          r.city     = reg.city;
          r.state    = reg.state;
          r.location = { lat: reg.lat, lng: reg.lng };
        }
      }
      if (r.estAqi == null) {
        const result = calculateIoTAQI({
          mq135:       r.mq135,
          mq7:         r.mq7,
          temperature: r.temperature,
          humidity:    r.humidity,
          pressure:    r.pressure,
        });
        r.estAqi            = result.estAqi;
        r.dominantPollutant = result.dominantPollutant;
        r.estPollutants     = result.estPollutants;
        r.subIndices        = result.subIndices;
      }
      r.category = getAQICategory(r.estAqi);
      return r;
    });

    // Return in chronological order
    res.json(enriched.reverse());
  } catch (error) {
    console.error("Error fetching historical sensors:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
