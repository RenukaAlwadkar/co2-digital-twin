const CityCell = require('../simulation/models/CityCell');
const simulationPipeline = require('../simulation/services/simulationPipeline');
const stateManager = require('../simulation/services/stateManager');

// Ensure grid exists
exports.initializeGrid = async (req, res) => {
  try {
    const count = await CityCell.countDocuments();
    if (count > 0) {
      return res.status(200).json({ message: 'Grid already initialized.', count });
    }

    // Create a mock 10x10 grid centered around Pune (18.48 to 18.63 lat, 73.74 to 73.95 lon)
    // 10 cells in lat, 10 cells in lon
    const latStart = 18.48;
    const latEnd = 18.63;
    const lonStart = 73.74;
    const lonEnd = 73.95;
    const latStep = (latEnd - latStart) / 10;
    const lonStep = (lonEnd - lonStart) / 10;

    const newCells = [];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        // Center-ish is i=4,5 j=4,5
        const isCenter = (i >= 4 && i <= 5 && j >= 4 && j <= 5);
        
        newCells.push({
          cellId: `CELL_${i}_${j}`,
          lat: latStart + (i * latStep),
          lon: lonStart + (j * lonStep),
          
          pollutants: { pm25: 45, pm10: 80, co: 1.5, no2: 30, so2: 15 },
          
          trafficDensity: isCenter ? 85 : Math.floor(Math.random() * 40),
          industrialIntensity: isCenter ? 60 : Math.floor(Math.random() * 20),
          greenCoverage: isCenter ? 10 : 40 + Math.floor(Math.random() * 30),
          
          weather: {
            temperature: 30,
            humidity: 50,
            windSpeed: 5,
            windDirection: 135, // SE wind
            rainfall: 0
          }
        });
      }
    }

    await CityCell.insertMany(newCells);
    
    // Reload state manager if running
    await stateManager.loadGrid();
    
    res.status(201).json({ message: '10x10 Grid initialized successfully', count: newCells.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch current state
exports.getGridState = async (req, res) => {
  try {
    const cells = stateManager.getAllCells();
    res.status(200).json(cells);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Manually trigger a fast cycle (useful for What-If)
exports.triggerCycle = async (req, res) => {
  try {
    simulationPipeline.runFastTick();
    const cells = stateManager.getAllCells();
    res.status(200).json({ message: 'Fast cycle executed.', cells });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update specific cell parameters (What-If API)
exports.updateCellParameters = async (req, res) => {
  try {
    const { cellId } = req.params;
    const updateData = req.body;
    
    // Enqueue an event for the state manager to handle
    stateManager.enqueueEvent('CELL_UPDATE', {
      cellId,
      updates: updateData
    });
    
    res.status(200).json({ message: 'Update queued for cell', cellId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reset simulation — drop grid and re-initialize with fresh baseline values
exports.resetGrid = async (req, res) => {
  try {
    const CityCell = require('../simulation/models/CityCell');
    await CityCell.deleteMany({});
    // Reload (will trigger a new init on next /init call)
    res.status(200).json({ message: 'Grid reset. Call /init to reinitialize.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
