// database/sync.js
const db = require('../models');
const logger = require('../utils/logger');

/**
 * Initialize database connection and sync models
 */
async function initializeDatabase() {
  try {
    logger.info('Starting database initialization...');

    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync all models (create tables)
    const syncOptions = {
      force: process.env.NODE_ENV === 'development' && process.env.DB_FORCE_SYNC === 'true',
      alter: process.env.NODE_ENV === 'development' && process.env.DB_ALTER === 'true'
    };

    await db.sequelize.sync(syncOptions);
    logger.info('Database tables synchronized successfully');
    
    return true;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
async function closeDatabase() {
  try {
    await db.sequelize.close();
    logger.info('Database connection closed successfully');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}

/**
 * Drop all tables (use with caution)
 */
async function dropAllTables() {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop tables in production environment');
    }

    logger.warn('Dropping all database tables...');
    await db.sequelize.drop();
    logger.info('All tables dropped successfully');
  } catch (error) {
    logger.error('Error dropping tables:', error);
    throw error;
  }
}

/**
 * Check database connection
 */
async function checkConnection() {
  try {
    await db.sequelize.authenticate();
    logger.info('Database connection is healthy');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

module.exports = {
  initializeDatabase,
  closeDatabase,
  dropAllTables,
  checkConnection
};