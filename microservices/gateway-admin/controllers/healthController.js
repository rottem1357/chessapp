const { getJWKS } = require('../services/jwksService');

const health = (req, res) => {
  res.json({ status: 'ok', jwks: getJWKS() });
};

const ready = (req, res) => {
  res.json({ status: 'ready' });
};

module.exports = { health, ready };
