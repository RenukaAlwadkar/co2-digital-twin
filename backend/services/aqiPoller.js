const fetchAQIData = require("./aqiService");

// All Indian state capitals + major UTs
const INDIAN_CAPITALS = [
  "Delhi",
  "Mumbai",
  "Kolkata",
  "Chennai",
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Bhopal",
  "Bhubaneswar",
  "Patna",
  "Raipur",
  "Dehradun",
  "Ranchi",
  "Chandigarh",
  "Shimla",
  "Srinagar",
  "Jammu",
  "Guwahati",
  "Imphal",
  "Shillong",
  "Agartala",
  "Aizawl",
  "Kohima",
  "Itanagar",
  "Gangtok",
  "Panaji",
  "Thiruvananthapuram",
  "Amaravati"
];

const startAQIPoller = () => {
  const pollAll = () => {
    INDIAN_CAPITALS.forEach((city, index) => {
      // Stagger requests 2 seconds apart to avoid rate limiting
      setTimeout(() => {
        fetchAQIData(city);
      }, index * 2000);
    });
  };

  // Fetch immediately on start
  pollAll();

  // Re-fetch every 10 minutes
  setInterval(pollAll, 10 * 60 * 1000);
};

module.exports = startAQIPoller;