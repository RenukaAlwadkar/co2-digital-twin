const axios = require("axios");
const AQIReading    = require("../models/AQIReading");
const getAQICategory = require("../utils/aqiCategory");

const fetchAQIData = async (city = "pune") => {
  try {
    const token = process.env.AQICN_API_KEY;
    const url   = `https://api.waqi.info/feed/${city}/?token=${token}`;

    const response = await axios.get(url);

    if (response.data.status !== "ok") {
      throw new Error(`AQICN status not ok for "${city}"`);
    }

    const data = response.data.data;

    // AQICN returns "-" when the station has no live reading — skip those
    const aqi = parseInt(data.aqi, 10);
    if (isNaN(aqi)) {
      console.warn(`[AQI] Skipping "${city}" — no live reading (aqi="${data.aqi}")`);
      return null;
    }

    const pollutants = {
      pm25: data.iaqi.pm25?.v ?? null,
      pm10: data.iaqi.pm10?.v ?? null,
      no2:  data.iaqi.no2?.v  ?? null,
      so2:  data.iaqi.so2?.v  ?? null,
      co:   data.iaqi.co?.v   ?? null,
      o3:   data.iaqi.o3?.v   ?? null,
    };

    const normalizedData = {
      city:      data.city.name,
      location:  { lat: data.city.geo[0], lon: data.city.geo[1] },
      aqi,
      category:  getAQICategory(aqi),
      pollutants,
      timestamp: new Date(),
    };

    await AQIReading.create(normalizedData);
    console.log(`[AQI] Saved "${data.city.name}" — AQI: ${aqi} (${normalizedData.category})`);

    return normalizedData;

  } catch (error) {
    console.error(`[AQI] Fetch Error for "${city}":`, error.message);
  }
};

module.exports = fetchAQIData;