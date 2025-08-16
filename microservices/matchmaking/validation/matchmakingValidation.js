// validation/matchmakingValidation.js
const Joi = require('joi');

function validate(schema, property) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property]);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    req[property] = value;
    next();
  };
}

const joinSchema = Joi.object({
  playerId: Joi.string().required(),
  mode: Joi.string().required(),
  rating: Joi.number().required(),
  region: Joi.string().optional(),
});

const leaveSchema = Joi.object({
  playerId: Joi.string().required(),
  mode: Joi.string().required(),
});

const stateSchema = Joi.object({
  mode: Joi.string().required(),
});

module.exports = {
  validateJoin: validate(joinSchema, 'body'),
  validateLeave: validate(leaveSchema, 'body'),
  validateState: validate(stateSchema, 'query'),
};
