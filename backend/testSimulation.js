require('dotenv').config();
const mongoose = require('mongoose');

// Mock a DB connection for the test
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/co2-twin';

const CityCell = require('./simulation/models/CityCell');
const stateManager = require('./simulation/services/stateManager');
const simulationPipeline = require('./simulation/services/simulationPipeline');
const simulationController = require('./controllers/simulationController');

async function runTest() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Initialize the grid
    console.log('\n--- Initializing Mock Grid ---');
    // We mock req, res for the controller
    let mockReq = {};
    let mockRes = {
      status: (s) => ({
        json: (data) => console.log(`Status ${s}:`, data)
      })
    };
    
    // Clear out existing test data
    await CityCell.deleteMany({});
    await simulationController.initializeGrid(mockReq, mockRes);
    
    // Load state into memory manually for the script
    await stateManager.loadGrid();

    // 2. Fetch initial state
    const initialCells = stateManager.getAllCells();
    console.log(`\nGrid initialized with ${initialCells.length} cells in memory.`);
    console.log('Sample cell before simulation:', JSON.stringify(initialCells[44], null, 2));

    // 3. Run a simulation cycle
    console.log('\n--- Running Simulation Fast Tick 1 ---');
    simulationPipeline.runFastTick();

    // 4. Fetch state after 1st cycle
    let sampleCell = stateManager.getCell('CELL_4_4');
    console.log('Sample cell after 1 fast tick:', JSON.stringify(sampleCell, null, 2));

    // 5. Run another simulation cycle with modified weather (What-If)
    console.log('\n--- Modifying environment (Heavy Rain + High Wind via Queue) ---');
    stateManager.enqueueEvent('CELL_UPDATE', {
      cellId: 'CELL_4_4',
      updates: {
        'weather.rainfall': 20, // heavy rain
        'weather.windSpeed': 15  // high wind
      }
    });
    
    // Wait for queue to process
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('\n--- Running Simulation Slow Tick 1 (Weather effect) ---');
    simulationPipeline.runSlowTick();
    
    console.log('\n--- Running Simulation Fast Tick 2 ---');
    simulationPipeline.runFastTick();

    sampleCell = stateManager.getCell('CELL_4_4');
    console.log('Sample cell after ticks (Post-Rain):', JSON.stringify(sampleCell, null, 2));

    console.log('\n--- Running Global Persist ---');
    await simulationPipeline.runGlobalPersist();

    console.log('\nTest complete.');
    process.exit(0);

  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

runTest();
