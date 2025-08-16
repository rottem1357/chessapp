const { setFlag } = require('../models/featureFlagModel');
const logger = require('../utils/logger');

const updateFlag = (key, value, rollout = 100) => {
  const flag = { value, rollout, updatedAt: new Date().toISOString() };
  setFlag(key, flag);
  logger.info(`[audit] flag_updated key=${key} value=${value} rollout=${rollout}`);
  return { key, ...flag };
};

module.exports = { updateFlag };
