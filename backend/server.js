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
const simulationRoutes = 
  require("./routes/simulationRoutes");
const simulationPipeline = 
  require("./simulation/services/simulationPipeline");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();


// START AQI POLLING
startAQIPoller();

// START SIMULATION ENGINE PIPELINE
// Runs every 60 seconds (60000ms)
simulationPipeline.start(60000);

// ROUTES
app.use("/api/aqi", aqiRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/simulation", simulationRoutes);


app.get("/", (req, res) => {
  res.send("CO2 Digital Twin Backend Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});