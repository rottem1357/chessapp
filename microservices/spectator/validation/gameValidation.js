const { param, query, validationResult } = require('express-validator');

const validateGameState = [
  param('id').notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return next();
  }
];

const validateMoves = [
  param('id').notEmpty(),
  query('since').optional().isInt({ min: 0 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return next();
  }
];

module.exports = { validateGameState, validateMoves };
