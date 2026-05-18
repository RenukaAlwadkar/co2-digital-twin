"use strict";

// ══════════════════════════════════════════════════════════════════════════════
// IoT AQI Calculator — 7-Step Engine
// Based on CPCB breakpoints + MQ135/MQ7 Figaro datasheet equations
// ══════════════════════════════════════════════════════════════════════════════

// ─── Hardware Constants ───────────────────────────────────────────────────────
const ADC_MAX     = 4095;   // ESP32 12-bit ADC
const ADC_VCC     = 3.3;    // ESP32 ADC reference voltage (V)
const CIRCUIT_VCC = 5.0;    // MQ sensor supply voltage (V)
const MQ135_RL    = 10000;  // MQ135 load resistance (Ω)
const MQ7_RL      = 10000;  // MQ7   load resistance (Ω)

// R0: sensor resistance in clean air (20°C, 65% RH) — Figaro datasheet values
const MQ135_R0 = 76630;   // ~76.63 kΩ
const MQ7_R0   = 27580;   // ~27.58 kΩ

// ─── MQ Curve-Fit Coefficients (power law: ppm = a * (Rs/R0)^b) ─────────────
// MQ135 — Figaro datasheet + research paper fit
const MQ135_CO2 = { a: 116.6020682, b: -2.769034857 };
const MQ135_NO2 = { a: 110.47,      b: -2.862       };
// MQ7 — Figaro MQ-7 datasheet fit
const MQ7_CO    = { a: 99.042,      b: -1.518       };

// ─── CPCB AQI Breakpoints ─────────────────────────────────────────────────────
// Format: [concLow, concHigh, aqiLow, aqiHigh]
const BP = {
  pm25: [
    [0,   30,  0,   50 ], [30,  60,  51,  100],
    [60,  90,  101, 200], [90,  120, 201, 300],
    [120, 250, 301, 400], [250, 500, 401, 500],
  ],
  pm10: [
    [0,   50,  0,   50 ], [50,  100, 51,  100],
    [100, 250, 101, 200], [250, 350, 201, 300],
    [350, 430, 301, 400], [430, 600, 401, 500],
  ],
  no2: [  // μg/m³
    [0,   40,  0,   50 ], [40,  80,  51,  100],
    [80,  180, 101, 200], [180, 280, 201, 300],
    [280, 400, 301, 400], [400, 800, 401, 500],
  ],
  co: [  // mg/m³
    [0,  1,  0,   50 ], [1,  2,  51,  100],
    [2,  10, 101, 200], [10, 17, 201, 300],
    [17, 34, 301, 400], [34, 50, 401, 500],
  ],
};

// ─── Step 1: ADC integer → Voltage (V) ───────────────────────────────────────
const adcToVoltage = (adc) => (adc / ADC_MAX) * ADC_VCC;

// ─── Step 2: Voltage across RL → Sensor resistance Rs ────────────────────────
// Circuit: VCC --[Rs]--+--[RL]-- GND   (ADC reads at junction = V across RL)
// Rs = RL * (Vcc - Vrl) / Vrl
const voltageToRs = (vRL, RL) => {
  if (vRL <= 0) return RL * 999;
  return RL * (CIRCUIT_VCC - vRL) / vRL;
};

// ─── Step 3: Rs/R0 ratio → ppm (power law from datasheet) ───────────────────
const computePPM = (Rs, R0, { a, b }) => {
  const ratio = Rs / R0;
  if (ratio <= 0) return 0;
  return a * Math.pow(ratio, b);
};

// ─── Step 6: CPCB linear interpolation formula ───────────────────────────────
// AQI = ((Ihi - Ilo) / (BPhi - BPlo)) * (Cp - BPlo) + Ilo
const calcSubIndex = (conc, pollutant) => {
  const table = BP[pollutant];
  if (!table || conc < 0) return 0;
  for (const [cLo, cHi, iLo, iHi] of table) {
    if (conc >= cLo && conc <= cHi) {
      return ((iHi - iLo) / (cHi - cLo)) * (conc - cLo) + iLo;
    }
  }
  return conc > table[table.length - 1][1] ? 500 : 0;
};

