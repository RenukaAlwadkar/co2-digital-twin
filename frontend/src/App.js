import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import IoTNodes from './pages/IoTNodes';
import Alerts from './pages/Alerts';
import Simulation from './pages/Simulation';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <div className="flex bg-gray-50 text-gray-900 h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<LiveMap />} />
            <Route path="/nodes" element={<IoTNodes />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
