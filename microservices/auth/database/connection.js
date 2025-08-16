// microservices/auth/database/connection.js
const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

let pool = null;

async function connectDatabase() {
  try {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connection established', {
      host: config.database.host,
      database: config.database.name
    });

    return pool;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    throw error;
  }
}

async function checkConnection() {
  try {
    if (!pool) return false;
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return false;
  }
}

async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

module.exports = {
  connectDatabase,
  checkConnection,
  closeConnection,
  getPool
};