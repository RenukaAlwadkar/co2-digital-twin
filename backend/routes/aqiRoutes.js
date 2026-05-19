const express = require("express");
const axios = require("axios");
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

// GET AQI forecast for all cities using the Python ML Microservice
router.get("/forecast-all", async (req, res) => {
  try {
    // 1. Get all unique cities
    const uniqueCities = await AQIReading.distinct("city");

    const fastApiUrl = process.env.ML_API_URL || "http://127.0.0.1:8000";
    const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;
    const forecasts = {};

    if (!OWM_API_KEY) {
      return res.status(500).json({ error: "OpenWeatherMap API key is missing." });
    }

    const end = Math.floor(Date.now() / 1000);
    const start = end - 24 * 60 * 60; // 24 hours ago

    // 2. Fetch forecast for each city (in parallel for speed)
    await Promise.all(uniqueCities.map(async (cityName) => {
      try {
        const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${OWM_API_KEY}`;
        const geoResponse = await axios.get(geoUrl);
        
        if (geoResponse.data && geoResponse.data.length > 0) {
          const { lat, lon } = geoResponse.data[0];
          
          const historyUrl = `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${OWM_API_KEY}`;
          const historyResponse = await axios.get(historyUrl);
          const owmData = historyResponse.data.list;

          if (owmData && owmData.length >= 24) {
            const last24 = owmData.slice(-24);
            const features = last24.map(d => {
              const comp = d.components;
              return {
                pm25: comp.pm2_5 || 0,
                pm10: comp.pm10 || 0,
                no: comp.no || 0,
                no2: comp.no2 || 0,
                nox: (comp.no || 0) + (comp.no2 || 0),
                nh3: comp.nh3 || 0,
                co: comp.co || 0,
                so2: comp.so2 || 0,
                o3: comp.o3 || 0
              };
            });
            const response = await axios.post(`${fastApiUrl}/api/predict`, { features });
            forecasts[cityName] = response.data.forecasted_aqi;
          }
        }
      } catch (err) {
        console.error(`Failed to forecast for ${cityName}:`, err.message);
      }
    }));

    res.json(forecasts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET AQI forecast for a specific city using the Python ML Microservice
router.get("/forecast/:city", async (req, res) => {
  try {
    const cityName = req.params.city;
    const OWM_API_KEY = process.env.OPENWEATHER_API_KEY;

    if (!OWM_API_KEY) {
      return res.status(500).json({ error: "OpenWeatherMap API key is missing." });
    }

    // 1. Get coordinates for the city
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${OWM_API_KEY}`;
    const geoResponse = await axios.get(geoUrl);
    
    if (!geoResponse.data || geoResponse.data.length === 0) {
      return res.status(404).json({ error: `Could not find coordinates for city: ${cityName}` });
    }

    const { lat, lon } = geoResponse.data[0];

    // 2. Fetch history for the last 24 hours
    const end = Math.floor(Date.now() / 1000);
    const start = end - 24 * 60 * 60; // 24 hours ago

    const historyUrl = `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${OWM_API_KEY}`;
    const historyResponse = await axios.get(historyUrl);
    
    const owmData = historyResponse.data.list;

    if (!owmData || owmData.length < 24) {
      return res.status(400).json({
        error: `Not enough historical data from OpenWeatherMap. Need 24 hours, but got ${owmData ? owmData.length : 0} for ${cityName}.`
      });
    }

    // Use exactly the last 24 records
    const last24 = owmData.slice(-24);

    // 3. Map into features for ML Model
    const features = last24.map(d => {
      const comp = d.components;
      return {
        pm25: comp.pm2_5 || 0,
        pm10: comp.pm10 || 0,
        no: comp.no || 0,
        no2: comp.no2 || 0,
        nox: (comp.no || 0) + (comp.no2 || 0), // Use no + no2 for nox
        nh3: comp.nh3 || 0,
        co: comp.co || 0,
        so2: comp.so2 || 0,
        o3: comp.o3 || 0
      };
    });

    // 4. Send the data to our FastAPI microservice
    const fastApiUrl = process.env.ML_API_URL || "http://127.0.0.1:8000";
    const response = await axios.post(`${fastApiUrl}/api/predict`, {
      features: features
    });

    // Send the forecast back to the frontend
    res.json({
      city: cityName,
      forecasted_aqi: response.data.forecasted_aqi,
      based_on_hours: features.length
    });

  } catch (error) {
    console.error("Forecast Error:", error.message);
    if (error.response) {
      // The request was made and the ML server responded with a status code outside 2xx
      return res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received (ML server might be down)
      return res.status(503).json({ error: "ML Forecasting Microservice is unreachable." });
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;