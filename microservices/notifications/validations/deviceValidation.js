module.exports = (req, res, next) => {
  const { userId, token } = req.body || {};
  if (!userId || !token) {
    return res.status(400).json({ error: 'userId and token required' });
  }
  next();
};
