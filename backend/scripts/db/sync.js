const { initializeDatabase, checkConnection } = require('../../models/sync');
const logger = require('../../utils/logger');

(async () => {
  try {
    await checkConnection();
    logger.info('Database connection successful.');

    await initializeDatabase();
    logger.info('Database synchronization completed successfully');
  } catch (error) {
    logger.error('Database synchronization failed:', error);
    process.exit(1);
  }
})();
