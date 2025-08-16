function requireAuth(req, res, next) {
  const userId = req.header('x-user-id');
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.userId = userId;
  next();
}

module.exports = requireAuth;
