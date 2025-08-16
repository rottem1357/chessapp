const { listServices } = require('../services/registryService');

const list = (req, res) => {
  res.json({ services: listServices() });
};

module.exports = { list };
