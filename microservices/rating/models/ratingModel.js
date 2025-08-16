class RatingModel {
  constructor() {
    this.ratings = new Map();
    this.history = [];
  }

  _key(userId, pool) {
    return `${userId}:${pool}`;
  }

  getRating(userId, pool) {
    return this.ratings.get(this._key(userId, pool)) || null;
  }

  setRating(userId, pool, data) {
    this.ratings.set(this._key(userId, pool), data);
  }

  getRatingsByUser(userId) {
    const res = [];
    for (const [key, value] of this.ratings.entries()) {
      const [uid, pool] = key.split(':');
      if (uid === userId) {
        res.push({ pool, ...value });
      }
    }
    return res.length ? res : null;
  }

  addHistory(record) {
    this.history.push(record);
  }

  getHistory(pool) {
    return pool ? this.history.filter(h => h.pool === pool) : this.history;
  }

  clearRatings(pool) {
    if (pool) {
      for (const key of Array.from(this.ratings.keys())) {
        const [, p] = key.split(':');
        if (p === pool) {
          this.ratings.delete(key);
        }
      }
    } else {
      this.ratings.clear();
    }
  }

  reset() {
    this.ratings.clear();
    this.history = [];
  }
}

module.exports = new RatingModel();
