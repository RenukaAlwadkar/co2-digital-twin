const CityCell = require('../models/CityCell');

class StateManager {
  constructor() {
    this.grid = new Map(); // cellId -> cell object
    this.eventQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Loads the grid from the database into memory.
   */
  async loadGrid() {
    const cells = await CityCell.find({}).lean(); // Use lean for plain JS objects
    cells.forEach(cell => {
      this.grid.set(cell.cellId, cell);
    });
    this._computeNeighbors();
    console.log(`[StateManager] Loaded ${this.grid.size} cells into memory.`);
  }

  /**
   * Initializes neighbor references for diffusion.
   * Assuming cellIds are like 'CELL_i_j'
   */
  _computeNeighbors() {
    for (const [id, cell] of this.grid.entries()) {
      cell.neighbors = [];
      const parts = id.split('_');
      if (parts.length === 3) {
        const i = parseInt(parts[1], 10);
        const j = parseInt(parts[2], 10);
        
        // 8-way connectivity
        const directions = [
          [-1, 0], [1, 0], [0, -1], [0, 1], // N, S, W, E
          [-1, -1], [-1, 1], [1, -1], [1, 1] // NW, NE, SW, SE
        ];

        for (const [di, dj] of directions) {
          const neighborId = `CELL_${i + di}_${j + dj}`;
          if (this.grid.has(neighborId)) {
            cell.neighbors.push(neighborId);
          }
        }
      }
      
      // Initialize attribution if not present
      if (!cell.attribution) {
        cell.attribution = { traffic: 0, industry: 0, background: 100 };
      }
    }
  }

  /**
   * Gets all cells in memory.
   */
  getAllCells() {
    return Array.from(this.grid.values());
  }

  /**
   * Gets a specific cell.
   */
  getCell(cellId) {
    return this.grid.get(cellId);
  }

  /**
   * Updates a cell in memory and triggers local propagation if needed.
   */
  updateCell(cellId, updates) {
    const cell = this.grid.get(cellId);
    if (cell) {
      // Handle potential dot-notation in updates (e.g., 'weather.rainfall')
      for (const [key, value] of Object.entries(updates)) {
        if (key.includes('.')) {
          const parts = key.split('.');
          let current = cell;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = value;
        } else {
          cell[key] = value;
        }
      }
      cell.lastUpdated = new Date();
    }
  }

  /**
   * Enqueues a simulation event (e.g., weather change, user what-if)
   */
  enqueueEvent(eventType, payload) {
    this.eventQueue.push({ type: eventType, payload, timestamp: Date.now() });
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.isProcessingQueue = true;
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      await this.handleEvent(event);
    }
    this.isProcessingQueue = false;
  }

  async handleEvent(event) {
    console.log(`[StateManager] Handling event: ${event.type}`);
    // Handle specific event logic (e.g., 'WEATHER_UPDATE', 'TRAFFIC_SPIKE')
    if (event.type === 'CELL_UPDATE') {
      const { cellId, updates } = event.payload;
      this.updateCell(cellId, updates);
    }
  }

  /**
   * Periodically persists the in-memory grid back to MongoDB.
   */
  async persistToDatabase() {
    console.log('[StateManager] Persisting state to MongoDB...');
    const cells = this.getAllCells();
    const bulkOps = cells.map(cell => {
      // Remove in-memory only fields before saving
      const { neighbors, ...dbCell } = cell;
      return {
        updateOne: {
          filter: { cellId: cell.cellId },
          update: { $set: dbCell },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      await CityCell.bulkWrite(bulkOps);
    }
    console.log('[StateManager] Persistence complete.');
  }
}

module.exports = new StateManager();
