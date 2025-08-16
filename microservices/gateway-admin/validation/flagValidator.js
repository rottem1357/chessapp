const validateFlagUpdate = (req, res, next) => {
  const { value, rollout = 100 } = req.body;
  if (typeof value !== 'boolean') {
    return res.status(400).json({ error: 'value must be boolean' });
  }
  if (rollout < 0 || rollout > 100) {
    return res.status(400).json({ error: 'rollout must be between 0 and 100' });
  }
  next();
};

module.exports = { validateFlagUpdate };
