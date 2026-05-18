const express = require("express");
const AQIReading = require("../models/AQIReading");
const router = express.Router();

// GET latest single reading (most recent overall)
router.get("/latest", async (req, res) => {
  try {
    const latestAQI = await AQIReading.findOne().sort({ createdAt: -1 });
    res.json(latestAQI);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET latest reading per city (one per city, most recent)
router.get("/all", async (req, res) => {
  try {
    const readings = await AQIReading.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$city",
          city: { $first: "$city" },
          aqi: { $first: "$aqi" },
          category: { $first: "$category" },
          location: { $first: "$location" },
          pollutants: { $first: "$pollutants" },
          timestamp: { $first: "$timestamp" }
        }
      }
    ]);
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET latest reading for a specific city
router.get("/city/:city", async (req, res) => {
  try {
    const cityName = req.params.city;
    const reading = await AQIReading.findOne({
      city: { $regex: cityName, $options: "i" }
    }).sort({ createdAt: -1 });

    if (!reading) {
      return res.status(404).json({ error: "No data for this city" });
    }
    res.json(reading);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET historical readings (last 100) for charts
router.get("/history", async (req, res) => {
  try {
    const readings = await AQIReading.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(readings.reverse()); // Chronological
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;