module.exports = {
  // MQ Sensor physical calibration constants
  // Note: In MVP these are hardcoded, but eventually these should be in a MongoDB collection per node.
  MQ135: {
    RL: 10.0, // Load resistor (kOhm)
    R0: 76.63, // Clean air resistance (kOhm) - requires calibration
    CURVES: {
      CO2: { A: 110.47, k: -2.862 },
      CO:  { A: 605.18, k: -3.937 },
      NH3: { A: 102.2,  k: -2.473 }
    }
  },
  MQ7: {
    RL: 10.0,
    R0: 27.0,
    CURVES: {
      CO: { A: 99.042, k: -1.518 } // ppm = A * (Rs/R0)^k
    }
  },
  
  // Voltages
  V_IN: 5.0,
  ADC_RESOLUTION: 4095 // ESP32 12-bit ADC
};
