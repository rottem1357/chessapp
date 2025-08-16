const { client } = require('../db/redis');

async function getSnapshot(id) {
  const fen = await client.get(`game:${id}:fen`);
  const clock = await client.get(`game:${id}:clock`);
  return {
    fen,
    clock: clock ? JSON.parse(clock) : null
  };
}

async function saveSnapshot(id, fen, clock) {
  await client.set(`game:${id}:fen`, fen);
  if (clock) {
    await client.set(`game:${id}:clock`, JSON.stringify(clock));
  }
}

async function deleteSnapshot(id) {
  await client.del(`game:${id}:fen`);
  await client.del(`game:${id}:clock`);
}

module.exports = {
  getSnapshot,
  saveSnapshot,
  deleteSnapshot
};
