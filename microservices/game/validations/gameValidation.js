const { param } = require('express-validator');

const validateGameId = [
  param('id').isString().notEmpty()
];

module.exports = {
  validateGameId
};
