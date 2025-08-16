// controllers/matchmakingController.js
const matchmakingService = require('../services/matchmakingService');

async function join(req, res) {
  const result = await matchmakingService.joinQueue(req.body);
  res.json(result);
}

async function leave(req, res) {
  const result = await matchmakingService.leaveQueue(req.body);
  res.json(result);
}

async function state(req, res) {
  const result = await matchmakingService.getQueueState(req.query.mode);
  res.json(result);
}

module.exports = {
  join,
  leave,
  state,
};
