import React from 'react';
import { SimulationProvider } from '../context/SimulationContext';
import SimulationControlPanel from '../components/simulation/SimulationControlPanel';
import NodeSelector from '../components/simulation/NodeSelector';
import InteractiveSimulationMap from '../components/simulation/InteractiveSimulationMap';
import ScenarioPanel from '../components/simulation/ScenarioPanel';
import PhysicsPanel from '../components/simulation/PhysicsPanel';
import ForecastingTimeline from '../components/simulation/ForecastingTimeline';
import AnalyticsDashboard from '../components/simulation/AnalyticsDashboard';
import AssimilationPanel from '../components/simulation/AssimilationPanel';

const SimulationDashboard = () => {
  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 font-sans p-3 lg:p-4">
      <div className="max-w-[1800px] mx-auto space-y-3">

        {/* Top Control Bar */}
        <SimulationControlPanel />

        {/* Main layout: 4-column grid on large screens */}
        {/* Col 1: Node Selector | Col 2: Scenario + Physics | Col 3: Map + Timeline | Col 4: Analytics + Assimilation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3"
          style={{ height: 'calc(100vh - 140px)', minHeight: '750px' }}>

          {/* Column 1: Node Selector (2 cols) */}
          <div className="lg:col-span-2 h-full overflow-hidden">
            <NodeSelector />
          </div>

          {/* Column 2: Scenario Lab + Physics Panel (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
            <div style={{ flex: '0 0 55%', minHeight: 0, overflow: 'auto' }}>
              <ScenarioPanel />
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <PhysicsPanel />
            </div>
          </div>

          {/* Column 3: Map + Forecast Timeline (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3 h-full">
            <div className="flex-1 min-h-0">
              <InteractiveSimulationMap />
            </div>
            <ForecastingTimeline />
          </div>

          {/* Column 4: Assimilation + Analytics (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-3 h-full overflow-hidden">
            <div className="flex-none">
              <AssimilationPanel />
            </div>
            <div className="flex-1 min-h-0">
              <AnalyticsDashboard />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const Simulation = () => (
  <SimulationProvider>
    <SimulationDashboard />
  </SimulationProvider>
);

export default Simulation;