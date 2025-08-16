const { Pool } = require('pg');
const logger = require('../utils/logger');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://chat_user:chat_password@localhost:5432/chat_db';

const pool = new Pool({ connectionString: DATABASE_URL });

async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    room TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  logger.info('Postgres initialized');
}

init().catch(err => logger.error('Postgres init error', { error: err.message }));

module.exports = pool;
