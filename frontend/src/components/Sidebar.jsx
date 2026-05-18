import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Globe, Radio, TestTube, BarChart2, Bell, Wifi, Database, Activity } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/' },
    { name: 'Live Map', icon: <Globe size={20} />, path: '/map' },
    { name: 'IoT Nodes', icon: <Radio size={20} />, path: '/nodes' },
    { name: 'Simulation', icon: <TestTube size={20} />, path: '/simulation' },
    { name: 'Analytics', icon: <BarChart2 size={20} />, path: '/analytics' },
    { name: 'Alerts', icon: <Bell size={20} />, path: '/alerts' },
  ];

  return (
    <div className="w-64 h-screen bg-white text-gray-900 flex flex-col justify-between p-4 border-r border-gray-200 shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-blue-600 mb-8 tracking-wider">URBAN CO2 <span className="text-gray-900">DIGITAL TWIN</span></h1>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                    : 'hover:bg-gray-50 hover:text-blue-600 text-gray-600'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* System Status Bottom Section */}
      <div className="space-y-3 bg-gray-50 p-4 rounded-xl text-sm border border-gray-200">
        <h3 className="text-gray-500 uppercase text-xs font-semibold mb-2">System Status</h3>
        <div className="flex items-center space-x-2 text-green-600">
          <Wifi size={16} />
          <span>MQTT Connected</span>
        </div>
        <div className="flex items-center space-x-2 text-green-600">
          <Activity size={16} />
          <span>AQI API Live</span>
        </div>
        <div className="flex items-center space-x-2 text-green-600">
          <Database size={16} />
          <span>MongoDB Connected</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;