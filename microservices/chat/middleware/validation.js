const { query, param, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};

const validateHistory = validate([
  query('room').optional().isString().trim().isLength({ max: 100 })
]);

const validatePresence = validate([
  param('user').isString().trim().notEmpty()
]);

module.exports = { validateHistory, validatePresence };
