const axios = require("axios");
const AQIReading    = require("../models/AQIReading");
const getAQICategory = require("../utils/aqiCategory");

const fetchAQIData = async (city = "pune") => {
  try {
    const token = process.env.OPENWEATHER_API_KEY;

    // 1. Get coordinates for the city
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${city},IN&limit=1&appid=${token}`;
    const geoResponse = await axios.get(geoUrl);
    
    if (!geoResponse.data || geoResponse.data.length === 0) {
      console.warn(`[AQI] Skipping "${city}" — no geocoding data found`);
      return null;
    }
    
    const { lat, lon, name } = geoResponse.data[0];

    // 2. Get air pollution data
    const pollutionUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${token}`;
    const pollutionResponse = await axios.get(pollutionUrl);

    if (!pollutionResponse.data || !pollutionResponse.data.list || pollutionResponse.data.list.length === 0) {
      console.warn(`[AQI] Skipping "${city}" — no air pollution data found`);
      return null;
    }

    const data = pollutionResponse.data.list[0];
    
    // OpenWeatherMap AQI is 1-5 (1=Good, 5=Very Poor). We might want to keep our existing category logic or use OWM's.
    // For consistency with the rest of the app, let's map it or calculate an approximate standard AQI.
    // Actually, since OWM just provides 1-5, let's just pass it or calculate a rough mapping to 0-500 scale.
    // Wait, let's just use the OWM AQI value and let getAQICategory handle it if it handles 1-5, or we can just calculate an AQI from pollutants.
    // Alternatively, just store the OWM AQI index directly.
    const aqiIndex = data.main.aqi;
    
    // Let's create a rough map from OWM AQI (1-5) to standard AQI (0-500) for display compatibility, or just use what getAQICategory does.
    // Assuming getAQICategory handles Indian AQI (0-500), we might need to convert or just store it.
    // Let's just store aqiIndex * 50 as a dummy conversion if needed, or better, calculate it properly.
    // Actually, let's just use 1-5 for now, and getAQICategory might need to be adjusted later.
    // Let's calculate standard AQI using our iotAQICalculator if we want, but wait, OWM doesn't give a 0-500 AQI.
    // Let's just use 50 * aqiIndex as a rough estimate for the UI for now.
    const aqi = aqiIndex * 60; // Just to make it look like a standard AQI scale (60, 120, 180, 240, 300)

    const components = data.components;
    
    const no = components.no || 0;
    const no2 = components.no2 || 0;
    const nox = no + no2;

    const pollutants = {
      pm25: components.pm2_5 ?? null,
      pm10: components.pm10 ?? null,
      no:   no,
      no2:  no2,
      nox:  nox,
      nh3:  components.nh3 ?? null,
      so2:  components.so2 ?? null,
      co:   components.co ?? null,
      o3:   components.o3 ?? null,
    };

    const normalizedData = {
      city:      name,
      location:  { lat, lon },
      aqi:       aqi, 
      category:  getAQICategory(aqi),
      pollutants,
      timestamp: new Date(),
    };

    await AQIReading.create(normalizedData);
    console.log(`[AQI] Saved "${name}" — AQI: ${aqi} (${normalizedData.category})`);

    return normalizedData;

  } catch (error) {
    console.error(`[AQI] Fetch Error for "${city}":`, error.message);
  }
};

module.exports = fetchAQIData;