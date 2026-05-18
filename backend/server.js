require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

require("./mqtt/mqttClient");

const startAQIPoller =
  require("./services/aqiPoller");

const aqiRoutes =
  require("./routes/aqiRoutes");
const sensorRoutes = 
  require("./routes/sensorRoutes");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();


// START AQI POLLING
startAQIPoller();


// ROUTES
app.use("/api/aqi", aqiRoutes);
app.use("/api/sensors", sensorRoutes);


app.get("/", (req, res) => {
  res.send("CO2 Digital Twin Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});