const { param, body, validationResult } = require('express-validator');

const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map(v => v.run(req)));
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return res.status(400).json({ errors: errors.array() });
};

const getRatings = validate([
  param('userId').notEmpty().withMessage('userId required')
]);

const recalcRatings = validate([
  body('pool').optional().isString()
]);

module.exports = { getRatings, recalcRatings };
