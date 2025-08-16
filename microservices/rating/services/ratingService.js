const { updateRating, defaultRating, defaultRD, defaultVol } = require('./glicko2');
const ratingModel = require('../models/ratingModel');

class RatingService {
  _getPlayer(userId, pool) {
    let player = ratingModel.getRating(userId, pool);
    if (!player) {
      player = { rating: defaultRating, rd: defaultRD, vol: defaultVol };
      ratingModel.setRating(userId, pool, player);
    }
    return player;
  }

  getRatings(userId) {
    return ratingModel.getRatingsByUser(userId);
  }

  recordResult(userId, opponentId, score, pool = 'global', saveHistory = true) {
    const player = this._getPlayer(userId, pool);
    const opponent = this._getPlayer(opponentId, pool);

    const newPlayer = updateRating(player, [{ rating: opponent.rating, rd: opponent.rd, score }]);
    const newOpponent = updateRating(opponent, [{ rating: player.rating, rd: player.rd, score: 1 - score }]);

    ratingModel.setRating(userId, pool, newPlayer);
    ratingModel.setRating(opponentId, pool, newOpponent);

    if (saveHistory) {
      ratingModel.addHistory({ userId, opponentId, score, pool });
    }
  }

  recalculate(pool) {
    ratingModel.clearRatings(pool);
    const relevant = ratingModel.getHistory(pool);
    relevant.forEach(h => {
      this.recordResult(h.userId, h.opponentId, h.score, h.pool, false);
    });
  }

  reset() {
    ratingModel.reset();
  }
}

module.exports = new RatingService();
