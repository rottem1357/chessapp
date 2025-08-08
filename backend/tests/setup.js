const db = require('../models');
const { initializeDatabase } = require('../models/sync');
const config = require('../config');

// Set test environment variables first
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_FORCE_SYNC = 'true';

// Update config object for tests
config.jwt.secret = process.env.JWT_SECRET;

// Global test setup
beforeAll(async () => {
  // Ensure test environment variables are set
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not set for tests');
  }
  
  // Double-check config is updated
  if (config.jwt.secret !== process.env.JWT_SECRET) {
    throw new Error('Config JWT secret not updated for tests');
  }
  
  // Initialize test database
  await initializeDatabase();
});

// Clean up after all tests
afterAll(async () => {
  await db.sequelize.close();
});

// Clean database before each test
beforeEach(async () => {
  try {
    // Use truncate instead of destroy for better PostgreSQL compatibility
    // This will reset all tables and restart identity columns
    await db.sequelize.truncate({ 
      cascade: true, 
      restartIdentity: true 
    });
  } catch (error) {
    console.error('Database cleanup error:', error);
    // Fallback: try individual table cleanup in proper order
    const modelNames = [
      'Move', 'Player', 'Game', 'PuzzleAttempt', 'Puzzle',
      'EngineReport', 'Annotation', 'GameInvitation', 'Friendship',
      'Rating', 'ResetToken', 'UserPreferences', 'User', 'Opening'
    ];
    
    for (const modelName of modelNames) {
      if (db[modelName]) {
        try {
          await db[modelName].destroy({ where: {}, truncate: true });
        } catch (modelError) {
          // Silent fail for individual models that might not exist
          console.warn(`Could not clean ${modelName}:`, modelError.message);
        }
      }
    }
  }
});