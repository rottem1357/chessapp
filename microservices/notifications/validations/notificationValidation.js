module.exports = (req, res, next) => {
  const { idempotencyKey, message } = req.body || {};
  if (!idempotencyKey || !message) {
    return res.status(400).json({ error: 'idempotencyKey and message required' });
  }
  next();
};
