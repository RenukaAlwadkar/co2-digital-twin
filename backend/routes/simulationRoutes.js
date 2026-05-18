const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');

// Route to initialize the mock grid
router.post('/init', simulationController.initializeGrid);

// Route to get the current state of all cells
router.get('/state', simulationController.getGridState);

// Route to manually force a simulation cycle (What-If engine trigger)
router.post('/trigger', simulationController.triggerCycle);

// Route to update a specific cell's environmental factors
router.patch('/cell/:cellId', simulationController.updateCellParameters);

// Route to reset the simulation grid completely
router.delete('/reset', simulationController.resetGrid);

module.exports = router;
