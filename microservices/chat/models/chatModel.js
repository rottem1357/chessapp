const pool = require('../db/postgres');

async function saveMessage(room, senderId, message) {
  await pool.query(
    'INSERT INTO chat_messages (room, sender_id, message) VALUES ($1, $2, $3)',
    [room, senderId, message]
  );
}

async function getHistory(room, limit = 50) {
  const { rows } = await pool.query(
    'SELECT sender_id, message, room, created_at FROM chat_messages WHERE room = $1 ORDER BY created_at DESC LIMIT $2',
    [room, limit]
  );
  return rows;
}

module.exports = { saveMessage, getHistory };
