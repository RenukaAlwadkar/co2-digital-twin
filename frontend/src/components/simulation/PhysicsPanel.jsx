import React from 'react';
import { FlaskConical, BookOpen } from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

const FormulaBlock = ({ title, formula, params, accent }) => (
  <div className="border border-gray-200 rounded-xl p-3 mb-3">
    <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>{title}</h4>
    <pre className="bg-gray-50 border border-gray-100 rounded-lg p-2 mb-2 font-mono text-xs text-gray-700 leading-relaxed whitespace-pre-wrap overflow-x-auto">{formula}</pre>
    <table className="w-full text-xs">
      <tbody>
        {params.map(([key, val, live]) => (
          <tr key={key} className="border-t border-gray-50">
            <td className="py-0.5 text-gray-400 pr-2">{key}</td>
            <td className={`py-0.5 font-mono font-semibold text-right ${live ? 'text-orange-600' : 'text-gray-600'}`}>{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PhysicsPanel = () => {
  const { baselineConditions, gridState } = useSimulation();
  const centerCell = gridState.find(c => c.cellId === 'CELL_4_4');
  const w = baselineConditions?.weather || centerCell?.weather || {};
  const windSpeed = w.windSpeed || 5;
  const rainfall = w.rainfall || 0;

  const stabilityClass = windSpeed >= 10 ? 'D (Neutral)' : windSpeed >= 5 ? 'C (Slightly Unstable)' : windSpeed >= 2 ? 'E (Slightly Stable)' : 'F (Very Stable — Inversion risk)';
  const scavCoeff = (0.0003 + rainfall * 0.00002).toFixed(5);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col shadow-sm h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
        <FlaskConical className="text-purple-600" size={16}/>
        <div>
          <h2 className="text-sm font-bold text-gray-800">Active Environmental Models</h2>
          <p className="text-xs text-gray-400">Research-paper-based coefficients (live values in orange)</p>
        </div>
      </div>

      {!baselineConditions && (
        <div className="mb-3 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg p-3">
          Select a node to see live coefficient values from real environmental data.
        </div>
      )}

      <FormulaBlock
        title="Atmospheric Dispersion (Pasquill-Gifford)"
        accent="#8b5cf6"
        formula={"C(x,y,z) = Q / (2π·σy·σz·u)\n  · exp(−y²/2σy²)\n  · [exp(−(z−h)²/2σz²) + exp(−(z+h)²/2σz²)]"}
        params={[
          ['Stability Class', stabilityClass, !!baselineConditions],
          ['Base Diffusion σ', '0.05 m', false],
          ['Urban Turbulence mult.', '1.2×', false],
          ['Wind Speed u', `${windSpeed} m/s`, !!baselineConditions],
        ]}
      />

      <FormulaBlock
        title="Traffic Emissions (COPERT IV)"
        accent="#ea580c"
        formula={"E = Σᵢ [Fᵢ · EFᵢ(v) · L]\nEFᵢ(v) = a·v⁻ᵇ + c + d·v + e·v²"}
        params={[
          ['PM2.5 EF (petrol car)', '0.003 g/km', false],
          ['NO2 EF (diesel car)', '0.04 g/km', false],
          ['Congestion mult. (v<15km/h)', '2.5×', false],
        ]}
      />

      <FormulaBlock
        title="Wet Scavenging — Sekhon & Srivastava (1971)"
        accent="#2563eb"
        formula={"C(t) = C₀ · exp(−Λ·t)\nΛ = a · Rᵇ"}
        params={[
          ['PM2.5 scavenging Λ', scavCoeff, !!baselineConditions],
          ['Rainfall R', `${rainfall} mm/h`, !!baselineConditions],
          ['Coefficient a', '8.4 × 10⁻⁵', false],
          ['Exponent b', '0.79', false],
        ]}
      />

      <FormulaBlock
        title="Dry Deposition (Vegetation Sink)"
        accent="#16a34a"
        formula={"Fd = vd · C · LAI_factor\nΔC/Δt = −vd · C · (A_cell / V_cell)"}
        params={[
          ['PM2.5 deposition vel. vd', '0.001 m/s', false],
          ['PM10 deposition vel. vd', '0.003 m/s', false],
          ['LAI (deciduous urban)', '1.2', false],
        ]}
      />

      <div className="mt-auto pt-3 border-t border-gray-100">
        <div className="flex items-start gap-1.5 text-xs text-gray-400">
          <BookOpen size={11} className="mt-0.5 flex-shrink-0"/>
          <span>References: CPCB AQI Standard 2014 · COPERT IV (EEA) · Sekhon & Srivastava 1971 · Seinfeld & Pandis 2006 · EPA AP-42</span>
        </div>
      </div>
    </div>
  );
};

export default PhysicsPanel;
