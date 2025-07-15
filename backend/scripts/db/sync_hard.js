const { initializeDatabase, dropAllTables, checkConnection } = require('../../models/sync');
const logger = require('../../utils/logger');

(async () => {
    try {
        logger.info('Checking database connection...');
        await checkConnection();
        logger.info('Database connection successful.');

        logger.info('Dropping all tables...');
        await dropAllTables();
        logger.info('All tables dropped.');

        logger.info('Initializing database...');
        await initializeDatabase();
        logger.info('Database initialized.');

        logger.info('Database synchronization completed successfully');
    } catch (error) {
        logger.error('Database synchronization failed:', error);
        process.exit(1);
    }
})();