// ══════════════════════════════════════════════════════════════════════════════
// Main Export: calculateIoTAQI(payload) → { estAqi, estPollutants, subIndices, dominantPollutant }
// ══════════════════════════════════════════════════════════════════════════════
const calculateIoTAQI = (payload) => {
  const {
    mq135 = 0,
    mq7   = 0,
    temperature = 25,
    humidity    = 50,
    pressure    = 1013,
  } = payload;

  // ── Step 1: ADC → Voltage ─────────────────────────────────────────────────
  const v135 = adcToVoltage(mq135);
  const v7   = adcToVoltage(mq7);

  // ── Step 2: Voltage → Rs ─────────────────────────────────────────────────
  const rs135 = voltageToRs(v135, MQ135_RL);
  const rs7   = voltageToRs(v7,   MQ7_RL);

  // ── Step 3: Raw ppm concentrations ───────────────────────────────────────
  const co2Ppm = computePPM(rs135, MQ135_R0, MQ135_CO2); // CO2 equivalent
  const no2Ppm = computePPM(rs135, MQ135_R0, MQ135_NO2); // NO2
  const coPpm  = computePPM(rs7,   MQ7_R0,   MQ7_CO);   // CO

  // ── Step 4: Derive pollutant concentrations ───────────────────────────────
  // PM2.5 (μg/m³): empirical proxy from CO2-equivalent using urban IoT scaling
  let pm25 = co2Ppm * 0.12;
  // PM10 ≈ PM2.5 × 1.5 (Indian urban ratio from CPCB studies)
  let pm10 = pm25 * 1.5;
  // NO2 (μg/m³): 1 ppm NO2 ≈ 1912 μg/m³ at 25°C, 1 atm
  let no2  = no2Ppm * 1912;
  // CO (mg/m³): 1 ppm CO ≈ 1.145 mg/m³
  let co   = coPpm * 1.145;

  // ── Step 5: Environmental corrections ────────────────────────────────────

  // Humidity: high humidity retains particulates (+0.5% per % above 50%)
  const humFactor  = 1 + (humidity - 50) * 0.005;
  pm25 *= humFactor;
  pm10 *= humFactor;

  // Temperature: high temp increases reaction rates for NO2 & CO
  const tempFactor = 1 + (temperature - 25) * 0.01;
  no2 *= tempFactor;
  co  *= tempFactor;

  // Pressure: lower pressure → less dispersion → effectively higher concentration
  const presFactor = 1013 / Math.max(pressure, 900);
  pm25 *= presFactor;
  pm10 *= presFactor;
  no2  *= presFactor;
  co   *= presFactor;

  // Clamp negatives
  pm25 = Math.max(0, pm25);
  pm10 = Math.max(0, pm10);
  no2  = Math.max(0, no2);
  co   = Math.max(0, co);

  // ── Step 6: Sub-index AQI per pollutant (CPCB interpolation) ────────────
  const aqiPM25 = calcSubIndex(pm25, 'pm25');
  const aqiPM10 = calcSubIndex(pm10, 'pm10');
  const aqiNO2  = calcSubIndex(no2,  'no2');
  const aqiCO   = calcSubIndex(co,   'co');

  // ── Step 7: Final AQI = MAX of all sub-indices ────────────────────────────
  const subArr     = [aqiPM25, aqiPM10, aqiNO2, aqiCO];
  const pollNames  = ['pm25', 'pm10', 'no2', 'co'];
  const maxIdx     = subArr.indexOf(Math.max(...subArr));
  const finalAQI   = Math.round(Math.max(...subArr));

  return {
    estAqi:             finalAQI,
    dominantPollutant:  pollNames[maxIdx],
    estPollutants: {
      pm25: +pm25.toFixed(2),
      pm10: +pm10.toFixed(2),
      no2:  +no2.toFixed(2),
      co:   +co.toFixed(4),
    },
    subIndices: {
      pm25: +aqiPM25.toFixed(1),
      pm10: +aqiPM10.toFixed(1),
      no2:  +aqiNO2.toFixed(1),
      co:   +aqiCO.toFixed(1),
    },
  };
};

module.exports = calculateIoTAQI;
