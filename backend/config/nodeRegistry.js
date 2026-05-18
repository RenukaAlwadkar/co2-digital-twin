// Server-side registry of all deployed IoT nodes
// Add a new entry here when you deploy a new physical node

const NODE_REGISTRY = {
  'demo_node_001': {
    city:     'Wardha',
    state:    'Maharashtra',
    lat:      20.7453,
    lng:      78.5994,
    address:  'Wardha, Maharashtra, India',
    deployed: '2026-05-18',
  },
  // Future nodes:
  // 'delhi_node_001': { city: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, ... }
};

module.exports = NODE_REGISTRY;
