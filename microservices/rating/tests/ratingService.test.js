const ratingService = require('../services/ratingService');

describe('RatingService Glicko-2 updates', () => {
  afterEach(() => {
    ratingService.reset();
  });

  test('winning against equal opponent increases rating', () => {
    ratingService.recordResult('p1', 'p2', 1, 'rapid');
    const p1 = ratingService.getRatings('p1').find(r => r.pool === 'rapid');
    expect(p1.rating).toBeGreaterThan(1500);
  });

  test('rating deviation decreases after multiple games', () => {
    ratingService.recordResult('a', 'b', 1, 'rapid');
    ratingService.recordResult('a', 'c', 0, 'rapid');
    ratingService.recordResult('a', 'd', 0.5, 'rapid');
    const rating = ratingService.getRatings('a').find(r => r.pool === 'rapid');
    expect(rating.rd).toBeLessThan(350);
  });
});
