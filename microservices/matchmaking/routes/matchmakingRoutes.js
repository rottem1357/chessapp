// routes/matchmakingRoutes.js
const router = require('express').Router();
const {
  validateJoin,
  validateLeave,
  validateState,
} = require('../validation/matchmakingValidation');
const controller = require('../controllers/matchmakingController');

router.post('/queue/join', validateJoin, controller.join);
router.post('/queue/leave', validateLeave, controller.leave);
router.get('/queue/state', validateState, controller.state);

module.exports = router;
