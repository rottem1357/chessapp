const db = require('../models');
const { initializeDatabase } = require('../models/sync');

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.DB_FORCE_SYNC = 'true';
  
  // Initialize test database
  await initializeDatabase();
});

// Clean up after all tests
afterAll(async () => {
  await db.sequelize.close();
});

// Clean database before each test
beforeEach(async () => {
  // Truncate all tables in reverse order to avoid foreign key constraints
  const models = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize');
  
  for (const modelName of models.reverse()) {
    if (db[modelName].destroy) {
      await db[modelName].destroy({ where: {}, force: true });
    }
  }
});