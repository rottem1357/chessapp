const { updateFlag } = require('../services/flagService');

const putFlag = (req, res) => {
  const { value, rollout } = req.body;
  const result = updateFlag(req.params.key, value, rollout);
  res.json(result);
};

module.exports = { putFlag };
