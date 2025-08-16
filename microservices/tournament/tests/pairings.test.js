// microservices/tournament/tests/pairings.test.js
// Tests for the arena pairing algorithm.

const { test } = require('node:test');
const assert = require('node:assert');
const { generateArenaPairings } = require('../services/pairingService');

// Helper to flatten pairings into player IDs
function flatten(pairings) {
  return pairings.flatMap(p => [p.player1, p.player2]).filter(Boolean);
}

test('pairs players without duplication', () => {
  const players = ['a', 'b', 'c', 'd'];
  const pairings = generateArenaPairings(players);
  assert.strictEqual(pairings.length, 2);
  const unique = new Set(flatten(pairings));
  assert.strictEqual(unique.size, players.length);
});

test('handles 1000 player arena efficiently', () => {
  const players = Array.from({ length: 1000 }, (_, i) => `p${i}`);
  const start = Date.now();
  const pairings = generateArenaPairings(players);
  const duration = Date.now() - start;
  assert.strictEqual(pairings.length, 500);
  const unique = new Set(flatten(pairings));
  assert.strictEqual(unique.size, players.length);
  // ensure algorithm executes quickly (<1s)
  assert.ok(duration < 1000, `took ${duration}ms`);
});
