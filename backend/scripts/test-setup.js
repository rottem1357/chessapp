const { execSync } = require('child_process');
const path = require('path');

async function setupTestDatabase() {
  console.log('🏗️  Setting up test database...');
  
  try {
    // Drop and recreate test database
    execSync('dropdb chess_test --if-exists', { stdio: 'inherit' });
    execSync('createdb chess_test', { stdio: 'inherit' });
    
    console.log('✅ Test database created successfully');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };