// microservices/game-persistence/__tests__/persistenceService.test.js
const assert = require('assert');
const { handleMoveAppended, handleGameFinished, getArchive, __reset } = require('../services/persistenceService');
const { getPartition } = require('../kafka/partition');

(async () => {
  // Idempotent move writes
  __reset();
  await handleMoveAppended({ gameId: 'g1', move: { id: 1, san: 'e4' } });
  await handleMoveAppended({ gameId: 'g1', move: { id: 1, san: 'e4' } });
  let archive = await getArchive('g1');
  assert.strictEqual(archive.doc.moves.length, 1, 'Duplicate moves should not be stored');

  // Idempotent game finished writes
  __reset();
  await handleGameFinished({ gameId: 'g2', result: '1-0' });
  await handleGameFinished({ gameId: 'g2', result: '1-0' });
  archive = await getArchive('g2');
  assert.strictEqual(archive.summary.result, '1-0', 'Result should be stored once');

  // Late move after game finished
  __reset();
  await handleGameFinished({ gameId: 'g3', result: '0-1' });
  await handleMoveAppended({ gameId: 'g3', move: { id: 1, san: 'e4' } });
  archive = await getArchive('g3');
  assert.strictEqual(archive.summary.result, '0-1', 'Result preserved');
  assert.strictEqual(archive.doc.moves.length, 1, 'Late move should be stored');

  // Partition strategy
  const p1 = getPartition('gameA', 32);
  const p2 = getPartition('gameA', 32);
  assert.strictEqual(p1, p2, 'Partition must be stable per game');
  assert.ok(p1 >= 0 && p1 < 32, 'Partition within bounds');

  console.log('All tests passed');
})();
