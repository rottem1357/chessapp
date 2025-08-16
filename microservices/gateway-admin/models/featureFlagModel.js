const featureFlags = new Map();

const setFlag = (key, flag) => {
  featureFlags.set(key, flag);
};

const getFlag = (key) => featureFlags.get(key);

module.exports = { setFlag, getFlag };
