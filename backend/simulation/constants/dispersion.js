module.exports = {
  // Pasquill-Gifford Stability Classes (A-F) based on wind speed and insolation
  STABILITY_CLASSES: {
    A: { description: 'Very Unstable', diffusionRate: 0.15 },
    B: { description: 'Moderately Unstable', diffusionRate: 0.12 },
    C: { description: 'Slightly Unstable', diffusionRate: 0.08 },
    D: { description: 'Neutral', diffusionRate: 0.05 }, // Typical overcast or high wind
    E: { description: 'Slightly Stable', diffusionRate: 0.03 },
    F: { description: 'Stable', diffusionRate: 0.01 } // Nighttime inversion, highly trapped
  },

  // Base dispersion parameters
  BASE_DIFFUSION_COEFFICIENT: 0.05,
  
  // Urban vs Rural correction (Urban has more turbulence due to buildings)
  URBAN_TURBULENCE_MULTIPLIER: 1.2,
  RURAL_TURBULENCE_MULTIPLIER: 0.8,
  
  // Wind attenuation (street canyon effect)
  STREET_CANYON_ATTENUATION: 0.6 // Wind speed is reduced at street level
};
