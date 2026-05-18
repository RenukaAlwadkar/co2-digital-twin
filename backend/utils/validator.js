const validatePayload = (data) => {

  if (!data.nodeId) {
    return "Missing nodeId";
  }

  if (!data.sensors) {
    return "Missing sensors object";
  }

  const s = data.sensors;

  if (s.temperature < -50 || s.temperature > 100) {
    return "Invalid temperature";
  }

  if (s.humidity < 0 || s.humidity > 100) {
    return "Invalid humidity";
  }

  return null;
};

module.exports = validatePayload;